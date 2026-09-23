"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { HistoryForm } from "@/components/history-form";
import { secondaryButtonClass } from "@/components/button-styles";
import { getHistory, historyToFormValues } from "@/lib/histories";
import type { HistoryFormValues } from "@/lib/types";

function readId(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export function EditHistory() {
  const params = useParams<{ id: string }>();
  const id = readId(params.id);
  const [values, setValues] = useState<HistoryFormValues | null>(null);
  const [missing, setMissing] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    getHistory(id)
      .then((history) => {
        if (!active) return;
        if (!history) {
          setMissing(true);
          return;
        }
        setValues(historyToFormValues(history));
      })
      .catch(() => {
        if (!active) return;
        setLoadError("No fue posible consultar la historia clínica.");
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (loadError || missing) {
    return (
      <div className="rounded-2xl border border-line bg-surface px-6 py-10 text-center shadow-[0_1px_2px_rgba(18,38,58,0.04)]">
        <p role="alert" className="text-sm text-danger">
          {loadError || "No encontramos esta historia clínica."}
        </p>
        <Link href="/historias" className={`${secondaryButtonClass} mt-6`}>
          Volver a historias
        </Link>
      </div>
    );
  }

  if (!values) {
    return (
      <p className="rounded-2xl border border-line bg-surface px-5 py-8 text-sm text-muted shadow-[0_1px_2px_rgba(18,38,58,0.04)]">
        Cargando historia…
      </p>
    );
  }

  return <HistoryForm key={id} historyId={id} initialValues={values} />;
}
