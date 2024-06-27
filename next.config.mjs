/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "wallpapers.com",
        pathname: "**",
        port: "",
      },
      {
        protocol: "https",
        hostname: "creator-photo.s3.us-east-2.amazonaws.com",
        pathname: "**",
        port: "",
      },
    ],
  },
};

export default nextConfig;
