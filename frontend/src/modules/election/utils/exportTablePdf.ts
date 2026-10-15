type Options = {
  filename: string;
  title: string;
  subtitle?: string | null;
  head: string[];
  body: Array<Array<string | number>>;
  landscape?: boolean;
};

/** Needs: npm i jspdf jspdf-autotable. Loaded on demand. */
export const exportTablePdf = async ({
  filename,
  title,
  subtitle,
  head,
  body,
  landscape = false,
}: Options) => {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const doc = new jsPDF({ orientation: landscape ? "landscape" : "portrait" });
  const width = doc.internal.pageSize.getWidth();

  doc.setFontSize(14);
  doc.text(title, width / 2, 14, { align: "center" });

  if (subtitle) {
    doc.setFontSize(10);
    doc.text(subtitle, width / 2, 20, { align: "center" });
  }

  autoTable(doc, {
    startY: subtitle ? 26 : 20,
    theme: "striped",
    head: [head],
    body,
    styles: { fontSize: 8 },
  });

  doc.save(filename);
};
