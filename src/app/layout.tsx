import type { Metadata } from "next";
import { Epilogue } from "next/font/google";
import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";

const epilogue = Epilogue({
  weight: ["400", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UPeter | Conecte-se",
  description: "social media site upeter streamer",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
        />
      </head>
      <body className={epilogue.className}>
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}
