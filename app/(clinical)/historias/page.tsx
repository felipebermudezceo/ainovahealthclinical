import type { Metadata } from "next";
import { HistoryList } from "@/components/history-list";

export const metadata: Metadata = {
  title: "Historias clínicas",
};

export default async function HistoriasPage({
  searchParams,
}: {
  searchParams: Promise<{ actualizada?: string }>;
}) {
  const params = await searchParams;
  return <HistoryList updated={params.actualizada === "1"} />;
}
