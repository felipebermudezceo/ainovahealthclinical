import { isDeliverableEmail } from "@/lib/format";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type RegisterInput = {
  fullName: string;
  documentId: string;
  email: string;
  password: string;
  passwordConfirmation: string;
};

export type RegisterResult = "ready" | "confirm_email";

function registrationError(error: { message?: string; code?: string }): Error {
  const code = error.code ?? "";
  const message = (error.message ?? "").toLowerCase();
  if (
    code === "user_already_exists" ||
    message.includes("already registered") ||
    message.includes("already been registered")
  ) {
    return new Error("Este correo ya está registrado.");
  }
  if (message.includes("password")) {
    return new Error("La contraseña no cumple las reglas de seguridad.");
  }
  return new Error("No fue posible crear la cuenta.");
}

export async function registerDoctor(input: RegisterInput): Promise<RegisterResult> {
  const fullName = input.fullName.trim();
  const documentId = input.documentId.trim();
  const email = input.email.trim();

  if (!fullName) throw new Error("Ingrese el nombre completo.");
  if (!documentId) throw new Error("Ingrese el número de identificación.");
  if (!isDeliverableEmail(email)) throw new Error("Ingrese un correo electrónico válido.");
  if (input.password.length < 8) throw new Error("La contraseña debe tener al menos 8 caracteres.");
  if (input.password !== input.passwordConfirmation) throw new Error("La confirmación de la contraseña no coincide.");

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      data: {
        full_name: fullName,
        document_id: documentId,
      },
    },
  });

  if (error) throw registrationError(error);
  if (!data.user) throw new Error("No fue posible crear la cuenta.");
  if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    throw new Error("Este correo ya está registrado.");
  }

  if (!data.session) return "confirm_email";

  const { error: profileError } = await supabase
    .from("doctors")
    .update({ full_name: fullName })
    .eq("id", data.user.id);

  await supabase.auth.signOut();
  if (profileError) throw new Error("La cuenta se creó, pero no fue posible guardar el nombre.");
  return "ready";
}
