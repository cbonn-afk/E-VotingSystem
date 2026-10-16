import type { DocumentSettings } from "../types";
import { getAccent, getPageLabel } from "./printStyles";

/** Minimal jsPDF surface used here, so this file needs no jspdf import. */
type PdfDoc = {
  internal: { pageSize: { getWidth(): number; getHeight(): number } };
  getNumberOfPages(): number;
  setPage(page: number): void;
  setFontSize(size: number): void;
  setFont(name: string, style?: string): void;
  setTextColor(r: number, g: number, b: number): void;
  setDrawColor(r: number, g: number, b: number): void;
  setLineWidth(width: number): void;
  line(x1: number, y1: number, x2: number, y2: number): void;
  text(text: string, x: number, y: number, options?: { align?: "left" | "center" | "right" }): void;
};

const hexToRgb = (hex: string): [number, number, number] => {
  const value = parseInt(hex.slice(1), 16);

  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

export const getPdfFormat = (s: DocumentSettings) => ({
  format: s.paperSize.toLowerCase(),
  orientation: s.orientation,
});

export const getPdfTableStyles = (s: DocumentSettings) => ({
  theme: s.tableStriped ? ("striped" as const) : ("grid" as const),
  headStyles: { fillColor: hexToRgb(getAccent(s)), textColor: [255, 255, 255] as [number, number, number] },
  margin: { left: s.marginMm, right: s.marginMm, bottom: s.marginMm + 8 },
});

/**
 * Draws the organisation letterhead + document title and returns the Y where
 * the content should start. Mirrors PrintDocumentFrame so PDF exports and
 * browser prints share the same global branding.
 */
export const drawPdfHeader = (
  doc: PdfDoc,
  s: DocumentSettings,
  title: string,
  subtitle?: string | null,
): number => {
  const width = doc.internal.pageSize.getWidth();
  const [r, g, b] = hexToRgb(getAccent(s));
  let y = s.marginMm;

  doc.setTextColor(17, 24, 39);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(s.companyName, width / 2, y, { align: "center" });
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(75, 85, 99);

  [s.companyAddress, s.companyContact, s.companyTin ? `TIN: ${s.companyTin}` : null]
    .filter((line): line is string => !!line)
    .forEach((line) => {
      doc.text(line, width / 2, y, { align: "center" });
      y += 4;
    });

  doc.setDrawColor(r, g, b);
  doc.setLineWidth(0.8);
  doc.line(s.marginMm, y, width - s.marginMm, y);
  y += 7;

  doc.setTextColor(17, 24, 39);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title.toUpperCase(), width / 2, y, { align: "center" });
  y += 6;

  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(subtitle, width / 2, y, { align: "center" });
    y += 6;
  }

  return y + 2;
};

/** Adds the global footer note and "Page x of y" to every page. Call just before save(). */
export const drawPdfFooter = (doc: PdfDoc, s: DocumentSettings) => {
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const pages = doc.getNumberOfPages();

  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(75, 85, 99);

    if (s.footerNote) {
      doc.text(s.footerNote, s.marginMm, height - s.marginMm + 4);
    }

    doc.text(`${getPageLabel(s)} ${page} of ${pages}`, width - s.marginMm, height - s.marginMm + 4, {
      align: "right",
    });
  }
};
