import { fetchDataLive, fetchDataVideo } from "../../api/fetchVideosData";
import type { VideoData } from "../../types/videoDataType";
import { getReleasedVideos } from ".";

jest.mock("../../api/fetchVideosData", () => ({
  fetchDataVideo: jest.fn(),
  fetchDataLive: jest.fn(),
}));

const mockFetchDataVideo = jest.mocked(fetchDataVideo);
const mockFetchDataLive = jest.mocked(fetchDataLive);

const MAIN_CHANNEL = "UCaJscJxs5LEuwFShmKr39tg";
const SERIE_CHANNEL = "UCwEtLdRuDPN96HEPzcy5mig";

function videoResponse(videoId: string): VideoData {
  return { items: [{ id: { videoId } }] };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function redirectError() {
  return Object.assign(new Error("redirect signal"), {
    digest: "NEXT_REDIRECT;replace;/;307;",
  });
}

describe("getReleasedVideos", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    mockFetchDataVideo.mockReset();
    mockFetchDataLive.mockReset();
    mockFetchDataVideo.mockImplementation(async (_key, channelId) =>
      videoResponse(channelId === SERIE_CHANNEL ? "serie-id" : "featured-id")
    );
    mockFetchDataLive.mockResolvedValue(videoResponse("live-id"));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns the three IDs when every lookup succeeds", async () => {
    await expect(getReleasedVideos()).resolves.toEqual({
      latestVideo: "featured-id",
      latestLive: "live-id",
      latestSerie: "serie-id",
    });
    expect(mockFetchDataVideo).toHaveBeenCalledTimes(2);
    expect(mockFetchDataLive).toHaveBeenCalledTimes(1);
  });

  it("returns an empty ID only for the failing lookup", async () => {
    mockFetchDataVideo.mockImplementation(async (_key, channelId) => {
      if (channelId === MAIN_CHANNEL) {
        throw new Error("YouTube API responded with 500");
      }
      return videoResponse("serie-id");
    });

    await expect(getReleasedVideos()).resolves.toEqual({
      latestVideo: "",
      latestLive: "live-id",
      latestSerie: "serie-id",
    });
  });

  it("isolates a safe timeout to its own section", async () => {
    mockFetchDataLive.mockRejectedValue(
      new Error("YouTube API request timed out")
    );

    await expect(getReleasedVideos()).resolves.toEqual({
      latestVideo: "featured-id",
      latestLive: "",
      latestSerie: "serie-id",
    });
  });

  it("returns three empty IDs when every lookup fails", async () => {
    mockFetchDataVideo.mockRejectedValue(new Error("YouTube API request failed"));
    mockFetchDataLive.mockRejectedValue(new Error("YouTube API request failed"));

    await expect(getReleasedVideos()).resolves.toEqual({
      latestVideo: "",
      latestLive: "",
      latestSerie: "",
    });
  });

  it("starts all three lookups before any settles and isolates one failure", async () => {
    const featured = deferred<VideoData>();
    const live = deferred<VideoData>();
    const serie = deferred<VideoData>();

    mockFetchDataVideo.mockImplementation((_key, channelId) =>
      channelId === SERIE_CHANNEL ? serie.promise : featured.promise
    );
    mockFetchDataLive.mockReturnValue(live.promise);

    const videosPromise = getReleasedVideos();

    try {
      expect(mockFetchDataVideo).toHaveBeenCalledTimes(2);
      expect(mockFetchDataLive).toHaveBeenCalledTimes(1);
    } finally {
      featured.resolve(videoResponse("featured-id"));
      live.reject(new Error("YouTube API request timed out"));
      serie.resolve(videoResponse("serie-id"));
    }

    await expect(videosPromise).resolves.toEqual({
      latestVideo: "featured-id",
      latestLive: "",
      latestSerie: "serie-id",
    });
  });

  it("rethrows control-flow signals before fallback handling", async () => {
    const signal = redirectError();
    mockFetchDataVideo.mockRejectedValue(signal);

    await expect(getReleasedVideos()).rejects.toBe(signal);
  });
});
