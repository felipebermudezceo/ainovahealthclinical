import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ClinicalHistory, HistoryFormValues } from "@/lib/types";

const HISTORY_COLUMNS = [
  "id",
  "patient_full_name",
  "patient_document",
  "patient_birth_date",
  "patient_email",
  "patient_phone",
  "patient_address",
  "patient_city",
  "patient_gender",
  "consultation_date",
  "consultation_time",
  "reason",
  "current_illness",
  "medical_history",
  "personal_history",
  "family_history",
  "surgical_history",
  "pharmacological_history",
  "allergies",
  "allergic_history",
  "gynecological_obstetric_history",
  "blood_pressure",
  "heart_rate",
  "respiratory_rate",
  "temperature",
  "oxygen_saturation",
  "weight",
  "height",
  "bmi",
  "physical_exam",
  "general_appearance",
  "head_and_neck",
  "cardiovascular_exam",
  "respiratory_exam",
  "abdominal_exam",
  "neurological_exam",
  "musculoskeletal_exam",
  "other_physical_findings",
  "diagnosis",
  "secondary_diagnoses",
  "clinical_impression",
  "medications",
  "treatment_plan",
  "medical_recommendations",
  "requested_exams",
  "referrals",
  "follow_up",
  "observations",
  "created_at",
].join(", ");

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function toHistory(row: Record<string, unknown>): ClinicalHistory | null {
  if (typeof row.id !== "string" || typeof row.created_at !== "string") return null;

  return {
    id: row.id,
    createdAt: row.created_at,
    patient: {
      fullName: text(row.patient_full_name),
      documentId: text(row.patient_document),
      birthDate: text(row.patient_birth_date),
      email: text(row.patient_email),
      phone: text(row.patient_phone),
      address: text(row.patient_address),
      city: text(row.patient_city),
      gender: text(row.patient_gender),
    },
    consultation: {
      visitDate: text(row.consultation_date),
      visitTime: text(row.consultation_time),
      reason: text(row.reason),
      presentIllness: text(row.current_illness),
      medicalHistory: text(row.medical_history),
      personalHistory: text(row.personal_history),
      familyHistory: text(row.family_history),
      surgicalHistory: text(row.surgical_history),
      pharmacologicalHistory: text(row.pharmacological_history),
      allergies: text(row.allergies),
      allergicHistory: text(row.allergic_history),
      gynecologicalHistory: text(row.gynecological_obstetric_history),
      physicalExam: text(row.physical_exam),
      generalAppearance: text(row.general_appearance),
      headAndNeck: text(row.head_and_neck),
      cardiovascularExam: text(row.cardiovascular_exam),
      respiratoryExam: text(row.respiratory_exam),
      abdominalExam: text(row.abdominal_exam),
      neurologicalExam: text(row.neurological_exam),
      musculoskeletalExam: text(row.musculoskeletal_exam),
      otherPhysicalFindings: text(row.other_physical_findings),
      diagnosis: text(row.diagnosis),
      secondaryDiagnoses: text(row.secondary_diagnoses),
      clinicalImpression: text(row.clinical_impression),
      currentMedications: text(row.medications),
      treatmentPlan: text(row.treatment_plan),
      recommendations: text(row.medical_recommendations),
      requestedExams: text(row.requested_exams),
      referrals: text(row.referrals),
      followUp: text(row.follow_up),
      notes: text(row.observations),
      vitals: {
        bloodPressure: text(row.blood_pressure),
        heartRate: text(row.heart_rate),
        respiratoryRate: text(row.respiratory_rate),
        temperature: text(row.temperature),
        oxygenSaturation: text(row.oxygen_saturation),
        weight: text(row.weight),
        height: text(row.height),
        bmi: text(row.bmi),
      },
    },
  };
}

function rowsOf(data: unknown): ClinicalHistory[] {
  if (!Array.isArray(data)) return [];
  return data.flatMap((row) => {
    if (typeof row !== "object" || row === null) return [];
    const history = toHistory(row as Record<string, unknown>);
    return history ? [history] : [];
  });
}

async function currentUserId(supabase: SupabaseClient): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error("La sesión no es válida. Inicie sesión de nuevo.");
  }
  return data.user.id;
}

