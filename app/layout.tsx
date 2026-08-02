import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "RoamSettle",
  description:
    "Track trip expenses with friends, settle in USDC on Base. Non-custodial — money moves wallet to wallet.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${archivo.variable} ${plexMono.variable} bg-fill font-sans text-ink antialiased`}
      >
        <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-white">
          {children}
        </div>
      </body>
    </html>
  );
}
