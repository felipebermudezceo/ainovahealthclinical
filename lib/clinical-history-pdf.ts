import { jsPDF } from "jspdf";
import { ATTENDING_DOCTOR } from "@/lib/attending-doctor";
import type { DoctorProfile } from "@/lib/doctor";
import { displayValue, formatDate, formatTime, todayInputDate } from "@/lib/format";
import { FIXED_SIGNATURE_PATHS, INSTITUTION, institutionDetailLines } from "@/lib/institution";
import { imageFromUrl, type PdfImage } from "@/lib/pdf-image";
import type { ClinicalHistory } from "@/lib/types";

const LOGO_PATH = "/ainovahealth-logo.png";
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN_X = 16;
const MARGIN_TOP = 12;
const FOOTER_RESERVE = 16;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const CONTENT_BOTTOM = PAGE_HEIGHT - FOOTER_RESERVE;
const LOGO_SIZE = 16;

const INK: [number, number, number] = [28, 43, 41];
const MUTED: [number, number, number] = [93, 109, 106];
const ACCENT: [number, number, number] = [27, 86, 80];
const LINE: [number, number, number] = [213, 223, 220];
const WASH: [number, number, number] = [243, 245, 244];

type FieldLine = { label: string; value: string };

function lineHeight(fontSize: number): number {
  return fontSize * 0.3528 * 1.35;
}

function fitImage(image: PdfImage, maxWidth: number, maxHeight: number): { width: number; height: number } {
  const ratio = image.width / image.height;
  let width = maxHeight * ratio;
  let height = maxHeight;
  if (width > maxWidth) {
    width = maxWidth;
    height = maxWidth / ratio;
  }
  return { width, height };
}

