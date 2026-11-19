import { render, screen } from "@testing-library/react";
import { fetchCreatorData } from "../../api/fetchCreatorData";
import type { CreatorDataType } from "../../types/creatorDataType";
import CreatorInformation, { getCreatorData } from ".";

jest.mock("../../api/fetchCreatorData", () => ({
  fetchCreatorData: jest.fn(),
}));

const mockFetchCreatorData = jest.mocked(fetchCreatorData);

const VALID_DATA: CreatorDataType = {
  creator: {
    creatorName: "Live Creator",
    creatorPlatform: "Streamer",
    creatorLocation: "Fortaleza, Brasil",
    creatorPhraseMotivation: "PAYLOAD_MARKER phrase",
    creatorEmail: "live@example.com",
  },
};

const EXPECTED_FALLBACK: CreatorDataType = {
  creator: {
    creatorName: "UPeter",
    creatorPlatform: "Youtuber, Streamer",
    creatorLocation: "Fortaleza, Brasil",
    creatorPhraseMotivation:
      "Amo jogos digitais e compartilhar minha paixão através de livestreams.",
    creatorEmail: "upeter2019@gmail.com",
  },
};

describe("CreatorInformation", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    mockFetchCreatorData.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the supplied creator fields and the unchanged contact link", () => {
    render(<CreatorInformation creatorData={VALID_DATA} />);

    expect(screen.getByRole("heading", { name: "Live Creator" })).toBeInTheDocument();
    expect(screen.getByText("Streamer")).toBeInTheDocument();
    expect(screen.getByText("Fortaleza, Brasil")).toBeInTheDocument();
    expect(screen.getByText("PAYLOAD_MARKER phrase")).toBeInTheDocument();

    const contactLink = screen.getByRole("link", {
      name: "live@example.com",
    });
    expect(contactLink).toHaveAttribute("href", "mailto:live@example.com");
    expect(mockFetchCreatorData).not.toHaveBeenCalled();
  });

  it("returns the creator client data on success", async () => {
    mockFetchCreatorData.mockResolvedValue(VALID_DATA);
    await expect(getCreatorData()).resolves.toEqual(VALID_DATA);
  });

  it("returns the complete fallback when the client fails", async () => {
    mockFetchCreatorData.mockRejectedValue(
      new Error("GitHub Gist request failed for gist-file-123")
    );
    await expect(getCreatorData()).resolves.toEqual(EXPECTED_FALLBACK);
  });

  it.each([
    "GitHub Gist request failed",
    "GitHub Gist responded with 503",
    "GitHub Gist request timed out",
    "GIST configuration is missing",
  ])("returns the complete fallback for a safe client error: %s", async (message) => {
    mockFetchCreatorData.mockRejectedValue(new Error(message));
    await expect(getCreatorData()).resolves.toEqual(EXPECTED_FALLBACK);
  });

  it("rethrows control-flow signals before fallback handling", async () => {
    const redirectError = Object.assign(new Error("redirect signal"), {
      digest: "NEXT_REDIRECT;replace;/;307;",
    });
    mockFetchCreatorData.mockRejectedValue(redirectError);

    await expect(getCreatorData()).rejects.toBe(redirectError);
  });
});
