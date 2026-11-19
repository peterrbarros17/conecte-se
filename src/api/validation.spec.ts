import { isCreatorDataType, isVideoData } from "@/api/validation";

const VALID_CREATOR_FIELDS = [
  "creatorName",
  "creatorPlatform",
  "creatorLocation",
  "creatorPhraseMotivation",
  "creatorEmail",
] as const;

const validCreator = {
  creator: {
    creatorName: "UPeter",
    creatorPlatform: "Youtuber, Streamer",
    creatorLocation: "Fortaleza, Brasil",
    creatorPhraseMotivation: "Amo jogos digitais.",
    creatorEmail: "upeter@example.com",
  },
};

function creatorWithField(field: string, value: unknown) {
  return { creator: { ...validCreator.creator, [field]: value } };
}

function creatorWithoutField(field: string) {
  const creator: Record<string, unknown> = { ...validCreator.creator };
  delete creator[field];
  return { creator };
}

describe("isCreatorDataType", () => {
  it("accepts a profile whose five displayed fields are non-whitespace text", () => {
    expect(isCreatorDataType(validCreator)).toBe(true);
  });

  it.each(VALID_CREATOR_FIELDS)("rejects a missing %s", (field) => {
    expect(isCreatorDataType(creatorWithoutField(field))).toBe(false);
  });

  it.each(VALID_CREATOR_FIELDS)("rejects a non-text %s", (field) => {
    expect(isCreatorDataType(creatorWithField(field, 42))).toBe(false);
    expect(isCreatorDataType(creatorWithField(field, null))).toBe(false);
  });

  it.each(VALID_CREATOR_FIELDS)("rejects an empty or whitespace-only %s", (field) => {
    expect(isCreatorDataType(creatorWithField(field, ""))).toBe(false);
    expect(isCreatorDataType(creatorWithField(field, "   \t "))).toBe(false);
  });

  it.each([null, undefined, 42, "creator", []])(
    "rejects a non-object top level: %p",
    (value) => {
      expect(isCreatorDataType(value)).toBe(false);
    }
  );

  it.each([null, undefined, 42, "creator", []])(
    "rejects a non-object creator: %p",
    (value) => {
      expect(isCreatorDataType({ creator: value })).toBe(false);
    }
  );
});

describe("isVideoData", () => {
  it("accepts a collection whose first entry has a usable video ID", () => {
    expect(isVideoData({ items: [{ id: { videoId: "abc123" } }] })).toBe(true);
  });

  it("accepts an empty collection as structurally valid", () => {
    expect(isVideoData({ items: [] })).toBe(true);
  });

  it.each([null, undefined, 42, "items", {}])(
    "rejects an absent or non-array items value: %p",
    (value) => {
      expect(isVideoData({ items: value })).toBe(false);
    }
  );

  it.each([null, undefined, 42, "video", {}, { id: null }])(
    "rejects a first entry without a usable id: %p",
    (value) => {
      expect(isVideoData({ items: [value] })).toBe(false);
    }
  );

  it.each(["", "   \t ", 42, null, undefined])(
    "rejects a first videoId that is not non-whitespace text: %p",
    (value) => {
      expect(isVideoData({ items: [{ id: { videoId: value } }] })).toBe(false);
    }
  );

  it("ignores later invalid entries and absent or malformed metadata", () => {
    expect(
      isVideoData({
        items: [
          { id: { videoId: "abc123" } },
          null,
          { id: {} },
          { snippet: "not an object" },
        ],
      })
    ).toBe(true);
  });

  it.each([null, undefined, 42, "response", []])(
    "rejects a non-object top level: %p",
    (value) => {
      expect(isVideoData(value)).toBe(false);
    }
  );
});
