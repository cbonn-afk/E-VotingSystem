import type { ElectionResults } from "../api/types";

type AutoTableDoc = { lastAutoTable?: { finalY: number } };

/** Needs: npm i jspdf jspdf-autotable. Loaded on demand so it stays out of the main bundle. */
export const exportResultsPdf = async (results: ElectionResults) => {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF();
  const registered = results.turnout.registered;
  const percent = (value: number) =>
    registered > 0 ? `${((value / registered) * 100).toFixed(2)} %` : "0.00 %";
  const nextY = () =>
    ((doc as unknown as AutoTableDoc).lastAutoTable?.finalY ?? 24) + 8;

  doc.setFontSize(15);
  doc.text("ELECTION SUMMARY", 105, 14, { align: "center" });
  doc.setFontSize(10);
  doc.text(`${results.assembly.name} (${results.assembly.year})`, 105, 20, {
    align: "center",
  });

  autoTable(doc, {
    startY: 26,
    theme: "striped",
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
      theme: "striped",
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
      theme: "striped",
      head: [["Amendment proposals", "Agree", "Disagree", "Result"]],
      body: results.amendments.map((amendment, index) => [
        `${index + 1}.  ${amendment.title}`,
        String(amendment.agree),
        String(amendment.disagree),
        amendment.passed ? "Passed" : "Not passed",
      ]),
    });
  }

  doc.save(`election-results-${results.assembly.year}.pdf`);
};
