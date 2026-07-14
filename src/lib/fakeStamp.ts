import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";

export interface FakeStampInfo {
  verifier_name: string;
  verifier_email?: string | null;
  verified_at: string;
  transaction_id: string;
  file_hash: string;
}

/**
 * Overlay a red "NON AUTHENTIFIÉ / FAUX" stamp on every page of an uploaded PDF,
 * plus a footer banner with CDAS verification metadata. Returns new PDF bytes.
 * If the input is not a valid PDF, we build a minimal one-page PDF that carries
 * the fake stamp and references the original file name.
 */
export async function stampFakePdf(
  fileBytes: ArrayBuffer,
  info: FakeStampInfo,
  fallbackFilename = "document.pdf"
): Promise<ArrayBuffer> {
  let pdfDoc: PDFDocument;
  try {
    pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
  } catch {
    pdfDoc = await PDFDocument.create();
    const p = pdfDoc.addPage([595, 842]);
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    p.drawText("Document non-PDF ou illisible :", { x: 40, y: 780, size: 12, font, color: rgb(0.2, 0.2, 0.2) });
    p.drawText(fallbackFilename, { x: 40, y: 760, size: 11, font, color: rgb(0.4, 0.4, 0.4) });
  }

  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontN = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();
    const cx = width / 2;
    const cy = height / 2;
    const r = Math.min(width, height) * 0.22;

    // Diagonal red stamp
    // Outer ring
    page.drawCircle({ x: cx, y: cy, size: r, borderColor: rgb(0.85, 0.1, 0.15), borderWidth: 4, opacity: 0.15 });
    page.drawCircle({ x: cx, y: cy, size: r - 6, borderColor: rgb(0.85, 0.1, 0.15), borderWidth: 1.5, opacity: 0.6 });

    page.drawText("NON AUTHENTIFIE", {
      x: cx - r + 8,
      y: cy + 6,
      size: r * 0.28,
      font,
      color: rgb(0.85, 0.1, 0.15),
      rotate: degrees(-20),
      opacity: 0.75,
    });
    page.drawText("FAUX  -  CDAS", {
      x: cx - r + 22,
      y: cy - r * 0.35,
      size: r * 0.18,
      font,
      color: rgb(0.85, 0.1, 0.15),
      rotate: degrees(-20),
      opacity: 0.75,
    });

    // Big diagonal watermark
    page.drawText("DOCUMENT NON RECONNU", {
      x: 40,
      y: height - 60,
      size: 14,
      font,
      color: rgb(0.85, 0.1, 0.15),
      opacity: 0.9,
    });

    // Footer banner
    page.drawRectangle({ x: 0, y: 0, width, height: 42, color: rgb(0.85, 0.1, 0.15) });
    page.drawText("VERIFICATION CDAS  -  DIPLOME INTROUVABLE DANS LE REGISTRE OFFICIEL", {
      x: 20, y: 26, size: 9, font, color: rgb(1, 1, 1),
    });
    page.drawText(
      `Verificateur: ${info.verifier_name}${info.verifier_email ? " (" + info.verifier_email + ")" : ""}  |  Transaction: ${info.transaction_id.slice(0, 8).toUpperCase()}  |  ${new Date(info.verified_at).toLocaleString("fr-FR")}`,
      { x: 20, y: 14, size: 7.5, font: fontN, color: rgb(1, 1, 1) }
    );
    page.drawText(`Empreinte SHA-256: ${info.file_hash.slice(0, 56)}...`, {
      x: 20, y: 5, size: 6.5, font: fontN, color: rgb(1, 1, 1),
    });
  }

  const bytes = await pdfDoc.save();
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}
