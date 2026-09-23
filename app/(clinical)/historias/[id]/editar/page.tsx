import type { Metadata } from "next";
import { EditHistory } from "@/components/edit-history";

export const metadata: Metadata = {
  title: "Editar historia clínica",
};

export default function EditarHistoriaPage() {
  return <EditHistory />;
}
