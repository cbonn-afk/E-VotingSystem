"use client";

import type { ReactNode } from "react";

import PrintDocumentFrame from "@/modules/documents/components/PrintDocumentFrame";

type ReportPrintAreaProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

/**
 * Print-only wrapper for the accounting/election reports. It is hidden on
 * screen; when the browser print dialog runs, the screen content (marked
 * `report-screen-only`) is hidden and only the shared, globally configured
 * document layout prints (Settings > Documents).
 *
 * Wrap repeated blocks in `className="report-print-section"` to avoid awkward
 * page breaks.
 */
const ReportPrintArea = ({ title, subtitle, children }: ReportPrintAreaProps) => (
  <PrintDocumentFrame mode="print-only" title={title} subtitle={subtitle}>
    {children}
  </PrintDocumentFrame>
);

export default ReportPrintArea;
