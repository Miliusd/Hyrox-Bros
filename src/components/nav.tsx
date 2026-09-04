"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [{ href: "/", icon: "⌂", label: "Home" }, { href: "/fitness", icon: "⌁", label: "Fitness" }, { href: "/pbs", icon: "♛", label: "PBs" }, { href: "/templates", icon: "▤", label: "Plans" }, { href: "/settings", icon: "●", label: "You" }];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary" className="mobile-nav fixed inset-x-0 bottom-0 z-50 border-t border-ink-700 bg-ink-950/95 backdrop-blur md:static md:border-0 md:bg-transparent">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-around px-2 md:h-auto md:justify-end md:gap-1 md:p-0">
        {items.map((item) => {
          const active = item.href === "/"
            ? pathname === "/" || pathname === "/log" || pathname.startsWith("/workout")
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-h-12 min-w-14 flex-col items-center justify-center rounded-xl px-2 text-xs font-bold transition md:min-h-10 md:flex-row md:gap-2 md:px-3 md:text-sm ${active ? "bg-brand-400/10 text-brand-400" : "text-ink-400 hover:bg-ink-800 hover:text-white"}`}
            >
              <span className="text-lg leading-none md:text-base" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
              {active && <span className="absolute inset-x-3 -bottom-1 h-0.5 rounded-full bg-brand-400 md:hidden" aria-hidden="true" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
