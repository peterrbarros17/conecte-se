import type { Metadata } from "next";
import { Epilogue } from "next/font/google";
import "./globals.css";

const epilogue = Epilogue({
  weight: ["600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UPeter | Conecte-se",
  description: "social media site upeter streamer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={epilogue.className}>{children}</body>
    </html>
  );
}
