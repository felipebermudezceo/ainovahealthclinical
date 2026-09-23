export type PatientInfo = {
  fullName: string;
  documentId: string;
  birthDate: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  gender: string;
};

export type VitalSigns = {
  bloodPressure: string;
  heartRate: string;
  respiratoryRate: string;
  temperature: string;
  oxygenSaturation: string;
  weight: string;
  height: string;
  bmi: string;
};

export type ConsultationInfo = {
  visitDate: string;
  visitTime: string;
  reason: string;
  presentIllness: string;
  medicalHistory: string;
  personalHistory: string;
  familyHistory: string;
  surgicalHistory: string;
  pharmacologicalHistory: string;
  allergies: string;
  allergicHistory: string;
  gynecologicalHistory: string;
  physicalExam: string;
  generalAppearance: string;
  headAndNeck: string;
  cardiovascularExam: string;
  respiratoryExam: string;
  abdominalExam: string;
  neurologicalExam: string;
  musculoskeletalExam: string;
  otherPhysicalFindings: string;
  diagnosis: string;
  secondaryDiagnoses: string;
  clinicalImpression: string;
  currentMedications: string;
  treatmentPlan: string;
  recommendations: string;
  requestedExams: string;
  referrals: string;
  followUp: string;
  notes: string;
  vitals: VitalSigns;
};

export type ClinicalHistory = {
  id: string;
  createdAt: string;
  patient: PatientInfo;
  consultation: ConsultationInfo;
};

export type HistoryFormValues = {
  fullName: string;
  documentId: string;
  birthDate: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  gender: string;
  visitDate: string;
  visitTime: string;
  reason: string;
  presentIllness: string;
  medicalHistory: string;
  personalHistory: string;
  familyHistory: string;
  surgicalHistory: string;
  pharmacologicalHistory: string;
  allergies: string;
  allergicHistory: string;
  gynecologicalHistory: string;
  bloodPressure: string;
  heartRate: string;
  respiratoryRate: string;
  temperature: string;
  oxygenSaturation: string;
  weight: string;
  height: string;
  bmi: string;
  physicalExam: string;
  generalAppearance: string;
  headAndNeck: string;
  cardiovascularExam: string;
  respiratoryExam: string;
  abdominalExam: string;
  neurologicalExam: string;
  musculoskeletalExam: string;
  otherPhysicalFindings: string;
  diagnosis: string;
  secondaryDiagnoses: string;
  clinicalImpression: string;
  currentMedications: string;
  treatmentPlan: string;
  recommendations: string;
  requestedExams: string;
  referrals: string;
  followUp: string;
  notes: string;
};

export type HistoryField = keyof HistoryFormValues;

export type HistoryErrors = Partial<Record<HistoryField, string>>;

export const emptyHistoryForm: HistoryFormValues = {
  fullName: "",
  documentId: "",
  birthDate: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  gender: "",
  visitDate: "",
  visitTime: "",
  reason: "",
  presentIllness: "",
  medicalHistory: "",
  personalHistory: "",
  familyHistory: "",
  surgicalHistory: "",
  pharmacologicalHistory: "",
  allergies: "",
  allergicHistory: "",
  gynecologicalHistory: "",
  bloodPressure: "",
  heartRate: "",
  respiratoryRate: "",
  temperature: "",
  oxygenSaturation: "",
  weight: "",
  height: "",
  bmi: "",
  physicalExam: "",
  generalAppearance: "",
  headAndNeck: "",
  cardiovascularExam: "",
  respiratoryExam: "",
  abdominalExam: "",
  neurologicalExam: "",
  musculoskeletalExam: "",
  otherPhysicalFindings: "",
  diagnosis: "",
  secondaryDiagnoses: "",
  clinicalImpression: "",
  currentMedications: "",
  treatmentPlan: "",
  recommendations: "",
  requestedExams: "",
  referrals: "",
  followUp: "",
  notes: "",
};
