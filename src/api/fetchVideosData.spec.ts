import { fetchDataLive, fetchDataVideo } from "@/api/fetchVideosData";
import { fetchJsonWithTimeout } from "./externalRequest";

jest.mock("./externalRequest", () => {
  const actual = jest.requireActual("./externalRequest");
  return {
    ...actual,
    fetchJsonWithTimeout: jest.fn(actual.fetchJsonWithTimeout),
  };
});

const mockFetchJsonWithTimeout = jest.mocked(fetchJsonWithTimeout);

const API_KEY = "SUPER_SECRET_KEY";
const MAIN_CHANNEL = "UCaJscJxs5LEuwFShmKr39tg";
const SERIE_CHANNEL = "UCwEtLdRuDPN96HEPzcy5mig";

function jsonResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(data),
  };
}

function validPayload() {
  return { items: [{ id: { videoId: "PAYLOAD_MARKER_ID" } }] };
}

function invalidPayload() {
  return { items: [{ id: { videoId: "" } }], snippet: "PAYLOAD_MARKER" };
}

async function expectSafeRejection(promise: Promise<unknown>) {
  try {
    await promise;
    throw new Error("expected the video lookup to reject");
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
    if (!(error instanceof Error)) return;
    expect(error.message).not.toContain(API_KEY);
    expect(error.message).not.toContain("youtube/v3/search");
    expect(error.message).not.toContain("PAYLOAD_MARKER");
  }
}

