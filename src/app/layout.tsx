import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "HyroxBros", template: "%s · HyroxBros" },
  description: "Plan, log and track Hyrox training with your crew.",
  manifest: "/manifest.webmanifest",
  applicationName: "HyroxBros",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "HyroxBros" },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};
export const viewport: Viewport = { themeColor: "#08090d", viewportFit: "cover", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
