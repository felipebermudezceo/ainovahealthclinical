import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function responseStatus(body: unknown): string {
  if (typeof body !== "object" || body === null || !("status" in body)) return "";
  return typeof body.status === "string" ? body.status : "";
}

function responseMessage(body: unknown): string {
  if (typeof body !== "object" || body === null || !("message" in body)) return "";
  if (typeof body.message !== "string") return "";
  return body.message.replace(/\bre_[A-Za-z0-9_-]{8,}\b/g, "[redacted]").trim().slice(0, 300);
}

export async function requestSavedHistoryEmail(
  historyId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { data } = await getSupabaseBrowserClient().auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) return { ok: false, message: "No fue posible enviar el PDF." };

  const response = await fetch(`/api/historias/${historyId}/enviar`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const body: unknown = await response.json().catch(() => null);
  const status = responseStatus(body);
  const message = responseMessage(body);

  if (response.ok && status === "sent") return { ok: true };
  if (message) return { ok: false, message };
  if (status === "invalid_email") {
    return { ok: false, message: "El correo del paciente está vacío o no es válido." };
  }
  if (status === "not_configured") {
    return { ok: false, message: "El envío de correo no está configurado." };
  }
  return { ok: false, message: "No fue posible enviar el PDF." };
}
