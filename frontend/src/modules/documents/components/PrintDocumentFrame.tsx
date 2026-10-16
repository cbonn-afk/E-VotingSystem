"use client";

import type { ReactNode } from "react";

import Box from "@mui/material/Box";
import GlobalStyles from "@mui/material/GlobalStyles";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { useCurrentUser } from "@/modules/auth/hooks/useCurrentUser";

import { useDocumentSettings } from "../hooks/useDocumentSettings";
import type { DocumentSettings } from "../types";
import {
  getAccent,
  getFontStack,
  getMargin,
  getPageLabel,
  getPageSize,
  getPaperMm,
  isCompact,
  toCssString,
} from "../utils/printStyles";

export type PrintSignature = { label: string; note?: string };

type PrintDocumentFrameProps = {
  title: string;
  subtitle?: string;
  /** Extra header content under the subtitle (reference numbers, dates). */
  meta?: ReactNode;
  children: ReactNode;
  signatures?: PrintSignature[];
  /** Defaults to the signed-in user's name. */
  preparedBy?: string;
  /**
   * "sheet": a paper-sized page that is visible on screen (loan agreement, receipt).
   * "print-only": hidden on screen, only appears in the print dialog (reports).
   */
  mode?: "sheet" | "print-only";
  /** Settings preview: use these settings and do not touch the page's @page rules. */
  preview?: boolean;
  settings?: DocumentSettings;
};

const AREA = "document-print-area";

const todayLabel = () =>
  new Date().toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });

/**
 * The one print layout used by every printable in the system. It reads the
 * global document settings (Settings > Documents) so branding, paper, margins,
 * logo, watermark, footer and signature blocks are configured in one place.
 */
