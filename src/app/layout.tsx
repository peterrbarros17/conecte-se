import type { Metadata } from "next";
import { Epilogue } from "next/font/google";
import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";
import Providers from "@/components/Providers";

const epilogue = Epilogue({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "UPeter | Conecte-se",
  description:
    "YouTuber e streamer de Fortaleza. Redes, lives, vídeos e formas de apoiar o criador.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <body className={`${epilogue.variable} font-sans`}>
        <Providers>
          <ThemeToggle />
          {children}
        </Providers>
      </body>
    </html>
  );
}