describe("fetchDataVideo", () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    const actual = jest.requireActual<typeof import("./externalRequest")>(
      "./externalRequest"
    );
    mockFetchJsonWithTimeout.mockClear();
    mockFetchJsonWithTimeout.mockImplementation(actual.fetchJsonWithTimeout);
  });

  it("returns validated data with preserved cache options", async () => {
    const payload = validPayload();
    fetchMock.mockResolvedValue(jsonResponse(payload));

    await expect(fetchDataVideo(API_KEY, MAIN_CHANNEL, "any")).resolves.toEqual(
      payload
    );
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain(`key=${API_KEY}`);
    expect(url).toContain(`channelId=${MAIN_CHANNEL}`);
    expect(url).toContain("part=snippet,id");
    expect(url).toContain("videoDuration=any");
    expect(init.next).toEqual({ revalidate: 300 });
  });

  it("throws a safe error for an HTTP failure", async () => {
    fetchMock.mockResolvedValue(jsonResponse(null, 403));
    await expectSafeRejection(fetchDataVideo(API_KEY, MAIN_CHANNEL, "any"));
    await expect(fetchDataVideo(API_KEY, MAIN_CHANNEL, "any")).rejects.toThrow(
      "YouTube API responded with 403"
    );
  });

  it("throws a safe error for a network failure", async () => {
    fetchMock.mockRejectedValue(new Error(`failed with key=${API_KEY}`));
    await expectSafeRejection(fetchDataVideo(API_KEY, MAIN_CHANNEL, "any"));
    await expect(fetchDataVideo(API_KEY, MAIN_CHANNEL, "any")).rejects.toThrow(
      "YouTube API request failed"
    );
  });

  it.each([undefined, "", "   \t "])(
    "makes no request when the key is %p",
    async (key) => {
      await expect(fetchDataVideo(key, SERIE_CHANNEL, "any")).rejects.toThrow(
        "LATEST_VIDEO"
      );
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );

  it("rejects an invalid payload with a safe error", async () => {
    fetchMock.mockResolvedValue(jsonResponse(invalidPayload()));
    await expectSafeRejection(fetchDataVideo(API_KEY, MAIN_CHANNEL, "any"));
    await expect(fetchDataVideo(API_KEY, MAIN_CHANNEL, "any")).rejects.toThrow(
      "YouTube API returned invalid data"
    );
  });

  const malformedPayloads = [
    { name: "items absent", payload: { snippet: "PAYLOAD_MARKER" } },
    { name: "items not an array", payload: { items: "PAYLOAD_MARKER" } },
    { name: "first entry missing id", payload: { items: [{}] } },
    { name: "first entry missing videoId", payload: { items: [{ id: {} }] } },
    {
      name: "first videoId empty",
      payload: { items: [{ id: { videoId: "" } }] },
    },
    {
      name: "first videoId whitespace-only",
      payload: { items: [{ id: { videoId: "   \t " } }] },
    },
    {
      name: "first videoId not text",
      payload: { items: [{ id: { videoId: 42 } }] },
    },
  ];

  it.each(malformedPayloads)(
    "rejects a malformed video payload without echoing it: $name",
    async ({ payload }) => {
      fetchMock.mockResolvedValue(jsonResponse(payload));

      await expectSafeRejection(fetchDataVideo(API_KEY, MAIN_CHANNEL, "any"));
      await expect(fetchDataVideo(API_KEY, MAIN_CHANNEL, "any")).rejects.toThrow(
        "YouTube API returned invalid data"
      );
    }
  );

  it("accepts an empty collection and ignores unused metadata or later entries", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        items: [
          { id: { videoId: "PAYLOAD_MARKER_ID" }, snippet: "not an object" },
          null,
          { id: {} },
        ],
      })
    );

    await expect(
      fetchDataVideo(API_KEY, MAIN_CHANNEL, "any")
    ).resolves.toEqual({
      items: [
        { id: { videoId: "PAYLOAD_MARKER_ID" }, snippet: "not an object" },
        null,
        { id: {} },
      ],
    });

    fetchMock.mockResolvedValue(jsonResponse({ items: [] }));
    await expect(
      fetchDataVideo(API_KEY, MAIN_CHANNEL, "any")
    ).resolves.toEqual({ items: [] });
  });

  it("propagates a safe timeout error without another request or secret leakage", async () => {
    mockFetchJsonWithTimeout.mockRejectedValue(
      new Error("YouTube API request timed out")
    );

    await expectSafeRejection(fetchDataVideo(API_KEY, MAIN_CHANNEL, "any"));
    await expect(fetchDataVideo(API_KEY, MAIN_CHANNEL, "any")).rejects.toThrow(
      "YouTube API request timed out"
    );
    expect(mockFetchJsonWithTimeout).toHaveBeenCalledTimes(2);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("fetchDataLive", () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    const actual = jest.requireActual<typeof import("./externalRequest")>(
      "./externalRequest"
    );
    mockFetchJsonWithTimeout.mockClear();
    mockFetchJsonWithTimeout.mockImplementation(actual.fetchJsonWithTimeout);
  });

  it("returns validated data with the live query and preserved cache options", async () => {
    const payload = validPayload();
    fetchMock.mockResolvedValue(jsonResponse(payload));

    await expect(fetchDataLive(API_KEY, MAIN_CHANNEL)).resolves.toEqual(payload);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("eventType=completed");
    expect(url).toContain(`key=${API_KEY}`);
    expect(init.next).toEqual({ revalidate: 300 });
  });

  it("throws a safe error for an HTTP failure", async () => {
    fetchMock.mockResolvedValue(jsonResponse(null, 500));
    await expectSafeRejection(fetchDataLive(API_KEY, MAIN_CHANNEL));
    await expect(fetchDataLive(API_KEY, MAIN_CHANNEL)).rejects.toThrow(
      "YouTube API responded with 500"
    );
  });

  it("throws a safe error for a network failure", async () => {
    fetchMock.mockRejectedValue(new Error(`failed with key=${API_KEY}`));
    await expectSafeRejection(fetchDataLive(API_KEY, MAIN_CHANNEL));
    await expect(fetchDataLive(API_KEY, MAIN_CHANNEL)).rejects.toThrow(
      "YouTube API request failed"
    );
  });

  it.each([undefined, "", "   \t "])(
    "makes no request when the key is %p",
    async (key) => {
      await expect(fetchDataLive(key, MAIN_CHANNEL)).rejects.toThrow(
        "LATEST_VIDEO"
      );
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );

  it("rejects an invalid payload with a safe error", async () => {
    fetchMock.mockResolvedValue(jsonResponse(invalidPayload()));
    await expectSafeRejection(fetchDataLive(API_KEY, MAIN_CHANNEL));
    await expect(fetchDataLive(API_KEY, MAIN_CHANNEL)).rejects.toThrow(
      "YouTube API returned invalid data"
    );
  });

  it.each([
    { name: "items absent", payload: {} },
    { name: "non-array items", payload: { items: "PAYLOAD_MARKER" } },
    { name: "unusable first ID", payload: { items: [{ id: { videoId: " " } }] } },
  ])(
    "rejects a malformed live payload without echoing it: $name",
    async ({ payload }) => {
      fetchMock.mockResolvedValue(jsonResponse(payload));

      await expectSafeRejection(fetchDataLive(API_KEY, MAIN_CHANNEL));
      await expect(fetchDataLive(API_KEY, MAIN_CHANNEL)).rejects.toThrow(
        "YouTube API returned invalid data"
      );
    }
  );

  it("accepts an empty live collection", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ items: [] }));
    await expect(fetchDataLive(API_KEY, MAIN_CHANNEL)).resolves.toEqual({
      items: [],
    });
  });

  it("propagates a safe timeout error without another request or secret leakage", async () => {
    mockFetchJsonWithTimeout.mockRejectedValue(
      new Error("YouTube API request timed out")
    );

    await expectSafeRejection(fetchDataLive(API_KEY, MAIN_CHANNEL));
    await expect(fetchDataLive(API_KEY, MAIN_CHANNEL)).rejects.toThrow(
      "YouTube API request timed out"
    );
    expect(mockFetchJsonWithTimeout).toHaveBeenCalledTimes(2);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
