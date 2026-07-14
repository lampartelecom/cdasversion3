import jsPDF from "jspdf";
import { generateQrDataUrl } from "./qr";

export interface AttestationData {
  attestation_number: string;
  reference: string;
  sub_reference?: string | null; // IUT/DA/DFI/CD/DSI/SCI
  qr_token: string;
  holder_name: string;
  sexe?: string | null;
  matricule?: string | null;
  birth_date: string | null;
  birth_place: string | null;
  diploma_type: string;
  specialization: string | null;
  institution: string;
  year: string;
  mention: string | null;
  grade_letter?: string | null;
  credits?: number | null;
  jury_session?: string | null;
  director_name?: string | null;
  issued_at: string;
  pdf_hash?: string;
}

export interface CertifiedOverlay {
  verifier_name: string;
  verifier_email?: string | null;
  verified_at: string;
  transaction_id: string;
  amount: number;
  pdf_hash: string;
}

const BLUE = [10, 45, 110] as const;
const LIGHT_BLUE = [180, 200, 235] as const;
const GOLD = [200, 160, 40] as const;
const RED = [192, 32, 45] as const;
const GREY = [100, 100, 100] as const;
const DARK = [20, 20, 20] as const;
const STAMP_BLUE = [20, 60, 140] as const;

type RGB = readonly [number, number, number];
function setColor(doc: jsPDF, kind: "text" | "fill" | "draw", rgb: RGB) {
  const [r, g, b] = rgb;
  if (kind === "text") doc.setTextColor(r, g, b);
  else if (kind === "fill") doc.setFillColor(r, g, b);
  else doc.setDrawColor(r, g, b);
}

/** Draw the ornamental double-border like the printed template. */
function drawFrame(doc: jsPDF) {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  setColor(doc, "draw", LIGHT_BLUE);
  doc.setLineWidth(1.2);
  doc.rect(8, 8, pw - 16, ph - 16);
  doc.setLineWidth(0.3);
  doc.rect(10.5, 10.5, pw - 21, ph - 21);
}