export function buildClinicalHistoryPdf(input: {
  history: ClinicalHistory;
  doctor: DoctorProfile;
  logo: PdfImage;
  signature: PdfImage | null;
}): Uint8Array {
  const { history, logo, signature } = input;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = 0;

  function wrap(value: string, width: number, fontSize = 10): string[] {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(fontSize);
    const wrapped = doc.splitTextToSize(value, width);
    return Array.isArray(wrapped) ? wrapped : [wrapped];
  }

  function drawHeader(): number {
    const details = institutionDetailLines();
    const textX = MARGIN_X + LOGO_SIZE + 4;
    const nameY = MARGIN_TOP + 5;
    doc.addImage(logo.dataUrl, logo.format, MARGIN_X, MARGIN_TOP, LOGO_SIZE, LOGO_SIZE);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...INK);
    doc.text(INSTITUTION.name, textX, nameY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    let cursor = nameY + 4.8;
    for (const line of details) {
      doc.text(line, textX, cursor);
      cursor += 3.7;
    }
    const rule = Math.max(MARGIN_TOP + LOGO_SIZE, cursor) + 2.2;
    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(0.45);
    doc.line(MARGIN_X, rule, PAGE_WIDTH - MARGIN_X, rule);
    return rule + 7;
  }

  function ensure(height: number) {
    if (y + height <= CONTENT_BOTTOM) return;
    doc.addPage();
    y = drawHeader();
  }

  function openSection(title: string, reserve = 14) {
    ensure(8 + reserve);
    y += 1.5;
    doc.setFillColor(...ACCENT);
    doc.rect(MARGIN_X, y - 3.1, 1.3, 4, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...ACCENT);
    doc.text(title, MARGIN_X + 4, y);
    y += 2.2;
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.2);
    doc.line(MARGIN_X, y, PAGE_WIDTH - MARGIN_X, y);
    y += 4.2;
  }

  function paintParagraph(label: string, value: string) {
    const lines = wrap(displayValue(value), CONTENT_WIDTH, 10);
    ensure(lineHeight(8) + lineHeight(10));
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(label, MARGIN_X, y);
    y += lineHeight(8);
    doc.setFontSize(10);
    doc.setTextColor(...INK);
    for (const line of lines) {
      ensure(lineHeight(10));
      doc.text(line, MARGIN_X, y);
      y += lineHeight(10);
    }
    y += 2.4;
  }

  function paintIdentity(title: string, rows: FieldLine[], x: number, width: number, top: number, height: number) {
    doc.setFillColor(...WASH);
    doc.roundedRect(x, top, width, height, 1.4, 1.4, "F");
    let cursor = top + 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...ACCENT);
    doc.text(title, x + 3.5, cursor);
    cursor += 5;
    for (const row of rows) {
      const lines = wrap(displayValue(row.value), width - 7, 9);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...MUTED);
      doc.text(row.label, x + 3.5, cursor);
      cursor += 3.4;
      doc.setFontSize(9);
      doc.setTextColor(...INK);
      for (const line of lines) {
        doc.text(line, x + 3.5, cursor);
        cursor += lineHeight(9);
      }
      cursor += 1.4;
    }
  }

  function identityHeight(rows: FieldLine[], width: number): number {
    let height = 12;
    for (const row of rows) {
      height += 3.4 + wrap(displayValue(row.value), width - 7, 9).length * lineHeight(9) + 1.4;
    }
    return height + 2;
  }

  function paintVitals() {
    const items: FieldLine[] = [
      { label: "Presión arterial", value: history.consultation.vitals.bloodPressure },
      { label: "Frecuencia cardíaca", value: history.consultation.vitals.heartRate },
      { label: "Frecuencia respiratoria", value: history.consultation.vitals.respiratoryRate },
      { label: "Temperatura", value: history.consultation.vitals.temperature },
      { label: "Saturación de oxígeno", value: history.consultation.vitals.oxygenSaturation },
      { label: "Peso", value: history.consultation.vitals.weight },
      { label: "Talla", value: history.consultation.vitals.height },
      { label: "IMC", value: history.consultation.vitals.bmi },
    ];
    const gap = 2.2;
    const columns = 4;
    const cellWidth = (CONTENT_WIDTH - gap * (columns - 1)) / columns;
    const cellHeight = 14;
    const rows = Math.ceil(items.length / columns);
    ensure(rows * cellHeight + (rows - 1) * gap);
    items.forEach((item, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = MARGIN_X + column * (cellWidth + gap);
      const top = y + row * (cellHeight + gap);
      doc.setFillColor(...WASH);
      doc.roundedRect(x, top, cellWidth, cellHeight, 1.2, 1.2, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...MUTED);
      doc.text(item.label, x + 2.2, top + 4.2);
      doc.setFontSize(10);
      doc.setTextColor(...INK);
      const value = wrap(displayValue(item.value), cellWidth - 4.4, 10)[0] ?? "";
      doc.text(value, x + 2.2, top + 9.2);
    });
    y += rows * cellHeight + (rows - 1) * gap + 2;
  }

  function paintClosing() {
    const fitted = signature ? fitImage(signature, 78, 36) : null;
    const imageBlock = (fitted?.height ?? 12) + 4;
    const doctorLines = [
      ATTENDING_DOCTOR.fullName,
      ATTENDING_DOCTOR.specialty,
      ATTENDING_DOCTOR.role,
      ATTENDING_DOCTOR.professionalLicense,
    ];
    ensure(imageBlock + doctorLines.length * 4.6 + 6);
    if (fitted && signature) {
      doc.addImage(signature.dataUrl, signature.format, MARGIN_X, y, fitted.width, fitted.height);
      y += fitted.height + 4;
    } else {
      const lineY = y + 10;
      doc.setDrawColor(...INK);
      doc.setLineWidth(0.25);
      doc.line(MARGIN_X, lineY, MARGIN_X + 62, lineY);
      y = lineY + 5;
    }
    doc.setTextColor(...INK);
    doctorLines.forEach((line, index) => {
      doc.setFont("helvetica", index === 0 ? "bold" : "normal");
      doc.setFontSize(index === 0 ? 10 : 9);
      doc.text(line, MARGIN_X, y);
      y += 4.6;
    });
  }

  y = drawHeader();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...INK);
  doc.text("HISTORIA CLÍNICA", MARGIN_X, y);
  y += 5;
  const when = [
    `Fecha de consulta: ${formatDate(history.consultation.visitDate) || "No registrado"}`,
    history.consultation.visitTime.trim()
      ? `Hora: ${formatTime(history.consultation.visitTime)}`
      : "",
  ]
    .filter(Boolean)
    .join("   ·   ");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(when, MARGIN_X, y);
  y += 6;

  const patientRows: FieldLine[] = [
    { label: "Nombre", value: history.patient.fullName },
    { label: "Documento", value: history.patient.documentId },
    { label: "Fecha de nacimiento", value: formatDate(history.patient.birthDate) },
    { label: "Sexo", value: history.patient.gender },
    { label: "Correo", value: history.patient.email },
    { label: "Teléfono", value: history.patient.phone },
    { label: "Dirección", value: history.patient.address },
    { label: "Ciudad", value: history.patient.city },
  ];
  const panelHeight = identityHeight(patientRows, CONTENT_WIDTH);
  ensure(panelHeight + 2);
  paintIdentity("PACIENTE", patientRows, MARGIN_X, CONTENT_WIDTH, y, panelHeight);
  y += panelHeight + 4;

  const sections: { title: string; fields: FieldLine[] }[] = [
    {
      title: "INFORMACIÓN DE LA CONSULTA",
      fields: [
        { label: "Fecha de consulta", value: formatDate(history.consultation.visitDate) },
        { label: "Hora de consulta", value: formatTime(history.consultation.visitTime) },
        { label: "Motivo de consulta", value: history.consultation.reason },
        { label: "Enfermedad actual", value: history.consultation.presentIllness },
      ],
    },
    {
      title: "ANTECEDENTES",
      fields: [
        { label: "Antecedentes médicos", value: history.consultation.medicalHistory },
        { label: "Antecedentes personales", value: history.consultation.personalHistory },
        { label: "Antecedentes familiares", value: history.consultation.familyHistory },
        { label: "Antecedentes quirúrgicos", value: history.consultation.surgicalHistory },
        { label: "Antecedentes farmacológicos", value: history.consultation.pharmacologicalHistory },
        { label: "Alergias", value: history.consultation.allergies },
        { label: "Antecedentes alérgicos", value: history.consultation.allergicHistory },
        { label: "Antecedentes ginecoobstétricos", value: history.consultation.gynecologicalHistory },
      ],
    },
    {
      title: "MEDICAMENTOS",
      fields: [{ label: "Medicamentos", value: history.consultation.currentMedications }],
    },
  ];

  for (const section of sections) {
    openSection(section.title);
    for (const field of section.fields) paintParagraph(field.label, field.value);
  }

  openSection("SIGNOS VITALES", 36);
  paintVitals();

  openSection("EXAMEN FÍSICO");
  for (const field of [
    { label: "Examen físico", value: history.consultation.physicalExam },
    { label: "Aspecto general", value: history.consultation.generalAppearance },
    { label: "Cabeza y cuello", value: history.consultation.headAndNeck },
    { label: "Examen cardiovascular", value: history.consultation.cardiovascularExam },
    { label: "Examen respiratorio", value: history.consultation.respiratoryExam },
    { label: "Examen abdominal", value: history.consultation.abdominalExam },
    { label: "Examen neurológico", value: history.consultation.neurologicalExam },
    { label: "Examen osteomuscular", value: history.consultation.musculoskeletalExam },
    { label: "Otros hallazgos", value: history.consultation.otherPhysicalFindings },
  ]) {
    paintParagraph(field.label, field.value);
  }

  openSection("DIAGNÓSTICOS");
  paintParagraph("Diagnóstico", history.consultation.diagnosis);
  paintParagraph("Diagnósticos secundarios", history.consultation.secondaryDiagnoses);
  openSection("IMPRESIÓN CLÍNICA");
  paintParagraph("Impresión clínica", history.consultation.clinicalImpression);
  openSection("PLAN DE TRATAMIENTO");
  paintParagraph("Plan de tratamiento", history.consultation.treatmentPlan);
  openSection("RECOMENDACIONES");
  paintParagraph("Recomendaciones", history.consultation.recommendations);
  openSection("EXÁMENES SOLICITADOS");
  paintParagraph("Exámenes solicitados", history.consultation.requestedExams);
  openSection("REMISIONES");
  paintParagraph("Remisiones", history.consultation.referrals);
  openSection("SEGUIMIENTO");
  paintParagraph("Seguimiento", history.consultation.followUp);
  openSection("OBSERVACIONES");
  paintParagraph("Observaciones", history.consultation.notes);
  paintClosing();

  const generatedOn = formatDate(todayInputDate());
  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page += 1) {
    doc.setPage(page);
    const footerY = PAGE_HEIGHT - 8;
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.2);
    doc.line(MARGIN_X, footerY - 4, PAGE_WIDTH - MARGIN_X, footerY - 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(history.id, MARGIN_X, footerY);
    doc.text(`Generado ${generatedOn}`, PAGE_WIDTH / 2, footerY, { align: "center" });
    doc.text(`Página ${page} de ${total}`, PAGE_WIDTH - MARGIN_X, footerY, { align: "right" });
  }

  return new Uint8Array(doc.output("arraybuffer"));
}

async function loadFixedSignature(): Promise<PdfImage | null> {
  for (const path of FIXED_SIGNATURE_PATHS) {
    const image = await imageFromUrl(path);
    if (image) return image;
  }
  return null;
}

async function loadSignature(doctor: DoctorProfile): Promise<PdfImage | null> {
  const fixed = await loadFixedSignature();
  if (fixed) return fixed;
  const remote = doctor.signatureUrl.trim();
  if (!remote.startsWith("https://") && !remote.startsWith("http://")) return null;
  return imageFromUrl(remote);
}

function downloadBytes(bytes: Uint8Array, filename: string) {
  const blob = new Blob([Uint8Array.from(bytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function downloadClinicalHistoryPdf(
  history: ClinicalHistory,
  doctor: DoctorProfile,
): Promise<void> {
  const logo = await imageFromUrl(LOGO_PATH);
  if (!logo) throw new Error("No fue posible cargar el logo.");
  const signature = await loadSignature(doctor);
  const bytes = buildClinicalHistoryPdf({ history, doctor, logo, signature });
  downloadBytes(bytes, `historia-clinica-${history.id}.pdf`);
}

export { LOGO_PATH };
