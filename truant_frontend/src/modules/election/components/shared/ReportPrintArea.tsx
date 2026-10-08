"use client";

import type { ReactNode } from "react";

import GlobalStyles from "@mui/material/GlobalStyles";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { formatDate } from "../../utils/accountingFormat";

type ReportPrintAreaProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

/**
 * Shared print-only document used by the accounting reports. On screen it is
 * hidden; when the browser print dialog runs, the surrounding screen content
 * (marked `report-screen-only`) is hidden and only this branded layout prints.
 *
 * Pair with `<Stack className="report-screen-only">` around the on-screen UI,
 * and wrap repeated blocks in `className="report-print-section"` to avoid awkward
 * page breaks.
 */
const ReportPrintArea = ({
  title,
  subtitle,
  children,
}: ReportPrintAreaProps) => (
  <>
    <GlobalStyles
      styles={{
        ".report-print-area": {
          display: "none",
        },
        "@media print": {
          "body *": {
            visibility: "hidden",
          },
          ".report-screen-only": {
            display: "none !important",
          },
          ".report-print-area": {
            display: "block !important",
            position: "absolute",
            inset: 0,
            inlineSize: "100%",
            padding: "24px",
            backgroundColor: "#fff",
            color: "#111827",
            visibility: "visible",
          },
          ".report-print-area *": {
            visibility: "visible",
          },
          ".report-print-section": {
            breakInside: "avoid",
            pageBreakInside: "avoid",
          },
          ".report-print-area table": {
            borderCollapse: "collapse",
            inlineSize: "100%",
          },
          ".report-print-area th, .report-print-area td": {
            borderBottom: "1px solid #d1d5db",
            fontSize: "11px",
            padding: "7px 8px",
          },
          ".report-print-area th": {
            backgroundColor: "#f3f4f6",
            color: "#111827",
            fontWeight: 700,
          },
        },
      }}
    />

    <Paper className="report-print-area" elevation={0}>
      <Stack spacing={5}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <Stack spacing={0.75}>
            <Typography variant="h4" sx={{ color: "#111827" }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" sx={{ color: "#4b5563" }}>
                {subtitle}
              </Typography>
            )}
          </Stack>

          <Stack spacing={0.75} alignItems="flex-end">
            <Typography variant="subtitle2" sx={{ color: "#111827" }}>
              TRUANT ERP
            </Typography>
            <Typography variant="caption" sx={{ color: "#4b5563" }}>
              Printed {formatDate(new Date().toISOString().slice(0, 10))}
            </Typography>
          </Stack>
        </Stack>

        {children}
      </Stack>
    </Paper>
  </>
);

export default ReportPrintArea;