function saveError(error: { code?: string; message?: string }): Error {
  if (error.code === "PGRST204" || /column/i.test(error.message ?? "")) {
    return new Error(
      "Falta actualizar la base de datos con la migración de historias clínicas.",
    );
  }
  return new Error("No fue posible guardar la historia clínica.");
}

export async function listHistories(): Promise<ClinicalHistory[]> {
  const supabase = getSupabaseBrowserClient();
  const doctorId = await currentUserId(supabase);
  const { data, error } = await supabase
    .from("clinical_histories")
    .select(HISTORY_COLUMNS)
    .eq("doctor_id", doctorId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("No fue posible cargar las historias clínicas.");
  }

  return rowsOf(data);
}

export async function getOwnHistory(
  supabase: SupabaseClient,
  id: string,
  userId?: string,
): Promise<ClinicalHistory | null> {
  const doctorId = userId ?? (await currentUserId(supabase));
  const { data, error } = await supabase
    .from("clinical_histories")
    .select(HISTORY_COLUMNS)
    .eq("id", id)
    .eq("doctor_id", doctorId)
    .maybeSingle();

  if (error) {
    throw new Error("No fue posible consultar la historia clínica.");
  }

  if (typeof data !== "object" || data === null) return null;
  return toHistory(data as Record<string, unknown>);
}

export async function getHistory(id: string): Promise<ClinicalHistory | null> {
  return getOwnHistory(getSupabaseBrowserClient(), id);
}

export async function saveHistory(values: HistoryFormValues): Promise<ClinicalHistory> {
  const supabase = getSupabaseBrowserClient();
  const doctorId = await currentUserId(supabase);
  const { data, error } = await supabase
    .from("clinical_histories")
    .insert({
      doctor_id: doctorId,
      patient_full_name: values.fullName.trim(),
      patient_document: values.documentId.trim(),
      patient_birth_date: values.birthDate,
      patient_email: values.email.trim(),
      patient_phone: values.phone.trim(),
      patient_address: values.address.trim(),
      patient_city: values.city.trim(),
      patient_gender: values.gender.trim(),
      consultation_date: values.visitDate,
      consultation_time: values.visitTime.trim(),
      reason: values.reason.trim(),
      current_illness: values.presentIllness.trim(),
      medical_history: values.medicalHistory.trim(),
      personal_history: values.personalHistory.trim(),
      family_history: values.familyHistory.trim(),
      surgical_history: values.surgicalHistory.trim(),
      pharmacological_history: values.pharmacologicalHistory.trim(),
      allergies: values.allergies.trim(),
      allergic_history: values.allergicHistory.trim(),
      gynecological_obstetric_history: values.gynecologicalHistory.trim(),
      blood_pressure: values.bloodPressure.trim(),
      heart_rate: values.heartRate.trim(),
      respiratory_rate: values.respiratoryRate.trim(),
      temperature: values.temperature.trim(),
      oxygen_saturation: values.oxygenSaturation.trim(),
      weight: values.weight.trim(),
      height: values.height.trim(),
      bmi: values.bmi.trim(),
      physical_exam: values.physicalExam.trim(),
      general_appearance: values.generalAppearance.trim(),
      head_and_neck: values.headAndNeck.trim(),
      cardiovascular_exam: values.cardiovascularExam.trim(),
      respiratory_exam: values.respiratoryExam.trim(),
      abdominal_exam: values.abdominalExam.trim(),
      neurological_exam: values.neurologicalExam.trim(),
      musculoskeletal_exam: values.musculoskeletalExam.trim(),
      other_physical_findings: values.otherPhysicalFindings.trim(),
      diagnosis: values.diagnosis.trim(),
      secondary_diagnoses: values.secondaryDiagnoses.trim(),
      clinical_impression: values.clinicalImpression.trim(),
      medications: values.currentMedications.trim(),
      treatment_plan: values.treatmentPlan.trim(),
      medical_recommendations: values.recommendations.trim(),
      requested_exams: values.requestedExams.trim(),
      referrals: values.referrals.trim(),
      follow_up: values.followUp.trim(),
      observations: values.notes.trim(),
    })
    .select(HISTORY_COLUMNS)
    .single();

  if (error) throw saveError(error);

  if (typeof data !== "object" || data === null) {
    throw new Error("No fue posible guardar la historia clínica.");
  }

  const history = toHistory(data as Record<string, unknown>);
  if (!history) {
    throw new Error("No fue posible guardar la historia clínica.");
  }

  return history;
}
