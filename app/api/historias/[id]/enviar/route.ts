import { readFile } from "node:fs/promises";
import path from "node:path";
import { Resend } from "resend";
import { getDoctorProfile } from "@/lib/doctor";
import { getOwnHistory } from "@/lib/histories";
import { FIXED_SIGNATURE_PATHS } from "@/lib/institution";
import { isDeliverableEmail } from "@/lib/format";
import { buildClinicalHistoryPdf, LOGO_PATH } from "@/lib/clinical-history-pdf";
import { buildPatientHistoryEmail } from "@/lib/patient-history-email";
import { imageFromBytes, imageFromUrl, type PdfImage } from "@/lib/pdf-image";
import { createSupabaseAccessClient, getSupabaseBrowserClient } from "@/lib/supabase/client";

export const runtime = "nodejs";

const HISTORY_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type SendStatus = "sent" | "invalid_email" | "not_configured" | "failed";

function json(status: SendStatus, httpStatus = 200) {
  return Response.json({ status }, { status: httpStatus });
}

function redactSecrets(text: string): string {
  let safe = text.replace(/\bre_[A-Za-z0-9_-]{8,}\b/g, "[redacted]");
  safe = safe.replace(/\bBearer\s+[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\b/g, "Bearer [redacted]");
  safe = safe.replace(/\beyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\b/g, "[redacted]");
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (apiKey && safe.includes(apiKey)) safe = safe.split(apiKey).join("[redacted]");
  return safe;
}

function sendErrorDetail(error: unknown): { name: string; statusCode: number | null; message: string } {
  const record = error !== null && typeof error === "object" ? (error as Record<string, unknown>) : null;
  const name =
    record && typeof record.name === "string" ? record.name : error instanceof Error ? error.name : "Error";
  const statusCode = record && typeof record.statusCode === "number" ? record.statusCode : null;
  const raw =
    record && typeof record.message === "string"
      ? record.message
      : error instanceof Error
        ? error.message
        : "El servicio de correo rechazó el envío.";
  const message = redactSecrets(raw).slice(0, 300) || "El servicio de correo rechazó el envío.";
  return { name, statusCode, message };
}

function resendFailure(error: unknown) {
  const detail = sendErrorDetail(error);
  console.error("Resend send failed:", detail.name, detail.statusCode, detail.message);
  return Response.json({ status: "failed", message: detail.message }, { status: 500 });
}

function errorCode(error: unknown): string | number | null {
  if (error === null || typeof error !== "object") return null;
  const record = error as Record<string, unknown>;
  if (typeof record.code === "string" || typeof record.code === "number") return record.code;
  if (typeof record.statusCode === "number") return record.statusCode;
  return null;
}

function preResendFailure(step: string, error: unknown) {
  const detail = sendErrorDetail(error);
  const code = errorCode(error);
  console.error("History email failed before Resend:", step, detail.name, code, detail.message);
  if (error instanceof Error && error.stack) {
    console.error(redactSecrets(error.stack).split("\n").slice(0, 6).join("\n"));
  }
  return Response.json({ status: "failed", message: detail.message }, { status: 500 });
}

function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+([A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+)$/.exec(header.trim());
  return match?.[1] ?? null;
}

function tokenRole(accessToken: string): string {
  try {
    const segment = accessToken.split(".")[1] ?? "";
    const payload = JSON.parse(Buffer.from(segment, "base64url").toString("utf8")) as { role?: unknown };
    return typeof payload.role === "string" ? payload.role : "";
  } catch {
    return "";
  }
}

async function readPublicImage(publicPath: string): Promise<PdfImage | null> {
  try {
    const bytes = await readFile(path.join(process.cwd(), "public", publicPath.replace(/^\//, "")));
    return imageFromBytes(bytes);
  } catch {
    return null;
  }
}

async function loadSignature(signatureUrl: string): Promise<PdfImage | null> {
  for (const publicPath of FIXED_SIGNATURE_PATHS) {
    const image = await readPublicImage(publicPath);
    if (image) return image;
  }
  const remote = signatureUrl.trim();
  if (!remote.startsWith("https://") && !remote.startsWith("http://")) return null;
  return imageFromUrl(remote);
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const accessToken = bearerToken(request);
  if (!accessToken || tokenRole(accessToken) === "service_role") {
    return json("failed", 401);
  }

  const { id } = await context.params;
  if (!HISTORY_ID.test(id)) return json("failed", 404);

  try {
    const { data: authData, error: authError } = await getSupabaseBrowserClient().auth.getUser(accessToken);
    if (authError || !authData.user) return json("failed", 401);

    const supabase = createSupabaseAccessClient(accessToken);
    const history = await getOwnHistory(supabase, id, authData.user.id);
    if (!history) return json("failed", 404);
    if (!isDeliverableEmail(history.patient.email)) return json("invalid_email");

    const apiKey = process.env.RESEND_API_KEY?.trim() ?? "";
    const from = process.env.EMAIL_FROM?.trim() ?? "";
    if (!apiKey || !from) return json("not_configured");

    let doctor;
    try {
      doctor = await getDoctorProfile(supabase, authData.user.id);
    } catch (error) {
      return preResendFailure("getDoctorProfile", error);
    }

    let logo: PdfImage;
    let logoFile: Buffer;
    try {
      logoFile = await readFile(path.join(process.cwd(), "public", LOGO_PATH.replace(/^\//, "")));
      const image = imageFromBytes(logoFile);
      if (!image) throw new Error("El logo no es una imagen PNG o JPEG válida.");
      logo = image;
    } catch (error) {
      return preResendFailure("readPublicImage", error);
    }

    let signature: PdfImage | null;
    try {
      signature = await loadSignature(doctor.signatureUrl);
    } catch (error) {
      return preResendFailure("loadSignature", error);
    }

    let pdf: Uint8Array;
    try {
      pdf = buildClinicalHistoryPdf({ history, doctor, logo, signature });
    } catch (error) {
      return preResendFailure("buildClinicalHistoryPdf", error);
    }

    let attachment: Buffer;
    try {
      attachment = Buffer.from(pdf);
    } catch (error) {
      return preResendFailure("Buffer.from", error);
    }

    try {
      const resend = new Resend(apiKey);
      const { error } = await resend.emails.send({
        from,
        to: history.patient.email.trim(),
        subject: "Historia clínica — AinovaHealth Medical",
        ...buildPatientHistoryEmail(),
        attachments: [
          {
            filename: `historia-clinica-${history.id}.pdf`,
            content: attachment,
            contentType: "application/pdf",
          },
          {
            filename: "ainovahealth-logo.png",
            content: logoFile,
            contentType: "image/png",
            contentId: "ainovahealth-logo",
          },
        ],
      });
      if (error) return resendFailure(error);
    } catch (error) {
      return resendFailure(error);
    }

    return json("sent");
  } catch (error) {
    return preResendFailure("preparacion", error);
  }
}
