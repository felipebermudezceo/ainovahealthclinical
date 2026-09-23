"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { primaryButtonClass, secondaryButtonClass } from "@/components/button-styles";
import { DoctorSummary } from "@/components/doctor-summary";
import { getCurrentDoctor } from "@/lib/doctor";
import { displayValue, formatDate, formatTime, historyReference } from "@/lib/format";
import { getHistory } from "@/lib/histories";
import { requestSavedHistoryEmail } from "@/lib/request-history-email";
import type { ClinicalHistory, ConsultationInfo, VitalSigns } from "@/lib/types";

type DetailView = {
  history: ClinicalHistory | null;
  saved: boolean;
  failed: boolean;
  emailStatus: string;
  pdfStatus: string;
};

const acknowledgedSaves = new Map<string, { emailStatus: string; pdfStatus: string }>();

function readId(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function statusMessage(emailStatus: string, pdfStatus: string): string {
  if (emailStatus === "sent" && pdfStatus !== "error") {
    return "Historia clínica guardada y enviada al correo del paciente.";
  }
  if (emailStatus === "invalid_email") {
    return "Historia clínica guardada. El PDF está disponible para descarga, pero el correo no pudo enviarse porque el correo del paciente está vacío o no es válido.";
  }
  if (emailStatus === "not_configured") {
    return "Historia clínica guardada. El PDF está disponible para descarga, pero el correo no pudo enviarse porque el envío no está configurado.";
  }
  if (emailStatus === "failed" || emailStatus === "sent") {
    const pdfNote = pdfStatus === "error" ? " No fue posible descargar el PDF en este momento; puede generarlo de nuevo." : "";
    return `Historia clínica guardada. El PDF está disponible para descarga, pero el correo no pudo enviarse.${pdfNote}`;
  }
  if (pdfStatus === "error") {
    return "Historia clínica guardada. No fue posible descargar el PDF en este momento; puede generarlo de nuevo.";
  }
  return "Historia clínica guardada correctamente.";
}

function RecordSection({
  title,
  items,
}: {
  title: string;
  items: { label: string; value: string; wide?: boolean }[];
}) {
  return (
    <section className="px-5 py-6 sm:px-7">
      <h2 className="text-base font-semibold tracking-tight text-ink">{title}</h2>
      <dl className="mt-5 grid gap-5 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className={item.wide ? "sm:col-span-2" : undefined}>
            <dt className="text-sm text-muted">{item.label}</dt>
            <dd className="mt-1 text-sm leading-6 whitespace-pre-wrap text-ink">{displayValue(item.value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function VitalGrid({ vitals }: { vitals: VitalSigns }) {
  const items = [
    { label: "Presión arterial", value: vitals.bloodPressure },
    { label: "Frecuencia cardíaca", value: vitals.heartRate },
    { label: "Frecuencia respiratoria", value: vitals.respiratoryRate },
    { label: "Temperatura", value: vitals.temperature },
    { label: "Saturación de oxígeno", value: vitals.oxygenSaturation },
    { label: "Peso", value: vitals.weight },
    { label: "Talla", value: vitals.height },
    { label: "IMC", value: vitals.bmi },
  ];

  return (
    <section className="px-5 py-6 sm:px-7">
      <h2 className="text-base font-semibold tracking-tight text-ink">Signos vitales</h2>
      <dl className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl border border-line bg-background px-3 py-3">
            <dt className="text-xs text-muted">{item.label}</dt>
            <dd className="mt-1 text-sm font-medium">{displayValue(item.value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function consultationSections(consultation: ConsultationInfo) {
  return [
    {
      title: "Datos de la consulta",
      items: [
        { label: "Fecha de consulta", value: formatDate(consultation.visitDate) },
        { label: "Hora de consulta", value: formatTime(consultation.visitTime) },
      ],
    },
    {
      title: "Motivo de consulta",
      items: [{ label: "Motivo", value: consultation.reason, wide: true }],
    },
    {
      title: "Enfermedad actual",
      items: [{ label: "Enfermedad actual", value: consultation.presentIllness, wide: true }],
    },
    {
      title: "Antecedentes",
      items: [
        { label: "Antecedentes médicos", value: consultation.medicalHistory, wide: true },
        { label: "Antecedentes personales", value: consultation.personalHistory, wide: true },
        { label: "Antecedentes familiares", value: consultation.familyHistory, wide: true },
        { label: "Antecedentes quirúrgicos", value: consultation.surgicalHistory, wide: true },
        { label: "Antecedentes farmacológicos", value: consultation.pharmacologicalHistory, wide: true },
        { label: "Alergias", value: consultation.allergies, wide: true },
        { label: "Antecedentes alérgicos", value: consultation.allergicHistory, wide: true },
        { label: "Antecedentes ginecoobstétricos", value: consultation.gynecologicalHistory, wide: true },
      ],
    },
    {
      title: "Examen físico",
      items: [
        { label: "Examen físico", value: consultation.physicalExam, wide: true },
        { label: "Aspecto general", value: consultation.generalAppearance, wide: true },
        { label: "Cabeza y cuello", value: consultation.headAndNeck, wide: true },
        { label: "Examen cardiovascular", value: consultation.cardiovascularExam, wide: true },
        { label: "Examen respiratorio", value: consultation.respiratoryExam, wide: true },
        { label: "Examen abdominal", value: consultation.abdominalExam, wide: true },
        { label: "Examen neurológico", value: consultation.neurologicalExam, wide: true },
        { label: "Examen osteomuscular", value: consultation.musculoskeletalExam, wide: true },
        { label: "Otros hallazgos", value: consultation.otherPhysicalFindings, wide: true },
      ],
    },
    {
      title: "Diagnóstico / evaluación",
      items: [
        { label: "Diagnóstico", value: consultation.diagnosis, wide: true },
        { label: "Diagnósticos secundarios", value: consultation.secondaryDiagnoses, wide: true },
        { label: "Impresión clínica", value: consultation.clinicalImpression, wide: true },
      ],
    },
    {
      title: "Plan de manejo",
      items: [{ label: "Plan de tratamiento", value: consultation.treatmentPlan, wide: true }],
    },
    {
      title: "Medicamentos",
      items: [{ label: "Medicamentos", value: consultation.currentMedications, wide: true }],
    },
    {
      title: "Recomendaciones",
      items: [{ label: "Recomendaciones", value: consultation.recommendations, wide: true }],
    },
    {
      title: "Exámenes / remisiones",
      items: [
        { label: "Exámenes solicitados", value: consultation.requestedExams, wide: true },
        { label: "Remisiones", value: consultation.referrals, wide: true },
      ],
    },
    {
      title: "Seguimiento",
      items: [{ label: "Seguimiento", value: consultation.followUp, wide: true }],
    },
    {
      title: "Observaciones",
      items: [{ label: "Observaciones", value: consultation.notes, wide: true }],
    },
  ];
}

export function HistoryDetail() {
  const params = useParams<{ id: string }>();
  const id = readId(params.id);
  const [view, setView] = useState<DetailView | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailNotice, setEmailNotice] = useState("");
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    let active = true;
    const search = new URLSearchParams(window.location.search);
    const savedNow = search.get("guardada") === "1";
    const emailStatus = savedNow ? (search.get("correo") ?? "") : (acknowledgedSaves.get(id)?.emailStatus ?? "");
    const pdfStatus = savedNow ? (search.get("pdf") ?? "") : (acknowledgedSaves.get(id)?.pdfStatus ?? "");
    if (savedNow) acknowledgedSaves.set(id, { emailStatus, pdfStatus });

    getHistory(id)
      .then((history) => {
        if (!active) return;
        const remembered = acknowledgedSaves.get(id);
        setView({
          history,
          saved: savedNow || Boolean(remembered),
          failed: false,
          emailStatus: savedNow ? emailStatus : (remembered?.emailStatus ?? ""),
          pdfStatus: savedNow ? pdfStatus : (remembered?.pdfStatus ?? ""),
        });
      })
      .catch(() => {
        if (!active) return;
        setView({ history: null, saved: false, failed: true, emailStatus: "", pdfStatus: "" });
      });

    if (savedNow) {
      window.history.replaceState(null, "", window.location.pathname);
    }

    const timeout = window.setTimeout(() => {
      acknowledgedSaves.delete(id);
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [id]);

  async function onSendPdf() {
    if (!view?.history || emailBusy) return;
    setEmailNotice("");
    setEmailError("");
    setEmailBusy(true);

    try {
      const result = await requestSavedHistoryEmail(view.history.id);
      if (result.ok) {
        setEmailNotice("PDF enviado al correo del paciente.");
      } else {
        setEmailError(result.message);
      }
    } catch {
      setEmailError("No fue posible enviar el PDF.");
    } finally {
      setEmailBusy(false);
    }
  }

  async function onGeneratePdf() {
    if (!view?.history || pdfBusy) return;
    setPdfError("");
    setPdfBusy(true);

    try {
      const [current, doctor] = await Promise.all([
        getHistory(view.history.id),
        getCurrentDoctor(),
      ]);
      if (!current) {
        setPdfError("No fue posible generar el PDF de esta historia.");
        return;
      }
      const { downloadClinicalHistoryPdf } = await import("@/lib/clinical-history-pdf");
      await downloadClinicalHistoryPdf(current, doctor);
    } catch {
      setPdfError("No fue posible generar el PDF de esta historia.");
    } finally {
      setPdfBusy(false);
    }
  }

  if (view === null) {
    return <p className="text-sm text-muted">Cargando historia…</p>;
  }

  if (!view.history) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {view.failed ? "No fue posible consultar la historia" : "Historia no encontrada"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          {view.failed
            ? "Intente de nuevo en unos momentos."
            : "No hay una historia clínica con esta referencia en su cuenta."}
        </p>
        <Link href="/historias" className={`${secondaryButtonClass} mt-6 w-full sm:w-auto`}>
          Volver a historias
        </Link>
      </div>
    );
  }

  const { history, saved, emailStatus, pdfStatus } = view;
  const sections = consultationSections(history.consultation);
  const beforeVitals = sections.slice(0, 4);
  const afterVitals = sections.slice(4);

  return (
    <div>
      {saved ? (
        <p role="status" className="mb-6 rounded-xl border border-accent/20 bg-success-bg px-4 py-3 text-sm leading-6 text-success-ink">
          {statusMessage(emailStatus, pdfStatus)}
        </p>
      ) : null}

      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-line bg-surface px-5 py-6 shadow-[0_1px_2px_rgba(18,38,58,0.04)] sm:flex-row sm:items-start sm:justify-between sm:px-7">
        <div>
          <p className="text-sm font-semibold text-accent">Historia clínica</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">{history.patient.fullName}</h1>
          <p className="mt-2 text-sm text-muted">
            Documento {history.patient.documentId} · Atención {formatDate(history.consultation.visitDate)}
            {history.consultation.visitTime.trim() ? ` · ${formatTime(history.consultation.visitTime)}` : ""}
          </p>
          <p className="mt-1 text-sm text-muted">Referencia {historyReference(history.id)}</p>
        </div>
        <Link href="/historias" className={`${secondaryButtonClass} w-full sm:w-auto`}>
          Volver a historias
        </Link>
      </div>

      <div className="mb-4">
        <DoctorSummary />
      </div>

      <article className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_1px_2px_rgba(18,38,58,0.04)]">
        <RecordSection
          title="Identificación del paciente"
          items={[
            { label: "Nombre completo", value: history.patient.fullName, wide: true },
            { label: "Documento de identidad", value: history.patient.documentId },
            { label: "Fecha de nacimiento", value: formatDate(history.patient.birthDate) },
            { label: "Sexo", value: history.patient.gender },
            { label: "Correo electrónico", value: history.patient.email },
            { label: "Teléfono", value: history.patient.phone },
            { label: "Dirección", value: history.patient.address, wide: true },
            { label: "Ciudad", value: history.patient.city },
          ]}
        />
        {beforeVitals.map((section) => (
          <div key={section.title} className="border-t border-line">
            <RecordSection title={section.title} items={section.items} />
          </div>
        ))}
        <div className="border-t border-line">
          <VitalGrid vitals={history.consultation.vitals} />
        </div>
        {afterVitals.map((section) => (
          <div key={section.title} className="border-t border-line">
            <RecordSection title={section.title} items={section.items} />
          </div>
        ))}
      </article>

      <div className="mt-6 flex flex-col-reverse gap-3 rounded-2xl border border-line bg-surface px-5 py-5 shadow-[0_1px_2px_rgba(18,38,58,0.04)] sm:flex-row sm:items-center sm:justify-end sm:px-7">
        <button
          type="button"
          onClick={onGeneratePdf}
          disabled={pdfBusy}
          className={`${secondaryButtonClass} w-full sm:w-auto`}
        >
          {pdfBusy ? "Generando PDF…" : "Generar PDF"}
        </button>
        <button
          type="button"
          onClick={onSendPdf}
          disabled={emailBusy}
          className={`${primaryButtonClass} w-full sm:w-auto`}
        >
          {emailBusy ? "Enviando..." : "Enviar PDF al paciente"}
        </button>
      </div>
      {emailNotice ? (
        <p role="status" className="mt-3 text-sm text-success-ink">
          {emailNotice}
        </p>
      ) : null}
      {emailError ? (
        <p role="alert" className="mt-3 text-sm text-danger">
          {emailError}
        </p>
      ) : null}
      {pdfError ? (
        <p role="alert" className="mt-3 text-sm text-danger">
          {pdfError}
        </p>
      ) : null}
    </div>
  );
}
