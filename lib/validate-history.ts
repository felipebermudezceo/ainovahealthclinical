import { isIsoDate, todayInputDate } from "@/lib/format";
import type { HistoryErrors, HistoryField, HistoryFormValues } from "@/lib/types";

export const REQUIRED_FIELD_ORDER: HistoryField[] = [
  "fullName",
  "documentId",
  "birthDate",
  "phone",
  "visitDate",
  "reason",
  "diagnosis",
  "treatmentPlan",
];

export function validateHistory(values: HistoryFormValues): HistoryErrors {
  const errors: HistoryErrors = {};
  const today = todayInputDate();

  if (values.fullName.trim().length < 3) {
    errors.fullName = "Ingrese el nombre completo.";
  }

  if (values.documentId.trim().length < 5) {
    errors.documentId = "Ingrese un documento de identidad válido.";
  }

  if (!isIsoDate(values.birthDate)) {
    errors.birthDate = "Seleccione la fecha de nacimiento.";
  } else if (values.birthDate > today) {
    errors.birthDate = "La fecha de nacimiento no puede ser futura.";
  }

  if (values.phone.replace(/\D/g, "").length < 7) {
    errors.phone = "Ingrese un teléfono de contacto.";
  }

  if (!isIsoDate(values.visitDate)) {
    errors.visitDate = "Seleccione la fecha de atención.";
  }

  if (values.visitTime.trim() && !/^\d{2}:\d{2}$/.test(values.visitTime.trim())) {
    errors.visitTime = "Ingrese una hora válida.";
  }

  if (values.reason.trim().length < 3) {
    errors.reason = "Describa el motivo de consulta.";
  }

  if (values.diagnosis.trim().length < 3) {
    errors.diagnosis = "Registre el diagnóstico.";
  }

  if (values.treatmentPlan.trim().length < 3) {
    errors.treatmentPlan = "Registre el plan de manejo.";
  }

  return errors;
}
