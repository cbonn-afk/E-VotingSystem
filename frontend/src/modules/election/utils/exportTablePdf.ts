import { defaultDocumentSettings } from "@/modules/documents/defaults";
import type { DocumentSettings } from "@/modules/documents/types";
import {
  drawPdfFooter,
  drawPdfHeader,
  getPdfFormat,
  getPdfTableStyles,
} from "@/modules/documents/utils/pdfBranding";

type Options = {
  filename: string;
  title: string;
  subtitle?: string | null;
  head: string[];
  body: Array<Array<string | number>>;
  landscape?: boolean;
  /** Global document settings (Settings > Documents). Falls back to the defaults. */
  settings?: DocumentSettings;
};

/** Needs: npm i jspdf jspdf-autotable. Loaded on demand. */
export const exportTablePdf = async ({
  filename,
  title,
  subtitle,
  head,
  body,
  landscape = false,
  settings = defaultDocumentSettings,
}: Options) => {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const doc = new jsPDF({
    ...getPdfFormat(settings),
    // The export decides landscape for wide tables; otherwise follow the global setting.
    orientation: landscape ? "landscape" : settings.orientation,
  });
  const startY = drawPdfHeader(doc, settings, title, subtitle);

  autoTable(doc, {
    startY,
    ...getPdfTableStyles(settings),
    head: [head],
    body,
    styles: { fontSize: 8 },
  });

  drawPdfFooter(doc, settings);
  doc.save(filename);
};
