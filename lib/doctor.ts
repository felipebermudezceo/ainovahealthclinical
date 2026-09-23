import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type DoctorProfile = {
  fullName: string;
  specialty: string;
  professionalLicense: string;
  phone: string;
  email: string;
  signatureUrl: string;
};

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export async function getDoctorProfile(
  supabase: SupabaseClient,
  userId?: string,
): Promise<DoctorProfile> {
  const authUserId = userId
    ? userId
    : await supabase.auth.getUser().then(({ data, error }) => {
        if (error || !data.user) return "";
        return data.user.id;
      });

  if (!authUserId) {
    throw new Error("La sesión no es válida. Inicie sesión de nuevo.");
  }

  const { data, error } = await supabase
    .from("doctors")
    .select("full_name, specialty, professional_license, phone, email, signature_url")
    .eq("id", authUserId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("No fue posible consultar los datos del médico.");
  }

  return {
    fullName: text(data.full_name),
    specialty: text(data.specialty),
    professionalLicense: text(data.professional_license),
    phone: text(data.phone),
    email: text(data.email),
    signatureUrl: text(data.signature_url),
  };
}

export async function getCurrentDoctor(): Promise<DoctorProfile> {
  return getDoctorProfile(getSupabaseBrowserClient());
}
