"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type RequireSessionProps = {
  children: ReactNode;
};

export function RequireSession({ children }: RequireSessionProps) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;

    getSupabaseBrowserClient()
      .auth.getUser()
      .then(({ data }) => {
        if (!active) return;
        if (!data.user) {
          router.replace("/login");
          return;
        }
        setAllowed(true);
      })
      .catch(() => {
        if (!active) return;
        router.replace("/login");
      });

    return () => {
      active = false;
    };
  }, [router]);

  if (!allowed) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <p className="text-sm text-muted">Cargando…</p>
      </div>
    );
  }

  return children;
}
