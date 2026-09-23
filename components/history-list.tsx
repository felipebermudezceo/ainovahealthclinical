"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ATTENDING_DOCTOR } from "@/lib/attending-doctor";
import { BrandMark } from "@/components/brand-mark";
import { primaryButtonClass, secondaryButtonClass } from "@/components/button-styles";
import { formatDate, formatTime, isIsoDate, todayInputDate } from "@/lib/format";
import { deleteHistory, listHistories } from "@/lib/histories";
import { requestSavedHistoryEmail } from "@/lib/request-history-email";
import type { ClinicalHistory } from "@/lib/types";

function patientInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function ageLabel(birthDate: string): string {
  if (!isIsoDate(birthDate)) return "";
  const [year, month, day] = birthDate.split("-").map(Number);
  const today = new Date();
  let age = today.getFullYear() - year;
  const monthDelta = today.getMonth() + 1 - month;
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < day)) age -= 1;
  if (age < 0 || age > 130) return "";
  return `${age} años`;
}

export function HistoryList({ updated = false }: { updated?: boolean }) {
  const [histories, setHistories] = useState<ClinicalHistory[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [sendingId, setSendingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [sendNotice, setSendNotice] = useState<{ id: string; ok: boolean; message: string } | null>(null);
  const [actionNotice, setActionNotice] = useState<{ ok: boolean; message: string } | null>(
    updated ? { ok: true, message: "La historia fue actualizada correctamente." } : null,
  );
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!updated) return;
    window.history.replaceState(null, "", window.location.pathname);
  }, [updated]);

  useEffect(() => {
    let active = true;

    listHistories()
      .then((rows) => {
        if (active) setHistories(rows);
      })
      .catch(() => {
        if (!active) return;
        setLoadError("No fue posible cargar las historias clínicas.");
        setHistories([]);
      });

    return () => {
      active = false;
    };
  }, []);

  async function onDelete(historyId: string) {
    if (sendingId || deletingId) return;
    const confirmed = window.confirm(
      "¿Estás seguro de que deseas eliminar esta historia? Esta acción no se puede deshacer.",
    );
    if (!confirmed) return;

    setActionNotice(null);
    setDeletingId(historyId);
    try {
      await deleteHistory(historyId);
      setHistories((current) => (current ? current.filter((item) => item.id !== historyId) : current));
      setSendNotice((current) => (current?.id === historyId ? null : current));
      setActionNotice({ ok: true, message: "Historia clínica eliminada correctamente." });
    } catch (error) {
      setActionNotice({
        ok: false,
        message: error instanceof Error ? error.message : "No fue posible eliminar la historia clínica.",
      });
    } finally {
      setDeletingId("");
    }
  }

  async function onSendPdf(historyId: string) {
    if (sendingId || deletingId) return;
    setSendNotice(null);
    setSendingId(historyId);
    try {
      const result = await requestSavedHistoryEmail(historyId);
      setSendNotice(
        result.ok
          ? { id: historyId, ok: true, message: "PDF enviado al correo del paciente." }
          : { id: historyId, ok: false, message: result.message },
      );
    } catch {
      setSendNotice({ id: historyId, ok: false, message: "No fue posible enviar el PDF." });
    } finally {
      setSendingId("");
    }
  }

  const query = search.trim().toLowerCase();
  const visibleHistories =
    histories?.filter((history) => {
      if (!query) return true;
      return (
        history.patient.fullName.toLowerCase().includes(query) ||
        history.patient.documentId.toLowerCase().includes(query)
      );
    }) ?? [];
  const consultationsToday =
    histories?.filter((history) => history.consultation.visitDate === todayInputDate()).length ?? 0;

  return (
    <div>
      <header className="mb-6 flex items-center gap-3">
        <BrandMark />
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Historias clínicas</h1>
          <p className="mt-1 text-sm leading-6 text-muted">
            Consulta y gestiona las historias clínicas de tus pacientes.
          </p>
        </div>
      </header>

      {actionNotice ? (
        <p
          role={actionNotice.ok ? "status" : "alert"}
          className={`mb-4 rounded-lg border px-3 py-2 text-sm ${
            actionNotice.ok
              ? "border-mark/20 bg-success-bg text-success-ink"
              : "border-danger/20 bg-danger-bg text-danger"
          }`}
        >
          {actionNotice.message}
        </p>
      ) : null}

      {histories === null ? (
        <p className="rounded-2xl border border-line bg-surface px-5 py-8 text-sm text-muted shadow-[0_1px_2px_rgba(18,38,58,0.04)]">
          Cargando historias…
        </p>
      ) : loadError ? (
        <p role="alert" className="rounded-2xl border border-danger/20 bg-danger-bg px-5 py-4 text-sm text-danger">
          {loadError}
        </p>
      ) : (
        <>
          <section aria-label="Resumen" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <article className="rounded-2xl border border-line bg-surface px-5 py-4 shadow-[0_1px_2px_rgba(18,38,58,0.04)]">
              <p className="text-xs font-semibold tracking-wide text-muted uppercase">Historias clínicas</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">{histories.length}</p>
              <p className="mt-1 text-sm text-muted">Total registradas</p>
            </article>
            <article className="rounded-2xl border border-line bg-surface px-5 py-4 shadow-[0_1px_2px_rgba(18,38,58,0.04)]">
              <p className="text-xs font-semibold tracking-wide text-muted uppercase">Consultas hoy</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">{consultationsToday}</p>
              <p className="mt-1 text-sm text-muted">Atención médica</p>
            </article>
          </section>

          {histories.length === 0 ? null : (
            <div className="relative mt-4">
              <label htmlFor="history-search" className="sr-only">
                Buscar paciente o documento
              </label>
              <input
                id="history-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar paciente o documento…"
                className="h-12 w-full rounded-xl border border-line bg-white px-4 pr-24 text-base text-ink outline-none placeholder:text-muted/80 focus:border-accent focus:ring-4 focus:ring-accent/10"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute inset-y-1.5 right-1.5 rounded-lg px-3 text-sm font-semibold text-muted hover:text-ink"
                >
                  Limpiar
                </button>
              ) : null}
            </div>
          )}

          {histories.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-line bg-surface px-6 py-12 text-center shadow-[0_1px_2px_rgba(18,38,58,0.04)]">
              <h2 className="text-lg font-semibold text-ink">Todavía no hay historias clínicas</h2>
              <p className="mt-2 text-sm leading-6 text-muted">Las historias que registres aparecerán aquí.</p>
              <Link href="/nueva-historia" className={`${primaryButtonClass} mt-6`}>
                Nueva historia
              </Link>
            </div>
          ) : visibleHistories.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-line bg-surface px-6 py-10 text-center shadow-[0_1px_2px_rgba(18,38,58,0.04)]">
              <h2 className="text-lg font-semibold text-ink">No encontramos historias clínicas</h2>
              <p className="mt-2 text-sm leading-6 text-muted">Prueba con otro nombre o número de documento.</p>
            </div>
          ) : (
            <ul className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {visibleHistories.map((history) => {
                const age = ageLabel(history.patient.birthDate);
                const gender = history.patient.gender.trim();
                const visitTime = history.consultation.visitTime.trim();
                const documentId = history.patient.documentId.trim();
                const identity = [documentId, age, gender].filter(Boolean);
                const sending = sendingId === history.id;
                const deleting = deletingId === history.id;
                const notice = sendNotice?.id === history.id ? sendNotice : null;

                return (
                  <li
                    key={history.id}
                    className="flex h-full flex-col rounded-2xl border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(18,38,58,0.04)]"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        aria-hidden="true"
                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white"
                      >
                        {patientInitials(history.patient.fullName)}
                      </span>
                      <div className="min-w-0">
                        <p className="text-lg font-semibold tracking-tight text-ink">{history.patient.fullName}</p>
                        {identity.length > 0 ? (
                          <p className="mt-1 text-sm leading-6 text-muted">{identity.join(" · ")}</p>
                        ) : null}
                      </div>
                    </div>

                    <dl className="mt-4 space-y-1.5 text-sm leading-6">
                      <div className="flex flex-wrap gap-x-2">
                        <dt className="text-muted">Última consulta</dt>
                        <dd className="font-medium text-ink">
                          {formatDate(history.consultation.visitDate)}
                          {visitTime ? ` · ${formatTime(visitTime)}` : ""}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted">Médico responsable</dt>
                        <dd className="font-medium text-ink">{ATTENDING_DOCTOR.fullName}</dd>
                      </div>
                    </dl>

                    <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <Link href={`/historias/${history.id}`} className={`${primaryButtonClass} w-full`}>
                        Ver historia
                      </Link>
                      <button
                        type="button"
                        onClick={() => onSendPdf(history.id)}
                        disabled={sending || deleting}
                        className={`${secondaryButtonClass} w-full`}
                      >
                        {sending ? "Enviando..." : "Enviar PDF"}
                      </button>
                      <Link
                        href={`/historias/${history.id}/editar`}
                        aria-disabled={deleting}
                        className={`${secondaryButtonClass} w-full ${deleting ? "pointer-events-none opacity-60" : ""}`}
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => onDelete(history.id)}
                        disabled={sending || deleting}
                        className={`${secondaryButtonClass} w-full text-danger`}
                      >
                        {deleting ? "Eliminando…" : "Eliminar"}
                      </button>
                    </div>
                    {notice ? (
                      <p
                        role={notice.ok ? "status" : "alert"}
                        className={`mt-3 text-sm ${notice.ok ? "text-success-ink" : "text-danger"}`}
                      >
                        {notice.message}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
