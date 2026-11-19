import { fetchCreatorData } from "@/api/fetchCreatorData";
import { fetchJsonWithTimeout } from "./externalRequest";

jest.mock("./externalRequest", () => {
  const actual = jest.requireActual("./externalRequest");
  return {
    ...actual,
    fetchJsonWithTimeout: jest.fn(actual.fetchJsonWithTimeout),
  };
});

const mockFetchJsonWithTimeout = jest.mocked(fetchJsonWithTimeout);

const GIST_VALUE = "gist-file-123";
const GIST_URL_PART = `${GIST_VALUE}.json`;

function jsonResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(data),
  };
}

function validPayload() {
  return {
    creator: {
      creatorName: "Live Creator",
      creatorPlatform: "Streamer",
      creatorLocation: "Fortaleza, Brasil",
      creatorPhraseMotivation: "PAYLOAD_MARKER phrase",
      creatorEmail: "live@example.com",
    },
  };
}

async function expectSafeRejection(promise: Promise<unknown>) {
  try {
    await promise;
    throw new Error("expected the creator lookup to reject");
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
    if (!(error instanceof Error)) return;
    expect(error.message).not.toContain(GIST_VALUE);
    expect(error.message).not.toContain(GIST_URL_PART);
    expect(error.message).not.toContain("gist.githubusercontent.com");
    expect(error.message).not.toContain("PAYLOAD_MARKER");
  }
}

describe("fetchCreatorData", () => {
  const originalGist = process.env.GIST;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    process.env.GIST = GIST_VALUE;
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    const actual = jest.requireActual<typeof import("./externalRequest")>(
      "./externalRequest"
    );
    mockFetchJsonWithTimeout.mockClear();
    mockFetchJsonWithTimeout.mockImplementation(actual.fetchJsonWithTimeout);
  });

  afterEach(() => {
    if (originalGist === undefined) {
      delete process.env.GIST;
    } else {
      process.env.GIST = originalGist;
    }
  });

  it("returns validated data from a successful response", async () => {
    const payload = validPayload();
    fetchMock.mockResolvedValue(jsonResponse(payload));

    await expect(fetchCreatorData()).resolves.toEqual(payload);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain(GIST_URL_PART);
    expect(init.next).toEqual({ revalidate: false });
  });

  it("throws a safe error for an HTTP failure", async () => {
    fetchMock.mockResolvedValue(jsonResponse(null, 500));
    await expectSafeRejection(fetchCreatorData());
    await expect(fetchCreatorData()).rejects.toThrow("GitHub Gist responded with 500");
  });

  it("throws a safe error for a network failure", async () => {
    fetchMock.mockRejectedValue(new Error(`failed at gist.githubusercontent.com/${GIST_VALUE}`));
    await expectSafeRejection(fetchCreatorData());
    await expect(fetchCreatorData()).rejects.toThrow("GitHub Gist request failed");
  });

  it.each([undefined, "", "   \t "])(
    "makes no request when GIST is %p",
    async (value) => {
      if (value === undefined) {
        delete process.env.GIST;
      } else {
        process.env.GIST = value;
      }

      await expect(fetchCreatorData()).rejects.toThrow("GIST");
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );

  it("rejects an invalid payload with a safe error", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ creator: { creatorName: "PAYLOAD_MARKER" } })
    );
    await expectSafeRejection(fetchCreatorData());
    await expect(fetchCreatorData()).rejects.toThrow(
      "GitHub Gist returned invalid data"
    );
  });

  const creatorFields = [
    "creatorName",
    "creatorPlatform",
    "creatorLocation",
    "creatorPhraseMotivation",
    "creatorEmail",
  ];

  const malformedPayloads = [
    { name: "top level is not an object", payload: "PAYLOAD_MARKER" },
    { name: "creator is not an object", payload: { creator: "PAYLOAD_MARKER" } },
    ...creatorFields.flatMap((field) => {
      const complete = validPayload().creator;
      const withoutField: Record<string, unknown> = { ...complete };
      delete withoutField[field];
      return [
        { name: `${field} absent`, payload: { creator: withoutField } },
        {
          name: `${field} null`,
          payload: { creator: { ...complete, [field]: null } },
        },
        {
          name: `${field} numeric`,
          payload: { creator: { ...complete, [field]: 42 } },
        },
        {
          name: `${field} empty`,
          payload: { creator: { ...complete, [field]: "" } },
        },
        {
          name: `${field} whitespace-only`,
          payload: { creator: { ...complete, [field]: "   \t " } },
        },
      ];
    }),
  ];

  it.each(malformedPayloads)(
    "rejects a malformed creator payload without echoing it: $name",
    async ({ payload }) => {
      fetchMock.mockResolvedValue(jsonResponse(payload));

      await expectSafeRejection(fetchCreatorData());
      await expect(fetchCreatorData()).rejects.toThrow(
        "GitHub Gist returned invalid data"
      );
    }
  );

  it("propagates a safe timeout error without another request or secret leakage", async () => {
    mockFetchJsonWithTimeout.mockRejectedValue(
      new Error("GitHub Gist request timed out")
    );

    await expectSafeRejection(fetchCreatorData());
    await expect(fetchCreatorData()).rejects.toThrow(
      "GitHub Gist request timed out"
    );
    expect(mockFetchJsonWithTimeout).toHaveBeenCalledTimes(2);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
