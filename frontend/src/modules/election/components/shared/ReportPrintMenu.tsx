"use client";

import { useState } from "react";

import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

import { useAuthorization } from "@/modules/auth/hooks/useAuthorization";

export type ReportExportFormat = "pdf" | "csv" | "xlsx";

const EXPORT_ITEMS: Record<
  ReportExportFormat,
  { label: string; icon: string }
> = {
  pdf: { label: "Download PDF", icon: "bx-file" },
  xlsx: { label: "Download Excel", icon: "bx-spreadsheet" },
  csv: { label: "Download CSV", icon: "bx-table" },
};

type ReportPrintMenuProps = {
  /** Triggers a browser print of the on-screen report (no export permission needed). */
  onPrint?: () => void;
  /** Streams a server-side export download in the chosen format. */
  onExport?: (format: ReportExportFormat) => void;
  /** Which export formats this report supports, in menu order. */
  exportFormats?: ReportExportFormat[];
  /** Disables the whole control (e.g. while the report has no data / is loading). */
  disabled?: boolean;
};

/**
 * Single "Print" dropdown shared by every accounting report. Groups the browser
 * print action and the permission-gated export formats into one button so the
 * report toolbars stay consistent across the module.
 */
const ReportPrintMenu = ({
  onPrint,
  onExport,
  exportFormats = ["pdf", "xlsx", "csv"],
  disabled = false,
}: ReportPrintMenuProps) => {
  const { isAuthorized } = useAuthorization();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const canExport =
    Boolean(onExport) &&
    exportFormats.length > 0 &&
    isAuthorized({ permission: "accounting.reports.export" });

  const closeMenu = () => setAnchorEl(null);

  const handlePrint = () => {
    closeMenu();
    onPrint?.();
  };

  const handleExport = (format: ReportExportFormat) => {
    closeMenu();
    onExport?.(format);
  };

  // Nothing to offer (no print action and no export permission) — render nothing
  // so the toolbar matches the Can-gated behaviour used elsewhere.
  if (!onPrint && !canExport) return null;

  return (
    <>
      <Button
        variant="outlined"
        color="secondary"
        startIcon={<i className="bx-printer" />}
        endIcon={<i className="bx-chevron-down" />}
        disabled={disabled}
        onClick={(event) => setAnchorEl(event.currentTarget)}
      >
        Print
      </Button>
      <Menu anchorEl={anchorEl} open={open} onClose={closeMenu}>
        {onPrint && (
          <MenuItem onClick={handlePrint}>
            <i className="bx-printer mie-2" />
            Print
          </MenuItem>
        )}
        {onPrint && canExport && <Divider />}
        {canExport &&
          exportFormats.map((format) => (
            <MenuItem key={format} onClick={() => handleExport(format)}>
              <i className={`${EXPORT_ITEMS[format].icon} mie-2`} />
              {EXPORT_ITEMS[format].label}
            </MenuItem>
          ))}
      </Menu>
    </>
  );
};

export default ReportPrintMenu;