/** Small logo mark for the University seal (upper-left). */
function drawUnivLogo(doc: jsPDF, cx: number, cy: number, r: number) {
  setColor(doc, "draw", BLUE);
  setColor(doc, "fill", [255, 255, 255]);
  doc.setLineWidth(0.6);
  doc.circle(cx, cy, r, "FD");
  doc.setLineWidth(0.3);
  doc.circle(cx, cy, r - 1.2, "S");
  setColor(doc, "text", BLUE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(4.5);
  // Curved-ish label approximated with two lines
  doc.text("UNIVERSITE", cx, cy - r + 3, { align: "center" });
  doc.text("DE DOUALA", cx, cy + r - 1.5, { align: "center" });
  // Central emblem
  setColor(doc, "fill", GOLD);
  doc.circle(cx, cy, 2.2, "F");
  setColor(doc, "draw", BLUE);
  doc.setLineWidth(0.4);
  doc.line(cx - 3, cy, cx + 3, cy);
}

/** IUT Douala wordmark upper-right. */
function drawIutLogo(doc: jsPDF, x: number, y: number) {
  setColor(doc, "text", BLUE);
  doc.setFont("helvetica", "bolditalic");
  doc.setFontSize(22);
  doc.text("iut", x, y, { align: "right" });
  setColor(doc, "text", RED);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("DOUALA", x, y + 5, { align: "right" });
  setColor(doc, "draw", GOLD);
  doc.setLineWidth(0.7);
  doc.line(x - 20, y + 6.5, x, y + 6.5);
}

/** Official round stamp of the director. */
function drawOfficialStamp(doc: jsPDF, cx: number, cy: number) {
  const r = 18;
  setColor(doc, "draw", STAMP_BLUE);
  doc.setLineWidth(0.9);
  doc.circle(cx, cy, r, "S");
  doc.setLineWidth(0.4);
  doc.circle(cx, cy, r - 2, "S");
  setColor(doc, "text", STAMP_BLUE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  // top arc text (approximated as straight)
  doc.text("REPUBLIQUE DU CAMEROUN", cx, cy - r + 3.5, { align: "center" });
  doc.setFontSize(5);
  doc.text("MINESUP · UNIVERSITE DE DOUALA", cx, cy - r + 6.5, { align: "center" });
  doc.setFontSize(7);
  doc.text("IUT", cx, cy - 1, { align: "center" });
  doc.setFontSize(5.5);
  doc.text("Le Directeur", cx, cy + 3, { align: "center" });
  doc.setFontSize(5);
  doc.text("· DOUALA ·", cx, cy + r - 3, { align: "center" });
  // small star ornaments
  doc.setFontSize(6);
  doc.text("★", cx - r + 3, cy, { align: "center" });
  doc.text("★", cx + r - 3, cy, { align: "center" });
}

/** Handwritten-looking signature stroke. */
function drawSignature(doc: jsPDF, x: number, y: number) {
  setColor(doc, "draw", [20, 40, 130]);
  doc.setLineWidth(0.6);
  // A stylised "P" + curve
  doc.line(x, y, x + 3, y - 6);
  doc.line(x + 3, y - 6, x + 8, y - 2);
  doc.line(x + 4, y - 3, x + 10, y - 3);
  // signature curve
  doc.setLineWidth(0.5);
  const pts: [number, number][] = [
    [x + 10, y + 1],
    [x + 14, y - 3],
    [x + 20, y + 2],
    [x + 26, y - 4],
    [x + 32, y + 1],
    [x + 38, y - 2],
    [x + 44, y + 3],
  ];
  for (let i = 0; i < pts.length - 1; i++) {
    doc.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
  }
  // underline flourish
  doc.setLineWidth(0.3);
  doc.line(x - 2, y + 5, x + 46, y + 7);
}

/**
 * Build the official CDAS attestation PDF as an ArrayBuffer.
 * Byte-deterministic (creation date + file id fixed) so its SHA-256 is stable.
 * If `certified` is provided, an official "CERTIFIÉ AUTHENTIQUE" stamp overlay
 * is added on top so verifiers can archive a certified copy.
 */
export async function buildAttestationPdf(
  data: AttestationData,
  certified?: CertifiedOverlay
): Promise<ArrayBuffer> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  (doc as any).setCreationDate?.(new Date(0));
  (doc as any).setFileId?.("CDAS0000000000000000000000000001");

  const pw = doc.internal.pageSize.getWidth();

  drawFrame(doc);

  // ============ Trilingual header ============
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  setColor(doc, "text", DARK);
  doc.text("REPUBLIQUE DU CAMEROUN", 30, 16);
  doc.text("REPUBLIC OF CAMEROON", pw - 30, 16, { align: "right" });

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  setColor(doc, "text", GREY);
  doc.text("Paix - Travail - Patrie", 30, 20);
  doc.text("Peace - Work - Fatherland", pw - 30, 20, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  setColor(doc, "text", DARK);
  doc.text("MINISTERE DE L'ENSEIGNEMENT SUPERIEUR", 30, 24);
  doc.text("MINISTRY OF HIGHER EDUCATION", pw - 30, 24, { align: "right" });
  doc.text("UNIVERSITE DE DOUALA", 30, 28);
  doc.text("THE UNIVERSITY OF DOUALA", pw - 30, 28, { align: "right" });

  // Logos
  drawUnivLogo(doc, 26, 42, 9);
  drawIutLogo(doc, pw - 18, 40);

  // Center institution block
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  setColor(doc, "text", BLUE);
  doc.text("INSTITUT UNIVERSITAIRE DE TECHNOLOGIE", pw / 2, 38, { align: "center" });
  doc.setFont("helvetica", "italic");
  setColor(doc, "text", GREY);
  doc.setFontSize(7);
  doc.text("THE UNIVERSITY INSTITUTE OF TECHNOLOGY", pw / 2, 42, { align: "center" });
  doc.setFont("helvetica", "normal");
  setColor(doc, "text", DARK);
  doc.setFontSize(7);
  doc.text("BP 8698 Douala-Cameroun    Tel/Fax: (237) 33 40 24 82    E-mail: infos.iut@univ-douala.com", pw / 2, 46, { align: "center" });

  // ============ Title ============
  setColor(doc, "text", BLUE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("ATTESTATION DE REUSSITE", pw / 2, 58, { align: "center" });
  doc.setFont("helvetica", "italic");
  doc.setFontSize(12);
  doc.text("ATTESTATION", pw / 2, 65, { align: "center" });

  // N° reference line
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  setColor(doc, "text", DARK);
  const sub = data.sub_reference ?? "IUT/DA/DFI/CD/DSI/SCI";
  const nLabel = "N°";
  const nValue = ` ${data.attestation_number} `;
  const nTail = `/${sub}`;
  const centerX = pw / 2;
  doc.text(nLabel, centerX - 30, 72);
  setColor(doc, "text", BLUE);
  doc.setFont("helvetica", "bold");
  doc.text(nValue, centerX - 22, 72);
  // underline under number
  const w = doc.getTextWidth(nValue);
  setColor(doc, "draw", BLUE);
  doc.setLineWidth(0.3);
  doc.line(centerX - 22, 72.7, centerX - 22 + w, 72.7);
  setColor(doc, "text", DARK);
  doc.setFont("helvetica", "normal");
  doc.text(nTail, centerX - 22 + w, 72);

  // ============ Intro ============
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  setColor(doc, "text", DARK);
  doc.text("Je soussigné(e), Directeur de l'Institut Universitaire de Technologie de l'Université de Douala, atteste que :", 15, 84);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  setColor(doc, "text", GREY);
  doc.text("I undersigned, the Director of the University Institute of Technology of the University of Douala, certify that:", 15, 89);

  // ============ Info rows ============
  let y = 100;
  const rowGap = 11;
  const labelX = 18;

  // Row: name + sex
  fieldPair(doc, {
    y, labelX,
    fr: "M. / Mlle :", en: "Mr. / Mrs :",
    value: data.holder_name.toUpperCase(),
    valueFont: "bold", valueSize: 12,
    rightLabelFr: "Sexe :", rightLabelEn: "Sex :",
    rightValue: (data.sexe ?? "—").toUpperCase(),
  });
  y += rowGap;

  fieldPair(doc, {
    y, labelX,
    fr: "Né(e) le :", en: "Born on the :",
    value: fmtDate(data.birth_date),
    rightLabelFr: "A :", rightLabelEn: "At :",
    rightValue: (data.birth_place ?? "—").toUpperCase(),
  });
  y += rowGap;

  fieldPair(doc, {
    y, labelX,
    fr: "Pour le compte de l'Année Académique :", en: "Academic Year :",
    value: data.year,
    rightLabelFr: "N° Matricule :", rightLabelEn: "Registration N° :",
    rightValue: data.matricule ?? "—",
  });
  y += rowGap;

  singleField(doc, {
    y, labelX,
    fr: "A obtenu(e) le Diplôme :", en: "Has obtained the Diploma :",
    value: data.diploma_type,
    valueFont: "bold", valueSize: 13, valueColor: DARK,
  });
  y += rowGap;

  singleField(doc, {
    y, labelX,
    fr: "Spécialité :", en: "Speciality :",
    value: (data.specialization ?? "—").toUpperCase(),
    valueFont: "bold", valueSize: 11,
  });
  y += rowGap;

  // Jury / Credits / Mention
  const colX = [18, 78, 138];
  triCol(doc, y, colX[0], "Jury de :", "Panel :", data.jury_session ?? "—");
  triCol(doc, y, colX[1], "Crédits :", "Credits :", data.credits != null ? String(data.credits) : "—");
  triCol(doc, y, colX[2], "Mention :", "Grade :",
    `${(data.mention ?? "—").toUpperCase()}${data.grade_letter ? "   " + data.grade_letter : ""}`,
    RED);
  y += rowGap + 2;

  // Closing
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  setColor(doc, "text", DARK);
  doc.text("En foi de quoi, la présente attestation lui est délivrée pour servir et valoir ce que de droit.", pw / 2, y + 4, { align: "center" });
  doc.setFontSize(8.5);
  setColor(doc, "text", GREY);
  doc.text("In witness whereof, this attestation is issued to serve the purpose for which it is intended.", pw / 2, y + 9, { align: "center" });

  // Date + signature block
  y += 22;
  const issued = new Date(data.issued_at);
  const dateStr = issued.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  setColor(doc, "text", DARK);
  doc.text(`Douala, le ${dateStr}`, pw - 20, y, { align: "right" });

  // Director title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Le Directeur", pw - 42, y + 8, { align: "center" });
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  setColor(doc, "text", GREY);
  doc.text("The Director", pw - 42, y + 13, { align: "center" });

  // Stamp overlaps the signature area (like the mockup)
  drawOfficialStamp(doc, pw - 62, y + 32);
  drawSignature(doc, pw - 55, y + 35);

  // Director printed name
  setColor(doc, "text", [30, 30, 90]);
  doc.setFont("times", "italic");
  doc.setFontSize(11);
  doc.text(data.director_name ?? "Pr. Jacques ETAME", pw - 42, y + 52, { align: "center" });

  // QR (bottom-left)
  const qrDataUrl = await generateQrDataUrl(data.qr_token, 220);
  doc.addImage(qrDataUrl, "PNG", 18, y + 18, 32, 32);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  setColor(doc, "text", DARK);
  doc.text("Scanner pour vérifier", 34, y + 53, { align: "center" });
  doc.setFontSize(6.5);
  setColor(doc, "text", GREY);
  doc.text(`Ref : ${data.reference}`, 34, y + 57, { align: "center" });

  // Footer trace
  setColor(doc, "text", [150, 150, 150]);
  doc.setFontSize(6);
  doc.text(
    `CDAS · Registre national · Empreinte ${(data.pdf_hash ?? "").slice(0, 24)}...`,
    pw / 2, 288, { align: "center" }
  );

  // ============ Certified overlay ============
  if (certified) {
    drawCertifiedOverlay(doc, certified);
  }

  return doc.output("arraybuffer");
}

function drawCertifiedOverlay(doc: jsPDF, c: CertifiedOverlay) {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();

  // Green diagonal stamp
  doc.saveGraphicsState?.();
  const cx = pw / 2;
  const cy = ph / 2 - 20;

  // Ring
  setColor(doc, "draw", [20, 120, 60]);
  doc.setLineWidth(1.4);
  doc.circle(cx, cy, 34, "S");
  doc.setLineWidth(0.6);
  doc.circle(cx, cy, 30, "S");
  setColor(doc, "text", [20, 120, 60]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("CDAS · CERTIFIED", cx, cy - 24, { align: "center" });
  doc.setFontSize(18);
  doc.text("CERTIFIÉ", cx, cy - 2, { align: "center" });
  doc.text("AUTHENTIQUE", cx, cy + 10, { align: "center" });
  doc.setFontSize(7);
  doc.text(new Date(c.verified_at).toLocaleDateString("fr-FR"), cx, cy + 22, { align: "center" });

  // Bottom banner with verifier info
  setColor(doc, "fill", [20, 120, 60]);
  doc.rect(10, ph - 30, pw - 20, 18, "F");
  setColor(doc, "text", [255, 255, 255]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("VÉRIFIÉ PAR LA PLATEFORME CDAS", pw / 2, ph - 22, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(
    `Vérificateur : ${c.verifier_name}${c.verifier_email ? " (" + c.verifier_email + ")" : ""}  ·  Transaction : ${c.transaction_id.slice(0, 8).toUpperCase()}  ·  Frais : ${c.amount.toLocaleString()} XAF`,
    pw / 2, ph - 17, { align: "center" }
  );
  doc.setFontSize(6.5);
  doc.text(`Empreinte PDF : ${c.pdf_hash.slice(0, 48)}...`, pw / 2, ph - 13, { align: "center" });
}

// ---------- layout helpers ----------

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getUTCFullYear()}`;
}

function fieldPair(doc: jsPDF, o: {
  y: number; labelX: number;
  fr: string; en: string; value: string;
  rightLabelFr: string; rightLabelEn: string; rightValue: string;
  valueFont?: "bold" | "normal"; valueSize?: number;
}) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  setColor(doc, "text", DARK);
  doc.text(o.fr, o.labelX, o.y);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  setColor(doc, "text", GREY);
  doc.text(o.en, o.labelX, o.y + 3.5);

  doc.setFont("helvetica", o.valueFont ?? "normal");
  doc.setFontSize(o.valueSize ?? 11);
  setColor(doc, "text", DARK);
  doc.text(o.value, o.labelX + 42, o.y + 1);

  // right column
  const rx = 140;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  setColor(doc, "text", DARK);
  doc.text(o.rightLabelFr, rx, o.y);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  setColor(doc, "text", GREY);
  doc.text(o.rightLabelEn, rx, o.y + 3.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  setColor(doc, "text", DARK);
  doc.text(o.rightValue, rx + 24, o.y + 1);
}

function singleField(doc: jsPDF, o: {
  y: number; labelX: number;
  fr: string; en: string; value: string;
  valueFont?: "bold" | "normal"; valueSize?: number; valueColor?: RGB;
}) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  setColor(doc, "text", DARK);
  doc.text(o.fr, o.labelX, o.y);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  setColor(doc, "text", GREY);
  doc.text(o.en, o.labelX, o.y + 3.5);
  doc.setFont("helvetica", o.valueFont ?? "normal");
  doc.setFontSize(o.valueSize ?? 11);
  setColor(doc, "text", o.valueColor ?? DARK);
  doc.text(o.value, o.labelX + 55, o.y + 1);
}

function triCol(doc: jsPDF, y: number, x: number, fr: string, en: string, value: string, color: RGB = DARK) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  setColor(doc, "text", DARK);
  doc.text(fr, x, y);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  setColor(doc, "text", GREY);
  doc.text(en, x, y + 3.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setColor(doc, "text", color);
  doc.text(value, x + 18, y + 1);
}

/** Trigger a browser download for a PDF ArrayBuffer. */
export function downloadPdf(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
