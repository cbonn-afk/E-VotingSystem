"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { DataGrid } from "@mui/x-data-grid";
import type {
  GridCallbackDetails,
  GridColDef,
  GridRowId,
  GridRowIdGetter,
  GridRowSelectionModel,
  GridSortModel,
  GridValidRowModel,
  DataGridProps,
} from "@mui/x-data-grid";

import type { SxProps } from "@mui/material/styles";

/**
 * Shared DataGrid wrapper used by most register-style ERP screens.
 *
 * Centralizing the defaults here keeps pagination, quick filtering, sizing,
 * and table spacing consistent across modules without every page rebuilding
 * the same DataGrid setup.
 */

export type CustomTableColumn<T> = {
  id: string;
  label: string;
  minWidth?: number;
  maxWidth?: number;
  width?: number;
  flex?: number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  render?: (row: T) => ReactNode;
  value?: (row: T) => string | number;
};

export type CustomTablePaginationModel = {
  page: number;
  pageSize: number;
};

export type CustomTableSortModel = {
  field: string;
  direction: "asc" | "desc";
};

type Props<T extends GridValidRowModel> = {
  rows: T[];
  columns: GridColDef<T>[] | CustomTableColumn<T>[];
  loading?: boolean;
  getRowId?: GridRowIdGetter<T>;
  emptyTitle?: string;
  emptyDescription?: string;

  // UI toggles
  checkBoxSelection?: boolean;
  checkboxSelection?: boolean;
  showToolbar?: boolean;
  disableColumnResize?: boolean;
  density?: DataGridProps<T>["density"];
  sx?: SxProps;

  // server mode support (optional)
  paginationMode?: DataGridProps<T>["paginationMode"];
  sortingMode?: DataGridProps<T>["sortingMode"];
  filterMode?: DataGridProps<T>["filterMode"];

  rowCount?: number;
  paginationModel?:
    | DataGridProps<T>["paginationModel"]
    | CustomTablePaginationModel;
  onPaginationModelChange?:
    | DataGridProps<T>["onPaginationModelChange"]
    | ((model: CustomTablePaginationModel) => void);
  isRowSelectable?: DataGridProps<T>["isRowSelectable"];
  getRowClassName?: DataGridProps<T>["getRowClassName"];
  getRowHeight?: DataGridProps<T>["getRowHeight"];
  getDetailPanelContent?: DataGridProps<T>["getDetailPanelContent"];
  getDetailPanelHeight?: (params: { row: T }) => number | string;
  rowSelectionModel?: DataGridProps<T>["rowSelectionModel"];
  onRowSelectionModelChange?: DataGridProps<T>["onRowSelectionModelChange"];
  selectedRowIds?: string[];
  onSelectedRowIdsChange?: (ids: string[]) => void;
  disableRowSelectionOnClick?: DataGridProps<T>["disableRowSelectionOnClick"];
  onRowClick?: DataGridProps<T>["onRowClick"];

  sortModel?: DataGridProps<T>["sortModel"] | CustomTableSortModel;
  onSortModelChange?:
    | DataGridProps<T>["onSortModelChange"]
    | ((model: CustomTableSortModel) => void);

  // advanced overrides (optional)
  slots?: Partial<DataGridProps<T>["slots"]>;
  slotProps?: DataGridProps<T>["slotProps"];
};

const isLegacyColumn = <T extends GridValidRowModel>(
  column: GridColDef<T> | CustomTableColumn<T>,
): column is CustomTableColumn<T> => "id" in column;

const isLegacySortModel = (
  model: Props<GridValidRowModel>["sortModel"],
): model is CustomTableSortModel => {
  return Boolean(model && !Array.isArray(model) && "direction" in model);
};

const hasValidGridRowId = (id: unknown): id is GridRowId =>
  (typeof id === "string" && id.length > 0) || typeof id === "number";

