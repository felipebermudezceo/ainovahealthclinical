"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { primaryButtonClass } from "@/components/button-styles";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const LINKS = [
  { href: "/nueva-historia", label: "Nueva historia" },
  { href: "/historias", label: "Historias" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/historias") {
    return pathname === "/historias" || pathname.startsWith("/historias/");
  }
  return pathname === href;
}

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await getSupabaseBrowserClient().auth.signOut();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-3 sm:h-[4.25rem] sm:flex-row sm:items-center sm:justify-between sm:py-0">
        <Link href="/nueva-historia" className="flex min-w-0 items-center gap-3">
          <BrandMark />
          <span className="truncate text-base font-semibold tracking-tight text-ink">AinovaHealth Medical</span>
        </Link>
        <nav aria-label="Principal" className="flex flex-wrap items-center gap-2">
          {LINKS.map((link) => {
            const active = isActive(pathname, link.href);
            const primary = link.href === "/nueva-historia";
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={
                  primary
                    ? `${primaryButtonClass} w-full sm:w-auto ${active ? "ring-2 ring-accent/25 ring-offset-2" : ""}`
                    : `inline-flex h-12 items-center rounded-xl px-3 text-sm font-semibold transition-colors ${
                        active ? "bg-background text-ink" : "text-muted hover:bg-background hover:text-ink"
                      }`
                }
              >
                {link.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={logout}
            className="inline-flex h-12 items-center rounded-xl px-3 text-sm font-semibold text-muted transition-colors hover:bg-background hover:text-ink"
          >
            Cerrar sesión
          </button>
        </nav>
      </div>
    </header>
  );
}
