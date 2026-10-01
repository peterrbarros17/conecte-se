# UPeter | Conecte-se

Personal hub for **UPeter**, a YouTuber and streamer from Fortaleza, Brazil. The app centralizes social links, the latest YouTube videos and lives, and ways to support the creator (Epic Games creator code and LivePix donations).

Live profile: [YouTube @UPeter](https://www.youtube.com/@UPeter)

## Home Page
<img width="640" height="753" alt="image" src="https://github.com/user-attachments/assets/e4ff9502-caec-4088-8c47-043e4473340e" />

<img width="640" height="753" alt="image" src="https://github.com/user-attachments/assets/f74d48d6-ff34-45f7-b4de-21d8d90eb0de" />

<img width="396" height="870" alt="image" src="https://github.com/user-attachments/assets/e884ac12-6075-4e0e-ae07-24106fd4053c" />


## Features

- **Social links** — YouTube (main and secondary), Instagram, Twitch, and Discord
- **Creator profile** — name, location, bio, and contact email (loaded from a GitHub Gist, with a local fallback)
- **Latest content** — embeds for the most recent video, completed live, and series episode via the YouTube Data API
- **Creator support** — copyable Epic Games code `UPETER-YT` and a donation CTA to [LivePix](https://livepix.gg/upeter)
- **Theming** — dark by default, with a light/dark toggle (`next-themes`)

## Tech stack

| Area | Tools |
| --- | --- |
| Framework | [Next.js](https://nextjs.org/) 14 (App Router) |
| UI | React 18, Tailwind CSS, [react-icons](https://react-icons.github.io/react-icons/) |
| Language | TypeScript |
| Theming | [next-themes](https://github.com/pacocoursey/next-themes) |
| Tests | Jest, React Testing Library |
| Content | YouTube Data API v3, GitHub Gist, AWS S3 (profile photo) |

## Getting started

### Prerequisites

- Node.js 18 or later
- npm
- A [YouTube Data API](https://developers.google.com/youtube/v3/getting-started) key if you want video embeds to load

### Install

```bash
npm install
```

### Environment variables

Create a `.env` file in the project root (this file is gitignored):

```bash
# YouTube Data API keys (can be the same key)
LATEST_VIDEO=your_youtube_api_key
LATEST_SERIE=your_youtube_api_key

# GitHub Gist JSON filename (without .json)
GIST=your_gist_filename
```

| Variable | Used for |
| --- | --- |
| `LATEST_VIDEO` | Latest video and latest completed live on the main channel |
| `LATEST_SERIE` | Latest video on the secondary / series channel |
| `GIST` | Remote JSON with creator name, location, bio, and email |

The app still renders without these variables: profile data falls back to built-in defaults, and video cards show an empty state.

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production build

```bash
npm run build
npm start
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Create a production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run Jest once |
| `npm run test:watch` | Run Jest in watch mode |

## Project structure

```text
src/
  app/                 # App Router layout, page, and global styles
  api/                 # YouTube and Gist fetchers
  components/          # Profile, socials, support, videos, theme
  types/               # TypeScript types for API responses
```

## How it works

1. **Profile** — `fetchCreatorData` reads a JSON file from a GitHub Gist. If the request fails, the UI uses hardcoded fallback data.
2. **Photo** — the avatar is served from an AWS S3 bucket (`creator-photo.s3.us-east-2.amazonaws.com`).
3. **Videos** — `getReleasedVideos` calls the YouTube Search API for the main channel (`UCaJscJxs5LEuwFShmKr39tg`) and the series channel (`UCwEtLdRuDPN96HEPzcy5mig`), then embeds the returned video IDs.

## License

Private personal project. All rights reserved.
