import type { Metadata } from "next";
import { HistoryDetail } from "@/components/history-detail";

export const metadata: Metadata = {
  title: "Historia clínica",
};

export default function HistoriaPage() {
  return <HistoryDetail />;
}
