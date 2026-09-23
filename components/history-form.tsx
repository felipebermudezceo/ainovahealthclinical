"use client";

import { useRouter } from "next/navigation";
import { FormEvent, ReactNode, useState } from "react";
import { primaryButtonClass } from "@/components/button-styles";
import { DoctorSummary } from "@/components/doctor-summary";
import { SelectInput, TextArea, TextInput } from "@/components/form-controls";
import { getCurrentDoctor } from "@/lib/doctor";
import { calculateBmi } from "@/lib/format";
import { saveHistory, updateHistory } from "@/lib/histories";
import { emptyHistoryForm, type HistoryErrors, type HistoryField, type HistoryFormValues } from "@/lib/types";
import { REQUIRED_FIELD_ORDER, validateHistory } from "@/lib/validate-history";

const GENDER_OPTIONS = [
  { value: "", label: "Seleccionar" },
  { value: "Femenino", label: "Femenino" },
  { value: "Masculino", label: "Masculino" },
  { value: "Otro", label: "Otro" },
];

function Section({
  step,
  title,
  text,
  children,
}: {
  step: string;
  title: string;
  text: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-surface px-5 py-6 shadow-[0_1px_2px_rgba(18,38,58,0.04)] sm:px-7">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-accent/8 px-2 text-xs font-semibold tracking-wide text-accent">
          {step}
        </span>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted">{text}</p>
        </div>
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function HistoryForm({
  historyId,
  initialValues,
}: {
  historyId?: string;
  initialValues?: HistoryFormValues;
}) {
  const router = useRouter();
  const editing = Boolean(historyId);
  const [values, setValues] = useState<HistoryFormValues>(initialValues ?? emptyHistoryForm);
  const [errors, setErrors] = useState<HistoryErrors>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const bmi = calculateBmi(values.weight, values.height);

  function update(field: HistoryField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateHistory(values);
    setErrors(nextErrors);
    setFormError("");

    const firstInvalid = REQUIRED_FIELD_ORDER.find((field) => nextErrors[field]);
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    setSaving(true);
    try {
      if (historyId) {
        await updateHistory(historyId, { ...values, bmi });
        router.push("/historias?actualizada=1");
        return;
      }

      const history = await saveHistory({ ...values, bmi });
      let pdfReady = false;

      try {
        const doctor = await getCurrentDoctor();
        const { downloadClinicalHistoryPdf } = await import("@/lib/clinical-history-pdf");
        await downloadClinicalHistoryPdf(history, doctor);
        pdfReady = true;
      } catch {
        pdfReady = false;
      }

      const pdf = pdfReady ? "listo" : "error";
      router.push(`/historias/${history.id}?guardada=1&pdf=${pdf}`);
    } catch (error) {
      setSaving(false);
      setFormError(
        error instanceof Error
          ? error.message
          : editing
            ? "No fue posible actualizar la historia clínica."
            : "No fue posible guardar la historia clínica.",
      );
    }
  }

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          {editing ? "Editar historia clínica" : "Nueva historia clínica"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          {editing
            ? "Actualice la información clínica de esta historia."
            : "Registre la atención médica y complete la información clínica del paciente."}
        </p>
      </header>

      {hasErrors ? (
        <p role="alert" className="mb-4 rounded-lg border border-danger/20 bg-danger-bg px-3 py-2 text-sm text-danger">
          Revise los campos marcados para guardar la historia.
        </p>
      ) : null}
      {formError ? (
        <p role="alert" className="mb-4 rounded-lg border border-danger/20 bg-danger-bg px-3 py-2 text-sm text-danger">
          {formError}
        </p>
      ) : null}

      <div className="mb-4">
        <DoctorSummary />
      </div>

      <form onSubmit={onSubmit} noValidate autoComplete="off" className="space-y-5">
        <Section step="01" title="Identificación del paciente" text="Datos de identificación y contacto.">
          <TextInput wide id="fullName" label="Nombre completo" required value={values.fullName} error={errors.fullName} placeholder="Nombre y apellidos" maxLength={120} onChange={(value) => update("fullName", value)} />
          <TextInput id="documentId" label="Documento de identidad" required value={values.documentId} error={errors.documentId} placeholder="Número de documento" maxLength={20} onChange={(value) => update("documentId", value)} />
          <TextInput id="birthDate" label="Fecha de nacimiento" type="date" required value={values.birthDate} error={errors.birthDate} onChange={(value) => update("birthDate", value)} />
          <SelectInput id="gender" label="Sexo" value={values.gender} options={GENDER_OPTIONS} onChange={(value) => update("gender", value)} />
          <TextInput id="email" label="Correo electrónico" type="email" value={values.email} placeholder="paciente@correo.com" maxLength={120} onChange={(value) => update("email", value)} />
          <TextInput id="phone" label="Teléfono" type="tel" required value={values.phone} error={errors.phone} placeholder="300 000 0000" maxLength={30} onChange={(value) => update("phone", value)} />
          <TextInput wide id="address" label="Dirección" value={values.address} maxLength={180} onChange={(value) => update("address", value)} />
          <TextInput id="city" label="Ciudad" value={values.city} maxLength={80} onChange={(value) => update("city", value)} />
        </Section>

        <Section step="02" title="Motivo de consulta" text="Fecha, hora y motivo principal de la atención.">
          <TextInput id="visitDate" label="Fecha de consulta" type="date" required value={values.visitDate} error={errors.visitDate} onChange={(value) => update("visitDate", value)} />
          <TextInput id="visitTime" label="Hora de consulta" type="time" value={values.visitTime} error={errors.visitTime} onChange={(value) => update("visitTime", value)} />
          <TextArea id="reason" label="Motivo de consulta" required value={values.reason} error={errors.reason} placeholder="Motivo principal de la atención" maxLength={2000} rows={4} onChange={(value) => update("reason", value)} />
        </Section>

        <Section step="03" title="Enfermedad actual" text="Inicio, evolución y síntomas de la enfermedad actual.">
          <TextArea id="presentIllness" label="Enfermedad actual" value={values.presentIllness} maxLength={4000} rows={6} onChange={(value) => update("presentIllness", value)} />
        </Section>

        <Section step="04" title="Antecedentes" text="Antecedentes relevantes para esta atención.">
          <TextArea id="medicalHistory" label="Antecedentes médicos" value={values.medicalHistory} maxLength={4000} rows={4} onChange={(value) => update("medicalHistory", value)} />
          <TextArea id="personalHistory" label="Antecedentes personales" value={values.personalHistory} maxLength={4000} rows={4} onChange={(value) => update("personalHistory", value)} />
          <TextArea id="familyHistory" label="Antecedentes familiares" value={values.familyHistory} maxLength={4000} rows={4} onChange={(value) => update("familyHistory", value)} />
          <TextArea id="surgicalHistory" label="Antecedentes quirúrgicos" value={values.surgicalHistory} maxLength={4000} rows={4} onChange={(value) => update("surgicalHistory", value)} />
          <TextArea id="pharmacologicalHistory" label="Antecedentes farmacológicos" value={values.pharmacologicalHistory} maxLength={4000} rows={4} onChange={(value) => update("pharmacologicalHistory", value)} />
          <TextArea id="allergies" label="Alergias" value={values.allergies} maxLength={2000} rows={3} onChange={(value) => update("allergies", value)} />
          <TextArea id="allergicHistory" label="Antecedentes alérgicos" value={values.allergicHistory} maxLength={4000} rows={3} onChange={(value) => update("allergicHistory", value)} />
          <TextArea id="gynecologicalHistory" label="Antecedentes ginecoobstétricos" value={values.gynecologicalHistory} maxLength={4000} rows={4} onChange={(value) => update("gynecologicalHistory", value)} />
        </Section>

        <Section step="05" title="Signos vitales" text="Registre las mediciones de esta consulta. El IMC se calcula con peso en kg y talla en cm.">
          <div className="grid gap-5 sm:col-span-2 sm:grid-cols-2 lg:grid-cols-4">
            <TextInput id="bloodPressure" label="Presión arterial (mmHg)" value={values.bloodPressure} placeholder="120/80" maxLength={20} onChange={(value) => update("bloodPressure", value)} />
            <TextInput id="heartRate" label="Frecuencia cardíaca (lpm)" value={values.heartRate} maxLength={10} onChange={(value) => update("heartRate", value)} />
            <TextInput id="respiratoryRate" label="Frecuencia respiratoria (rpm)" value={values.respiratoryRate} maxLength={10} onChange={(value) => update("respiratoryRate", value)} />
            <TextInput id="temperature" label="Temperatura (°C)" value={values.temperature} maxLength={10} onChange={(value) => update("temperature", value)} />
            <TextInput id="oxygenSaturation" label="Saturación de oxígeno (%)" value={values.oxygenSaturation} maxLength={10} onChange={(value) => update("oxygenSaturation", value)} />
            <TextInput id="weight" label="Peso (kg)" value={values.weight} maxLength={10} onChange={(value) => update("weight", value)} />
            <TextInput id="height" label="Talla (cm)" value={values.height} maxLength={10} onChange={(value) => update("height", value)} />
            <TextInput id="bmi" label="IMC (kg/m²)" value={bmi} readOnly onChange={() => undefined} />
          </div>
        </Section>

        <Section step="06" title="Examen físico" text="Hallazgos generales y por sistemas.">
          <TextArea id="physicalExam" label="Examen físico" value={values.physicalExam} maxLength={4000} rows={4} onChange={(value) => update("physicalExam", value)} />
          <TextArea id="generalAppearance" label="Aspecto general" value={values.generalAppearance} maxLength={2000} rows={3} onChange={(value) => update("generalAppearance", value)} />
          <TextArea id="headAndNeck" label="Cabeza y cuello" value={values.headAndNeck} maxLength={2000} rows={3} onChange={(value) => update("headAndNeck", value)} />
          <TextArea id="cardiovascularExam" label="Examen cardiovascular" value={values.cardiovascularExam} maxLength={2000} rows={3} onChange={(value) => update("cardiovascularExam", value)} />
          <TextArea id="respiratoryExam" label="Examen respiratorio" value={values.respiratoryExam} maxLength={2000} rows={3} onChange={(value) => update("respiratoryExam", value)} />
          <TextArea id="abdominalExam" label="Examen abdominal" value={values.abdominalExam} maxLength={2000} rows={3} onChange={(value) => update("abdominalExam", value)} />
          <TextArea id="neurologicalExam" label="Examen neurológico" value={values.neurologicalExam} maxLength={2000} rows={3} onChange={(value) => update("neurologicalExam", value)} />
          <TextArea id="musculoskeletalExam" label="Examen osteomuscular" value={values.musculoskeletalExam} maxLength={2000} rows={3} onChange={(value) => update("musculoskeletalExam", value)} />
          <TextArea id="otherPhysicalFindings" label="Otros hallazgos" value={values.otherPhysicalFindings} maxLength={2000} rows={3} onChange={(value) => update("otherPhysicalFindings", value)} />
        </Section>

        <Section step="07" title="Evaluación y diagnóstico" text="Impresión clínica y diagnósticos de esta atención.">
          <TextArea id="diagnosis" label="Diagnóstico" required value={values.diagnosis} error={errors.diagnosis} maxLength={2000} rows={4} onChange={(value) => update("diagnosis", value)} />
          <TextArea id="secondaryDiagnoses" label="Diagnósticos secundarios" value={values.secondaryDiagnoses} maxLength={2000} rows={3} onChange={(value) => update("secondaryDiagnoses", value)} />
          <TextArea id="clinicalImpression" label="Impresión clínica" value={values.clinicalImpression} maxLength={4000} rows={4} onChange={(value) => update("clinicalImpression", value)} />
        </Section>

        <Section step="08" title="Plan de manejo" text="Conducta, medicamentos indicados y recomendaciones.">
          <TextArea id="treatmentPlan" label="Plan de tratamiento" required value={values.treatmentPlan} error={errors.treatmentPlan} maxLength={4000} rows={5} onChange={(value) => update("treatmentPlan", value)} />
          <TextArea id="currentMedications" label="Medicamentos" value={values.currentMedications} maxLength={4000} rows={4} onChange={(value) => update("currentMedications", value)} />
          <TextArea id="recommendations" label="Recomendaciones" value={values.recommendations} maxLength={4000} rows={4} onChange={(value) => update("recommendations", value)} />
        </Section>

        <Section step="09" title="Seguimiento y observaciones" text="Exámenes, remisiones, control y notas de la atención.">
          <TextArea id="requestedExams" label="Exámenes solicitados" value={values.requestedExams} maxLength={4000} rows={4} onChange={(value) => update("requestedExams", value)} />
          <TextArea id="referrals" label="Remisiones" value={values.referrals} maxLength={2000} rows={3} onChange={(value) => update("referrals", value)} />
          <TextArea id="followUp" label="Seguimiento" value={values.followUp} maxLength={2000} rows={3} onChange={(value) => update("followUp", value)} />
          <TextArea id="notes" label="Observaciones" value={values.notes} maxLength={4000} rows={4} onChange={(value) => update("notes", value)} />
        </Section>

        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface px-5 py-5 shadow-[0_1px_2px_rgba(18,38,58,0.04)] sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <p className="text-sm text-muted">Los campos con * son obligatorios. El correo del paciente es necesario solo para el envío.</p>
          <button type="submit" disabled={saving} className={`${primaryButtonClass} w-full sm:w-auto`}>
            {saving ? "Guardando…" : editing ? "Guardar cambios" : "Guardar historia clínica"}
          </button>
        </div>
      </form>
    </div>
  );
}