function CustomTable<T extends GridValidRowModel>({
  rows,
  columns,
  loading = false,
  getRowId,
  emptyTitle = "No records found",
  emptyDescription = "Try adjusting your search or filters.",

  // Client Toggles
  checkBoxSelection = false,
  checkboxSelection = false,
  showToolbar = false,
  disableColumnResize = false,
  density,

  // server props
  paginationMode,
  sortingMode,
  filterMode,
  rowCount,
  paginationModel,
  onPaginationModelChange,
  sortModel,
  onSortModelChange,
  isRowSelectable,
  getRowClassName,
  rowSelectionModel,
  onRowSelectionModelChange,
  selectedRowIds,
  onSelectedRowIdsChange,
  disableRowSelectionOnClick,
  onRowClick,

  // row props
  getRowHeight,
  getDetailPanelContent,
  getDetailPanelHeight,

  // Advanced
  slots,
  slotProps,
  sx,
}: Props<T>) {
  /**
   * MUI DataGrid has been noisy during hydration in local development for this
   * project. Waiting for mount keeps the shared wrapper stable for feature
   * pages until that upstream issue is cleaned up.
   */
  const [mounted, setMounted] = useState(false);

  const dataGridColumns = useMemo<GridColDef<T>[]>(
    () =>
      columns.map((column) => {
        if (!isLegacyColumn(column)) return column;

        return {
          field: column.id,
          headerName: column.label,
          minWidth: column.minWidth,
          maxWidth: column.maxWidth,
          width: column.width,
          flex: column.flex,
          align: column.align,
          headerAlign: column.align,
          sortable: Boolean(column.sortable),
          renderCell: column.render
            ? ({ row }) => column.render?.(row)
            : undefined,
          valueGetter: column.value
            ? (_value, row) => column.value?.(row)
            : undefined,
        } satisfies GridColDef<T>;
      }),
    [columns],
  );

  const safeRows = useMemo(() => {
    const seenIds = new Set<GridRowId>();

    return (Array.isArray(rows) ? rows : []).filter((row) => {
      if (!row || typeof row !== "object") return false;

      let id: unknown;

      try {
        id = getRowId ? getRowId(row) : (row as { id?: unknown }).id;
      } catch {
        return false;
      }

      if (!hasValidGridRowId(id) || seenIds.has(id)) return false;

      seenIds.add(id);

      return true;
    });
  }, [getRowId, rows]);

  const sortableFieldSet = useMemo(
    () => new Set(dataGridColumns.map((column) => column.field)),
    [dataGridColumns],
  );

  const dataGridSortModel = useMemo<GridSortModel | undefined>(() => {
    if (!sortModel) return undefined;
    if (!isLegacySortModel(sortModel)) {
      return (sortModel as GridSortModel).filter((item) =>
        sortableFieldSet.has(item.field),
      );
    }

    if (!sortableFieldSet.has(sortModel.field)) return [];

    return [{ field: sortModel.field, sort: sortModel.direction }];
  }, [sortModel, sortableFieldSet]);

  const dataGridRowSelectionModel = useMemo<
    GridRowSelectionModel | undefined
  >(() => {
    if (rowSelectionModel) return rowSelectionModel;
    if (!selectedRowIds) return undefined;

    return { type: "include", ids: new Set<GridRowId>(selectedRowIds) };
  }, [rowSelectionModel, selectedRowIds]);

  const NoRowsOverlay = () => (
    <Box
      className="flex flex-col items-center justify-center text-center"
      sx={{
        minBlockSize: 220,
        px: 2,
        py: 4,
        gap: 0.75,
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          display: "grid",
          placeItems: "center",
          borderRadius: 1,
          bgcolor: "action.hover",
          color: "text.secondary",
          mb: 0.5,
        }}
      >
        <i className="bx-bxs-inbox" style={{ fontSize: 26 }} />
      </Box>
      <Typography variant="subtitle1" fontWeight={700}>
        {emptyTitle}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ maxWidth: 420, textAlign: "center" }}
      >
        {emptyDescription}
      </Typography>
    </Box>
  );

  const handleSortModelChange = (
    model: GridSortModel,
    details: GridCallbackDetails,
  ) => {
    if (!onSortModelChange) return;

    if (isLegacySortModel(sortModel)) {
      const nextSort = model[0];

      (onSortModelChange as (model: CustomTableSortModel) => void)({
        field: nextSort?.field ?? sortModel.field,
        direction: nextSort?.sort === "desc" ? "desc" : "asc",
      });

      return;
    }

    (onSortModelChange as NonNullable<DataGridProps<T>["onSortModelChange"]>)(
      model,
      details,
    );
  };

  const handleRowSelectionModelChange = (
    model: GridRowSelectionModel,
    details: GridCallbackDetails,
  ) => {
    const ids = "ids" in model ? Array.from(model.ids).map(String) : [];

    onSelectedRowIdsChange?.(ids);
    onRowSelectionModelChange?.(model, details);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <DataGrid
      rows={safeRows}
      columns={dataGridColumns}
      getRowId={getRowId}
      checkboxSelection={checkBoxSelection || checkboxSelection}
      loading={loading}
      showToolbar={showToolbar}
      paginationMode={paginationMode}
      sortingMode={sortingMode}
      filterMode={filterMode}
      rowCount={rowCount}
      paginationModel={paginationModel as DataGridProps<T>["paginationModel"]}
      onPaginationModelChange={
        onPaginationModelChange as DataGridProps<T>["onPaginationModelChange"]
      }
      sortModel={dataGridSortModel}
      onSortModelChange={handleSortModelChange}
      isRowSelectable={isRowSelectable}
      getRowClassName={getRowClassName}
      rowSelectionModel={dataGridRowSelectionModel}
      onRowSelectionModelChange={handleRowSelectionModelChange}
      disableRowSelectionOnClick={disableRowSelectionOnClick}
      onRowClick={onRowClick}
      initialState={{
        pagination: { paginationModel: { pageSize: 30 } },
      }}
      getRowHeight={getRowHeight}
      getDetailPanelContent={getDetailPanelContent}
      disableColumnResize={disableColumnResize}
      density={density}
      pageSizeOptions={[5, 10, 20, 30, 50]}
      slots={{
        noRowsOverlay: NoRowsOverlay,
        ...slots,
      }}
      slotProps={{
        toolbar: {
          // Give every table the same quick-filter behavior unless a page
          // explicitly overrides it.
          showQuickFilter: true,
          quickFilterProps: { debounceMs: 500 },
        },
        ...slotProps,
      }}
      sx={{
        width: "100%",
        border: 0,
        backgroundColor: "transparent",
        minHeight: safeRows.length === 0 ? 360 : undefined,
        p: 5,
        "& .MuiDataGrid-overlayWrapper": {
          minHeight: safeRows.length === 0 ? 220 : undefined,
        },
        "& .MuiDataGrid-toolbarQuickFilter": {
          marginRight: "auto",
          order: -1,
        },
        ...sx,
      }}
    />
  );
}

export default CustomTable;
