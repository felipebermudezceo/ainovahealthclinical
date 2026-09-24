import type { Metadata } from "next";
import { LoginScreen } from "@/components/login-screen";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registro?: string }>;
}) {
  const params = await searchParams;
  const notice =
    params.registro === "listo"
      ? "Cuenta creada correctamente. Ya puedes iniciar sesión."
      : params.registro === "confirmar"
        ? "Cuenta creada correctamente. Confirme el correo electrónico antes de iniciar sesión."
        : "";
  return <LoginScreen notice={notice} />;
}
