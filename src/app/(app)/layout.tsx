import Link from "next/link";
import { Nav } from "@/components/nav";
import { WebMcpTools } from "@/components/webmcp-tools";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <div className="page-shell mx-auto min-h-screen max-w-6xl px-4"><WebMcpTools />
    <header className="flex h-18 items-center justify-between border-b border-ink-800"><Link href="/" className="flex items-center gap-2 text-lg font-black tracking-tight"><span className="grid size-9 place-items-center rounded-xl bg-brand-400 text-ink-950">HB</span> HYROX<span className="text-brand-400">BROS</span></Link><div className="hidden md:block"><Nav /></div></header>
    <main>{children}</main><div className="md:hidden"><Nav /></div>
  </div>;
}