const PrintDocumentFrame = ({
  title,
  subtitle,
  meta,
  children,
  signatures,
  preparedBy,
  mode = "sheet",
  preview = false,
  settings: override,
}: PrintDocumentFrameProps) => {
  const stored = useDocumentSettings();
  const currentUser = useCurrentUser();
  const s = override ?? stored;

  const accent = getAccent(s);
  const font = getFontStack(s);
  const compact = isCompact(s);
  const paper = getPaperMm(s);
  const margin = getMargin(s);
  const executive = s.template === "executive";
  const showLogo = s.logoMode === "upload" && !!s.uploadedLogoUrl;
  const align = s.headerAlignment;
  const preparedByName = preparedBy ?? currentUser.data?.name;
  const hasSignatures = s.showSignatureBlocks && !!signatures?.length;

  const companyBlock = (
    <Stack
      direction={align === "center" ? "column" : "row"}
      spacing={compact ? 1.5 : 2}
      alignItems="center"
      sx={{ minWidth: 0 }}
    >
      {showLogo && (
        <Box
          component="img"
          src={s.uploadedLogoUrl ?? ""}
          alt={`${s.companyName} logo`}
          sx={{ blockSize: s.logoSize, inlineSize: "auto", maxInlineSize: s.logoSize * 3.2, objectFit: "contain" }}
        />
      )}
      <Stack spacing={0.25} sx={{ textAlign: align === "center" ? "center" : "left" }}>
        <Typography sx={{ fontWeight: 800, fontSize: executive ? "1.15rem" : "1rem", color: "#111827" }}>
          {s.companyName}
        </Typography>
        {s.companyAddress && (
          <Typography sx={{ fontSize: "0.72rem", color: "#4b5563" }}>{s.companyAddress}</Typography>
        )}
        {s.companyContact && (
          <Typography sx={{ fontSize: "0.72rem", color: "#4b5563" }}>{s.companyContact}</Typography>
        )}
        {s.companyTin && (
          <Typography sx={{ fontSize: "0.72rem", color: "#4b5563" }}>TIN: {s.companyTin}</Typography>
        )}
      </Stack>
    </Stack>
  );

  const titleBlock = (
    <Stack
      spacing={0.5}
      alignItems={align === "split" ? "flex-end" : align === "center" ? "center" : "flex-start"}
      sx={{ textAlign: align === "split" ? "right" : align === "center" ? "center" : "left" }}
    >
      <Typography
        sx={{
          fontWeight: 800,
          letterSpacing: executive ? "0.14em" : "0.04em",
          fontSize: executive ? "1.7rem" : "1.35rem",
          lineHeight: 1.1,
          textTransform: "uppercase",
          color: executive ? accent : "#111827",
        }}
      >
        {title}
      </Typography>
      {subtitle && <Typography sx={{ fontSize: "0.78rem", color: "#4b5563" }}>{subtitle}</Typography>}
      {meta}
    </Stack>
  );

  return (
    <>
      {!preview && (
        <GlobalStyles
          styles={{
            [`.${AREA}.document-print-only`]: { display: "none" },
            "@page": {
              size: getPageSize(s),
              margin,
              "@bottom-left": {
                content: toCssString(s.footerNote ?? ""),
                color: "#4b5563",
                fontFamily: font,
                fontSize: "8pt",
              },
              "@bottom-right": {
                content: `${toCssString(`${getPageLabel(s)} `)} counter(page) " of " counter(pages)`,
                color: "#4b5563",
                fontFamily: font,
                fontSize: "8.5pt",
                fontWeight: 700,
              },
            },
            "@media print": {
              "html, body": { backgroundColor: "#fff !important", overflow: "visible !important" },
              "body *": { visibility: "hidden" },
              [`.${AREA}, .${AREA} *`]: {
                visibility: "visible",
                printColorAdjust: "exact !important",
                WebkitPrintColorAdjust: "exact !important",
              },
              [`.${AREA}`]: {
                display: "block !important",
                position: "absolute !important",
                insetBlockStart: "0 !important",
                insetInlineStart: "0 !important",
                inlineSize: "100% !important",
                maxInlineSize: "none !important",
                minInlineSize: "0 !important",
                minBlockSize: "0 !important",
                margin: "0 !important",
                padding: "0 !important",
                boxShadow: "none !important",
                borderRadius: "0 !important",
                border: "0 !important",
              },
              ".no-print, .document-screen-footer, .report-screen-only": { display: "none !important" },
              [`.${AREA} tr`]: { breakInside: "avoid" },
              [`.${AREA} thead`]: { display: "table-header-group" },
              ".document-print-section, .report-print-section": { breakInside: "avoid", pageBreakInside: "avoid" },
            },
          }}
        />
      )}

      <Box
        className={`${AREA} ${mode === "print-only" && !preview ? "document-print-only" : ""}`}
        sx={{
          position: "relative",
          boxSizing: "border-box",
          mx: "auto",
          inlineSize: `${paper.width}mm`,
          maxInlineSize: "100%",
          minBlockSize: preview ? `${paper.height}mm` : undefined,
          p: `${Math.min(30, Math.max(6, s.marginMm))}mm`,
          pb: `calc(${margin} + 14mm)`,
          bgcolor: "#fff",
          color: "#111827",
          fontFamily: font,
          fontSize: compact ? "0.74rem" : "0.82rem",
          borderRadius: 1,
          border: s.borderStyle === "boxed" ? "1px solid #d1d5db" : "none",
          borderTop: s.borderStyle === "accent" ? `6px solid ${accent}` : undefined,
          boxShadow: "0 24px 70px rgba(15, 23, 42, 0.16)",
          overflow: "hidden",
          "& .MuiTypography-root": { color: "#111827", fontFamily: font },
          "& table": { borderCollapse: "collapse", inlineSize: "100%" },
          "& th, & td": {
            borderBottom: "1px solid #e5e7eb",
            fontSize: compact ? "0.7rem" : "0.76rem",
            py: compact ? "4px" : "7px",
            px: "8px",
            textAlign: "left",
          },
          "& th": {
            bgcolor: `${accent}22`,
            color: "#111827",
            fontWeight: 700,
            borderBottom: `2px solid ${accent}`,
          },
          "& tbody tr:nth-of-type(even)": s.tableStriped ? { bgcolor: "#f9fafb" } : {},
        }}
      >
        {s.watermark && (
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              pointerEvents: "none",
              zIndex: 0,
            }}
          >
            <Typography
              sx={{
                transform: "rotate(-30deg)",
                fontSize: "5.5rem",
                fontWeight: 900,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(17,24,39,0.07) !important",
                whiteSpace: "nowrap",
              }}
            >
              {s.watermark}
            </Typography>
          </Box>
        )}

        <Stack spacing={compact ? 2.5 : 4} sx={{ position: "relative", zIndex: 1 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: align === "split" ? "row" : "column",
              justifyContent: "space-between",
              alignItems: align === "split" ? "flex-start" : align === "center" ? "center" : "flex-start",
              gap: 2,
              pb: 2,
              borderBottom: s.borderStyle === "clean" ? "1px solid #e5e7eb" : "none",
            }}
          >
            {companyBlock}
            {titleBlock}
          </Box>

          <Box>{children}</Box>

          {s.showPreparedBy && preparedByName && (
            <Typography className="document-print-section" sx={{ fontSize: "0.72rem", color: "#4b5563" }}>
              Prepared by {preparedByName} · {todayLabel()}
            </Typography>
          )}

          {hasSignatures && (
            <Stack className="document-print-section" direction="row" spacing={6} sx={{ pt: 3 }}>
              {signatures!.map((signature) => (
                <Stack key={signature.label} spacing={0.5} sx={{ flex: 1 }}>
                  <Box sx={{ borderBottom: "1px solid #111827", height: 44 }} />
                  <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase" }}>
                    {signature.label}
                  </Typography>
                  {signature.note && (
                    <Typography sx={{ fontSize: "0.72rem", color: "#4b5563" }}>{signature.note}</Typography>
                  )}
                </Stack>
              ))}
            </Stack>
          )}
        </Stack>

        {/* On-screen footer. When printing, the @page margin boxes carry the note and page numbers. */}
        <Box
          className="document-screen-footer"
          sx={{
            position: "absolute",
            insetInline: `${Math.min(30, Math.max(6, s.marginMm))}mm`,
            insetBlockEnd: "8mm",
            pt: 1.5,
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <Typography sx={{ fontSize: "0.68rem", color: "#4b5563" }}>{s.footerNote}</Typography>
          <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, textTransform: "uppercase", color: "#4b5563" }}>
            {getPageLabel(s)} 1 of 1
          </Typography>
        </Box>
      </Box>
    </>
  );
};

export default PrintDocumentFrame;
