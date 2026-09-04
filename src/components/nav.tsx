import Link from "next/link";

const items = [{ href: "/", icon: "▦", label: "Calendar" }, { href: "/fitness", icon: "⌁", label: "Fitness" }, { href: "/pbs", icon: "♛", label: "PBs" }, { href: "/templates", icon: "▤", label: "Plans" }, { href: "/settings", icon: "●", label: "You" }];

export function Nav() {
  return <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-50 border-t border-ink-700 bg-ink-950/95 backdrop-blur md:static md:border-0 md:bg-transparent">
    <div className="safe-bottom mx-auto flex max-w-6xl justify-around px-2 pt-2 md:p-0 md:gap-1">{items.map((item) => <Link key={item.href} href={item.href} className="flex min-h-12 min-w-16 flex-col items-center justify-center rounded-xl text-xs font-bold text-ink-400 hover:bg-ink-800 hover:text-white md:min-h-10 md:flex-row md:gap-2 md:px-3 md:text-sm"><span className="text-lg md:text-base">{item.icon}</span>{item.label}</Link>)}</div>
  </nav>;
}
