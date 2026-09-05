import Link from "next/link";
import { Nav } from "@/components/nav";
import { WebMcpTools } from "@/components/webmcp-tools";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <div className="page-shell mx-auto min-h-screen max-w-6xl px-4"><WebMcpTools />
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <header className="flex h-18 items-center justify-between gap-3 border-b border-ink-800"><Link href="/" className="flex items-center gap-2 text-lg font-black tracking-tight"><span className="grid size-9 place-items-center rounded-xl bg-brand-400 text-ink-950" aria-hidden="true">HB</span><span>HYROX<span className="text-brand-400">BROS</span></span></Link><div className="flex items-center gap-2"><Link href="/guide" className="chip whitespace-nowrap" aria-label="Open HYROX race guide"><span aria-hidden="true">?</span><span className="hidden sm:inline">Race guide</span></Link><div className="hidden md:block"><Nav /></div></div></header>
    <main id="main-content" tabIndex={-1}>{children}</main><div className="md:hidden"><Nav /></div>
  </div>;
}
