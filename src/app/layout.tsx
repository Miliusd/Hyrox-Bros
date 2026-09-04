import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = { title: { default: "HyroxBros", template: "%s · HyroxBros" }, description: "Plan, log and track Hyrox training with your crew.", manifest: "/manifest.webmanifest" };
export const viewport: Viewport = { themeColor: "#08090d", viewportFit: "cover", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
