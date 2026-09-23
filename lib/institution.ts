/**
 * Datos institucionales tomados de la papelería de AinovaHealth.
 * El correo no aparece en esa referencia y permanece vacío.
 */
export const INSTITUTION = {
  name: "AINOVA HEALTH",
  nit: "7005364479",
  address: "Carrera 80 J No. 72-04",
  locality: "Bosa Naranjo",
  city: "Bogotá, Colombia",
  country: "Colombia",
  phone: "+573118901570",
  email: "",
} as const;

/** Firma manuscrita, sin recorte. El archivo usado es public/firma-medico.jpg. */
export const FIXED_SIGNATURE_PATHS = [
  "/firma-medico.png",
  "/firma-medico.jpg",
  "/firma-medico.jpeg",
] as const;

export function institutionDetailLines(): string[] {
  const lines: string[] = [];
  const nit = INSTITUTION.nit.trim();
  const city = INSTITUTION.city.trim();
  const address = INSTITUTION.address.trim();
  const locality = INSTITUTION.locality.trim();
  const country = INSTITUTION.country.trim();
  const phone = INSTITUTION.phone.trim();
  const email = INSTITUTION.email.trim();

  if (nit) lines.push(`NIT: ${nit}`);
  if (city) lines.push(city);
  if (address) lines.push(address);
  if (locality) lines.push(locality);
  if (country && !city.toLowerCase().includes(country.toLowerCase())) lines.push(country);
  if (phone) lines.push(`Tel: ${phone}`);
  if (email) lines.push(email);
  return lines;
}
