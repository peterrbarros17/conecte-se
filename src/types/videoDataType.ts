export type VideoData = {
  items: {
    snippet: {
      title: string;
      description: string;
      thumbnails: {
        default: { url: string };
        medium: { url: string };
        high: { url: string };
      };
    };
    id: { videoId: string };
  }[];
};
