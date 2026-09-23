import type { Metadata } from "next";
import { HistoryForm } from "@/components/history-form";

export const metadata: Metadata = {
  title: "Nueva historia clínica",
};

export default function NuevaHistoriaPage() {
  return <HistoryForm />;
}
