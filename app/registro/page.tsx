import type { Metadata } from "next";
import { RegisterScreen } from "@/components/register-screen";

export const metadata: Metadata = {
  title: "Crear cuenta",
};

export default function RegistroPage() {
  return <RegisterScreen />;
}
