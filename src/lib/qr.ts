import QRCode from "qrcode";

/**
 * QR token format used by CDAS:
 * "CDAS:<qr_token>" — the verifier extracts the token after the prefix.
 */
export const QR_PREFIX = "CDAS:";

export function buildQrPayload(qrToken: string) {
  return `${QR_PREFIX}${qrToken}`;
}

export function parseQrPayload(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.startsWith(QR_PREFIX)) return trimmed.slice(QR_PREFIX.length);
  // Tolerate plain tokens too
  if (/^[a-f0-9]{32}$/i.test(trimmed)) return trimmed;
  return null;
}

export async function generateQrDataUrl(qrToken: string, size = 256) {
  return QRCode.toDataURL(buildQrPayload(qrToken), {
    errorCorrectionLevel: "M",
    margin: 1,
    width: size,
    color: { dark: "#0a2342", light: "#ffffff" },
  });
}
