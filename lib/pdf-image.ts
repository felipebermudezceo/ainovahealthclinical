export type PdfImage = {
  dataUrl: string;
  format: "PNG" | "JPEG";
  width: number;
  height: number;
};

function readUint32(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] ?? 0) << 24) |
    ((bytes[offset + 1] ?? 0) << 16) |
    ((bytes[offset + 2] ?? 0) << 8) |
    (bytes[offset + 3] ?? 0)
  ) >>> 0;
}

function pngSize(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 24 || bytes[0] !== 0x89 || bytes[1] !== 0x50) return null;
  const width = readUint32(bytes, 16);
  const height = readUint32(bytes, 20);
  if (width < 1 || height < 1) return null;
  return { width, height };
}

function jpegSize(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let offset = 2;

  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) return null;
    const marker = bytes[offset + 1] ?? 0;
    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2;
      continue;
    }
    const length = ((bytes[offset + 2] ?? 0) << 8) + (bytes[offset + 3] ?? 0);
    if (length < 2 || offset + 2 + length > bytes.length) return null;
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      const height = ((bytes[offset + 5] ?? 0) << 8) + (bytes[offset + 6] ?? 0);
      const width = ((bytes[offset + 7] ?? 0) << 8) + (bytes[offset + 8] ?? 0);
      if (width < 1 || height < 1) return null;
      return { width, height };
    }
    offset += 2 + length;
  }

  return null;
}

function toDataUrl(bytes: Uint8Array, format: "PNG" | "JPEG"): string {
  const mime = format === "PNG" ? "image/png" : "image/jpeg";
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return `data:${mime};base64,${btoa(binary)}`;
}

export function imageFromBytes(bytes: Uint8Array): PdfImage | null {
  const png = pngSize(bytes);
  if (png) return { dataUrl: toDataUrl(bytes, "PNG"), format: "PNG", ...png };
  const jpeg = jpegSize(bytes);
  if (jpeg) return { dataUrl: toDataUrl(bytes, "JPEG"), format: "JPEG", ...jpeg };
  return null;
}

export async function imageFromUrl(url: string): Promise<PdfImage | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return imageFromBytes(new Uint8Array(await response.arrayBuffer()));
  } catch {
    return null;
  }
}
