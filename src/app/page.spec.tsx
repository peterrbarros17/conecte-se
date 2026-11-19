import { render, screen } from "@testing-library/react";
import { fetchCreatorData } from "../api/fetchCreatorData";
import { fetchDataLive, fetchDataVideo } from "../api/fetchVideosData";
import type { CreatorDataType } from "../types/creatorDataType";
import type { VideoData } from "../types/videoDataType";
import Home from "./page";

jest.mock("../api/fetchCreatorData", () => ({ fetchCreatorData: jest.fn() }));
jest.mock("../api/fetchVideosData", () => ({
  fetchDataVideo: jest.fn(),
  fetchDataLive: jest.fn(),
}));

const mockFetchCreatorData = jest.mocked(fetchCreatorData);
const mockFetchDataVideo = jest.mocked(fetchDataVideo);
const mockFetchDataLive = jest.mocked(fetchDataLive);

const SERIE_CHANNEL = "UCwEtLdRuDPN96HEPzcy5mig";

const VALID_CREATOR: CreatorDataType = {
  creator: {
    creatorName: "Real Creator",
    creatorPlatform: "Streamer",
    creatorLocation: "Fortaleza, Brasil",
    creatorPhraseMotivation: "Real motivation phrase",
    creatorEmail: "real@example.com",
  },
};

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

function iframeSources() {
  return Array.from(document.querySelectorAll("iframe")).map((iframe) =>
    iframe.getAttribute("src")
  );
}

async function renderHome() {
  render(await Home());
}

describe("Home page integration isolation", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    mockFetchCreatorData.mockReset();
    mockFetchDataVideo.mockReset();
    mockFetchDataLive.mockReset();
    mockFetchCreatorData.mockResolvedValue(VALID_CREATOR);
    mockFetchDataVideo.mockImplementation(async (_key, channelId) =>
      videoResponse(channelId === SERIE_CHANNEL ? "serie-id" : "featured-id")
    );
    mockFetchDataLive.mockResolvedValue(videoResponse("live-id"));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("keeps all video sections and page chrome when the creator lookup fails", async () => {
    mockFetchCreatorData.mockRejectedValue(
      new Error("GitHub Gist request timed out")
    );

    await renderHome();

    expect(screen.getByRole("heading", { name: "UPeter" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Amo jogos digitais e compartilhar minha paixão através de livestreams."
      )
    ).toBeInTheDocument();
    expect(iframeSources()).toEqual([
      "https://www.youtube.com/embed/featured-id",
      "https://www.youtube.com/embed/live-id",
      "https://www.youtube.com/embed/serie-id",
    ]);
    expect(screen.getByText("Redes")).toBeInTheDocument();
    expect(screen.getByText("Apoie o criador")).toBeInTheDocument();
  });

  it("keeps the real creator profile when every video lookup fails", async () => {
    mockFetchDataVideo.mockRejectedValue(new Error("YouTube API responded with 500"));
    mockFetchDataLive.mockRejectedValue(new Error("YouTube API responded with 500"));

    await renderHome();

    expect(
      screen.getByRole("heading", { name: "Real Creator" })
    ).toBeInTheDocument();
    expect(screen.getByText("Vídeo não disponível")).toBeInTheDocument();
    expect(screen.getByText("Live não disponível")).toBeInTheDocument();
    expect(screen.getByText("Série não disponível")).toBeInTheDocument();
    expect(iframeSources()).toEqual([]);
  });

  it("renders every default creator field when the client reports invalid data", async () => {
    mockFetchCreatorData.mockRejectedValue(
      new Error("GitHub Gist returned invalid data")
    );

    await renderHome();

    expect(screen.getByRole("heading", { name: "UPeter" })).toBeInTheDocument();
    expect(screen.getByText("Youtuber, Streamer")).toBeInTheDocument();
    expect(screen.getByText("Fortaleza, Brasil")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Amo jogos digitais e compartilhar minha paixão através de livestreams."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("upeter2019@gmail.com")).toBeInTheDocument();
    expect(screen.queryByText("PAYLOAD_MARKER")).not.toBeInTheDocument();
    expect(iframeSources()).toHaveLength(3);
  });

  it("shows the empty featured card and no broken iframe for a malformed video payload", async () => {
    mockFetchDataVideo.mockImplementation(async (_key, channelId) =>
      channelId === SERIE_CHANNEL
        ? videoResponse("serie-id")
        : ({ items: [{ id: {} }] } as unknown as VideoData)
    );

    await renderHome();

    expect(screen.getByText("Vídeo não disponível")).toBeInTheDocument();
    expect(iframeSources()).toEqual([
      "https://www.youtube.com/embed/live-id",
      "https://www.youtube.com/embed/serie-id",
    ]);
    expect(
      screen.getByRole("heading", { name: "Real Creator" })
    ).toBeInTheDocument();
  });

  it("starts all four lookups before any of them settles", async () => {
    const creator = deferred<CreatorDataType>();
    const featured = deferred<VideoData>();
    const live = deferred<VideoData>();
    const serie = deferred<VideoData>();

    mockFetchCreatorData.mockReturnValue(creator.promise);
    mockFetchDataVideo.mockImplementation((_key, channelId) =>
      channelId === SERIE_CHANNEL ? serie.promise : featured.promise
    );
    mockFetchDataLive.mockReturnValue(live.promise);

    const homePromise = Home();

    try {
      expect(mockFetchCreatorData).toHaveBeenCalledTimes(1);
      expect(mockFetchDataVideo).toHaveBeenCalledTimes(2);
      expect(mockFetchDataLive).toHaveBeenCalledTimes(1);
    } finally {
      creator.resolve(VALID_CREATOR);
      featured.resolve(videoResponse("featured-id"));
      live.resolve(videoResponse("live-id"));
      serie.resolve(videoResponse("serie-id"));
    }

    render(await homePromise);
    expect(
      screen.getByRole("heading", { name: "Real Creator" })
    ).toBeInTheDocument();
    expect(iframeSources()).toEqual([
      "https://www.youtube.com/embed/featured-id",
      "https://www.youtube.com/embed/live-id",
      "https://www.youtube.com/embed/serie-id",
    ]);
  });

  it("renders the full page with every fallback when all integrations fail", async () => {
    mockFetchCreatorData.mockRejectedValue(new Error("GIST configuration is missing"));
    mockFetchDataVideo.mockRejectedValue(new Error("LATEST_VIDEO configuration is missing"));
    mockFetchDataLive.mockRejectedValue(new Error("LATEST_VIDEO configuration is missing"));

    await renderHome();

    expect(screen.getByRole("heading", { name: "UPeter" })).toBeInTheDocument();
    expect(screen.getByText("Vídeo não disponível")).toBeInTheDocument();
    expect(screen.getByText("Live não disponível")).toBeInTheDocument();
    expect(screen.getByText("Série não disponível")).toBeInTheDocument();
    expect(screen.getByText("Redes")).toBeInTheDocument();
    expect(screen.getByText("Apoie o criador")).toBeInTheDocument();
    expect(screen.getAllByRole("link").length).toBeGreaterThanOrEqual(5);
    expect(iframeSources()).toEqual([]);
  });
});
