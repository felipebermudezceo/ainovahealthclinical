import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | undefined;

function readPublicSupabaseEnv(): { url: string; publishableKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    "";

  if (!url || !publishableKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (o NEXT_PUBLIC_SUPABASE_ANON_KEY).",
    );
  }

  if (publishableKey.startsWith("sb_secret_")) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY contiene una clave secreta. Use solo la publishable key.",
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL debe ser la Project URL de Supabase.");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL debe comenzar por https://.");
  }

  const pathname = parsed.pathname.replace(/\/+$/, "");
  const projectUrl =
    pathname === "" || pathname === "/rest/v1" ? parsed.origin : `${parsed.origin}${pathname}`;

  return { url: projectUrl, publishableKey };
}

export function getSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) return browserClient;

  const { url, publishableKey } = readPublicSupabaseEnv();
  browserClient = createClient(url, publishableKey);
  return browserClient;
}

export function createSupabaseAccessClient(accessToken: string): SupabaseClient {
  const { url, publishableKey } = readPublicSupabaseEnv();
  return createClient(url, publishableKey, {
    accessToken: async () => accessToken,
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
