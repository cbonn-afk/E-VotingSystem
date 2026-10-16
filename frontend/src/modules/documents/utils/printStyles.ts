import type { DocumentSettings } from "../types";

const fontStacks: Record<DocumentSettings["fontFamily"], string> = {
  Inter: '"Inter", "Helvetica Neue", Arial, sans-serif',
  Arial: 'Arial, "Helvetica Neue", sans-serif',
  Georgia: 'Georgia, "Times New Roman", serif',
};

const paperMm: Record<DocumentSettings["paperSize"], [number, number]> = {
  A4: [210, 297],
  Letter: [216, 279],
  Legal: [216, 356],
};

export const isHexColor = (value: string) => /^#[0-9A-Fa-f]{6}$/.test(value);

export const getAccent = (s: DocumentSettings) =>
  isHexColor(s.accentColor) ? s.accentColor : "#B8892E";

export const getFontStack = (s: DocumentSettings) =>
  fontStacks[s.fontFamily] ?? fontStacks.Inter;

export const getPageSize = (s: DocumentSettings) =>
  `${s.paperSize} ${s.orientation}`;

export const getMargin = (s: DocumentSettings) =>
  `${Math.min(30, Math.max(6, s.marginMm))}mm`;

export const getPageLabel = (s: DocumentSettings) =>
  (s.footerPageNumberLabel || "Page").replace(/\s+\d+(\s+of\s+.*)?$/iu, "").trim() || "Page";

/** Paper width/height in mm after orientation. */
export const getPaperMm = (s: DocumentSettings) => {
  const [w, h] = paperMm[s.paperSize] ?? paperMm.A4;

  return s.orientation === "landscape" ? { width: h, height: w } : { width: w, height: h };
};

export const isCompact = (s: DocumentSettings) =>
  s.density === "compact" || s.template === "compact";

export const toCssString = (value: string) =>
  `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, " ")}"`;
