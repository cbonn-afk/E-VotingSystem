import { defaultDocumentSettings } from "@/modules/documents/defaults";
import type { DocumentSettings } from "@/modules/documents/types";
import {
  drawPdfFooter,
  drawPdfHeader,
  getPdfFormat,
  getPdfTableStyles,
} from "@/modules/documents/utils/pdfBranding";

import type { ElectionResults } from "../api/types";

type AutoTableDoc = { lastAutoTable?: { finalY: number } };

/** Needs: npm i jspdf jspdf-autotable. Loaded on demand so it stays out of the main bundle. */
export const exportResultsPdf = async (
  results: ElectionResults,
  settings: DocumentSettings = defaultDocumentSettings,
) => {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF(getPdfFormat(settings));
  const tableStyles = getPdfTableStyles(settings);
  const registered = results.turnout.registered;
  const percent = (value: number) =>
    registered > 0 ? `${((value / registered) * 100).toFixed(2)} %` : "0.00 %";
  const nextY = () =>
    ((doc as unknown as AutoTableDoc).lastAutoTable?.finalY ?? 24) + 8;

  const startY = drawPdfHeader(
    doc,
    settings,
    "Election Summary",
    `${results.assembly.name} (${results.assembly.year})`,
  );

  autoTable(doc, {
    startY,
    ...tableStyles,
    head: [["Turnout", "Count", "Of registered"]],
    body: [
      ["Registered members", String(registered), ""],
      [
        "Voted (candidates)",
        String(results.turnout.election_voters),
        percent(results.turnout.election_voters),
      ],
      [
        "Voted (amendments)",
        String(results.turnout.amendment_voters),
        percent(results.turnout.amendment_voters),
      ],
    ],
  });

  results.positions.forEach((position) => {
    autoTable(doc, {
      startY: nextY(),
      ...tableStyles,
      head: [
        [
          `${position.title} (${position.seats} seat${position.seats === 1 ? "" : "s"})`,
          "Votes",
          "Turn out",
          "Result",
        ],
      ],
      body: position.candidates.map((candidate, index) => [
        `${index + 1}.  ${candidate.name}`,
        String(candidate.votes),
        percent(candidate.votes),
        candidate.elected ? "Elected" : "",
      ]),
    });
  });

  if (results.amendments.length > 0) {
    autoTable(doc, {
      startY: nextY(),
      ...tableStyles,
      head: [["Amendment proposals", "Agree", "Disagree", "Result"]],
      body: results.amendments.map((amendment, index) => [
        `${index + 1}.  ${amendment.title}`,
        String(amendment.agree),
        String(amendment.disagree),
        amendment.passed ? "Passed" : "Not passed",
      ]),
    });
  }

  drawPdfFooter(doc, settings);
  doc.save(`election-results-${results.assembly.year}.pdf`);
};
