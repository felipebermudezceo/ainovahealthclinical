export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function formatDate(value: string): string {
  if (!isIsoDate(value)) return value;
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function todayInputDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function displayValue(value: string): string {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "No registrado";
}

export function formatTime(value: string): string {
  const match = /^(\d{2}):(\d{2})/.exec(value.trim());
  return match ? `${match[1]}:${match[2]}` : value.trim();
}

export function isDeliverableEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function calculateBmi(weight: string, heightCm: string): string {
  const kilograms = Number(weight.trim().replace(",", "."));
  const centimeters = Number(heightCm.trim().replace(",", "."));
  if (!Number.isFinite(kilograms) || !Number.isFinite(centimeters)) return "";
  if (kilograms < 1 || kilograms > 400 || centimeters < 30 || centimeters > 250) return "";
  const meters = centimeters / 100;
  return (kilograms / (meters * meters)).toFixed(1);
}

export function historyReference(id: string): string {
  if (id.startsWith("hc-demo-")) return id;
  return id.slice(0, 8);
}
