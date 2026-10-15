import type { GridColDef, GridValidRowModel } from "@mui/x-data-grid";

/**
 * Force every column (header + cells) in an accounting DataGrid to center
 * alignment, so all tables in the module share a centered layout.
 */
export const centerColumns = <T extends GridValidRowModel>(
  columns: GridColDef<T>[],
): GridColDef<T>[] =>
  columns.map((column) => ({
    ...column,
    align: "center",
    headerAlign: "center",
  }));

/**
 * sx fragment that centers all cells of a plain MUI <Table> (head + body).
 * Spread into a Table's sx prop.
 */
export const centeredTableSx = {
  "& .MuiTableCell-root": { textAlign: "center" },
} as const;

/**
 * Shared styling for the plain-MUI accounting statement tables (trial balance,
 * income statement, balance sheet). Money columns stay right-aligned with
 * tabular figures so digits line up, and head cells become quiet uppercase
 * labels for a cleaner financial-report look.
 */
export const statementTableSx = {
  "& .MuiTableCell-root": {
    borderColor: "divider",
    paddingBlock: "12px",
  },
  "& .MuiTableCell-head": {
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: "text.secondary",
    backgroundColor: "action.hover",
  },
  "& .MuiTableCell-alignRight": {
    fontVariantNumeric: "tabular-nums",
  },
} as const;

/** Section-header cell styling shared by the balance sheet & income statement. */
export const sectionHeaderSx = {
  fontWeight: 700,
  textTransform: "uppercase",
  fontSize: "0.75rem",
  letterSpacing: "0.5px",
  color: "text.secondary",
  backgroundColor: "action.hover",
} as const;

/** Subtotal row cell styling shared by every accounting statement table. */
export const subtotalCellSx = {
  fontWeight: 600,
  borderTop: 1,
  borderColor: "divider",
} as const;
