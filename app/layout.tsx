import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
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
  other: {
    // Base Dashboard domain-ownership verification (dashboard.base.org app 6a6f3515a8c4f2b6db3b3db0)
    "base:app_id": "6a6f3515a8c4f2b6db3b3db0",
    // Talent Protocol project-ownership verification (talent.app project RoamSettle)
    "talentapp:project_verification":
      "46624f211efb53f8abc49fdd54ef90acc8941273064129ce5108f994855efdbd486871190e922d8da856cdc6f553c137b542d6414b4dd0d103fad503d818df0b",
  },
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
        <Providers>
          <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-white">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
