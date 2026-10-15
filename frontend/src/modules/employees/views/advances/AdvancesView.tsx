"use client";

import { useMemo, useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { toast } from "react-toastify";

import CustomTable, {
  type CustomTableColumn,
  type CustomTablePaginationModel,
} from "@components/app/CustomTable";
import Can from "@/modules/auth/components/Can";
import { useAuthorization } from "@/modules/auth/hooks/useAuthorization";
import { useDebouncedValue } from "@/modules/users/hooks/useDebouncedValue";
import type {
  AdvancePayload,
  AdvanceResource,
  AdvanceStatus,
} from "../../api/types";
import AdvanceDecisionDialog, {
  type AdvanceDecisionValues,
} from "../../components/advances/AdvanceDecisionDialog";
import AdvanceFormDrawer from "../../components/advances/AdvanceFormDrawer";
import EmployeesPageHeader from "../../components/shared/EmployeesPageHeader";
import WorkflowStatusDialog from "../../components/shared/WorkflowStatusDialog";
import {
  CellBox,
  TableAvatar,
  formatCurrency,
  renderStatusChip,
} from "../../components/shared/statusUtils";
import {
  useAdvances,
  useCreateAdvance,
  useDeleteAdvance,
  useEmployees,
  useUpdateAdvance,
  useUpdateAdvanceStatus,
} from "../../hooks/useEmployeesApi";

type AdvanceDecision = {
  row: AdvanceResource;
  status: Extract<AdvanceStatus, "Approved" | "Rejected" | "Cancelled">;
};

const AdvancesView = () => {
  const authorization = useAuthorization();
  const [query, setQuery] = useState("");
  const [paginationModel, setPaginationModel] =
    useState<CustomTablePaginationModel>({ page: 0, pageSize: 30 });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<AdvanceResource | null>(null);
  const [decision, setDecision] = useState<AdvanceDecision | null>(null);
  const [paidTarget, setPaidTarget] = useState<AdvanceResource | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdvanceResource | null>(
    null,
  );

  const debouncedSearch = useDebouncedValue(query.trim(), 350);
  const advancesQuery = useAdvances({ search: debouncedSearch, per_page: 100 });
  const employeesQuery = useEmployees({ per_page: 100 });
  const createAdvance = useCreateAdvance();
  const updateAdvance = useUpdateAdvance();
  const updateStatus = useUpdateAdvanceStatus();
  const deleteAdvance = useDeleteAdvance();
  const canRequest = authorization.can("employees.advances.request");
  const canApprove = authorization.can("employees.advances.approve");
  const isSaving =
    createAdvance.isPending ||
    updateAdvance.isPending ||
    updateStatus.isPending ||
    deleteAdvance.isPending;

  const rows = advancesQuery.data?.data ?? [];

  const saveAdvance = (payload: AdvancePayload) => {
    const mutation = editing
      ? updateAdvance.mutateAsync({
          id: editing.id,
          payload: {
            reason: payload.reason,
          },
        })
      : createAdvance.mutateAsync(payload);

    mutation
      .then(() => {
        toast.success(editing ? "Advance updated." : "Advance requested.");
        setDrawerOpen(false);
        setEditing(null);
      })
      .catch((error) =>
        toast.error(
          error instanceof Error
            ? error.message
            : "Advance could not be saved.",
        ),
      );
  };

  const confirmDecision = (values: AdvanceDecisionValues) => {
    if (!decision) return;

    updateStatus
      .mutateAsync({
        id: decision.row.id,
        payload: {
          status: decision.status,
          ...(decision.status === "Approved"
            ? { approved_amount: values.approvedAmount }
            : {}),
          resolution_notes: values.resolutionNotes,
        },
      })
      .then(() => {
        toast.success(`Advance ${decision.status.toLowerCase()}.`);
        setDecision(null);
      })
      .catch((error) =>
        toast.error(
          error instanceof Error
            ? error.message
            : "Advance status could not be updated.",
        ),
      );
  };

  const markPaid = () => {
    if (!paidTarget) return;

    updateStatus
      .mutateAsync({
        id: paidTarget.id,
        payload: { status: "Paid" },
      })
      .then(() => {
        toast.success("Advance marked paid.");
        setPaidTarget(null);
      })
      .catch((error) =>
        toast.error(
          error instanceof Error
            ? error.message
            : "Advance status could not be updated.",
        ),
      );
  };

  const removeAdvance = () => {
    if (!deleteTarget) return;

    deleteAdvance
      .mutateAsync(deleteTarget.id)
      .then(() => {
        toast.success("Advance deleted.");
        setDeleteTarget(null);
      })
      .catch((error) =>
        toast.error(
          error instanceof Error
            ? error.message
            : "Advance could not be deleted.",
        ),
      );
  };

  const columns = useMemo<CustomTableColumn<AdvanceResource>[]>(
    () => [
      {
        id: "employeeName",
        label: "Employee",
        minWidth: 210,
        flex: 1.3,
        render: (row) => {
          const name = row.employee?.fullName ?? row.employeeName ?? "—";

          return (
            <CellBox>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <TableAvatar name={name} color="warning" />
                <Typography variant="body2" fontWeight={600}>
                  {name}
                </Typography>
              </Stack>
            </CellBox>
          );
        },
      },
      {
        id: "amount",
        label: "Requested Amount",
        align: "right",
        minWidth: 160,
        flex: 0.9,
        render: (row) => (
          <CellBox justify="flex-end">
            <Typography fontWeight={700} color="warning.main">
              {formatCurrency(row.amount)}
            </Typography>
          </CellBox>
        ),
      },
      {
        id: "approvedAmount",
        label: "Approved Amount",
        align: "right",
        minWidth: 160,
        flex: 0.9,
        render: (row) => (
          <CellBox justify="flex-end">
            <Typography
              fontWeight={row.approvedAmount == null ? 400 : 700}
              color={
                row.approvedAmount == null ? "text.secondary" : "success.main"
              }
            >
              {row.approvedAmount == null
                ? "—"
                : formatCurrency(row.approvedAmount)}
            </Typography>
          </CellBox>
        ),
      },
      {
        id: "reason",
        label: "Request Reason",
        minWidth: 220,
        flex: 1.4,
        render: (row) => (
          <CellBox>
            <Typography variant="body2" color="text.secondary" noWrap>
              {row.reason || "—"}
            </Typography>
          </CellBox>
        ),
      },
      {
        id: "resolutionNotes",
        label: "Decision Reason",
        minWidth: 220,
        flex: 1.4,
        render: (row) => (
          <CellBox>
            <Typography variant="body2" color="text.secondary" noWrap>
              {row.resolutionNotes || "—"}
            </Typography>
          </CellBox>
        ),
      },
      {
        id: "requestedAt",
        label: "Requested",
        minWidth: 140,
        flex: 0.9,
        render: (row) => (
          <CellBox>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box
                component="i"
                className="bx bx-calendar"
                sx={{ color: "text.secondary", fontSize: "1.05rem" }}
              />
              <Typography variant="body2">{row.requestedAt || "—"}</Typography>
            </Stack>
          </CellBox>
        ),
      },
      {
        id: "paymentDate",
        label: "Payment",
        minWidth: 140,
        flex: 0.9,
        render: (row) => (
          <CellBox>
            <Typography variant="body2" color="text.secondary">
              {row.paymentDate || "—"}
            </Typography>
          </CellBox>
        ),
      },
      {
        id: "status",
        label: "Status",
        align: "center",
        minWidth: 130,
        flex: 0.8,
        render: (row) => (
          <CellBox justify="center">{renderStatusChip(row.status)}</CellBox>
        ),
      },
      {
        id: "actions",
        label: "Actions",
        minWidth: 200,
        flex: 1,
        align: "right",
        render: (row) => (
          <CellBox justify="flex-end">
            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
              {canRequest && (
                <Tooltip title="Edit advance">
                  <IconButton
                    size="small"
                    disabled={row.status !== "Pending" || isSaving}
                    onClick={() => {
                      setEditing(row);
                      setDrawerOpen(true);
                    }}
                  >
                    <i className="bx bx-pencil" />
                  </IconButton>
                </Tooltip>
              )}
              {canApprove && (
                <>
                  <Tooltip title="Approve">
                    <span>
                      <IconButton
                        size="small"
                        color="success"
                        disabled={row.status !== "Pending" || isSaving}
                        onClick={() => setDecision({ row, status: "Approved" })}
                      >
                        <i className="bx bx-check" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Reject">
                    <span>
                      <IconButton
                        size="small"
                        color="error"
                        disabled={
                          !["Pending", "Approved", "Paid"].includes(
                            row.status,
                          ) || isSaving
                        }
                        onClick={() => setDecision({ row, status: "Rejected" })}
                      >
                        <i className="bx bx-x" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Cancel">
                    <span>
                      <IconButton
                        size="small"
                        color="warning"
                        disabled={
                          !["Pending", "Approved", "Paid"].includes(
                            row.status,
                          ) || isSaving
                        }
                        onClick={() =>
                          setDecision({ row, status: "Cancelled" })
                        }
                      >
                        <i className="bx bx-block" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Mark paid">
                    <span>
                      <IconButton
                        size="small"
                        color="primary"
                        disabled={row.status !== "Approved" || isSaving}
                        onClick={() => setPaidTarget(row)}
                      >
                        <i className="bx bx-money" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </>
              )}
              {canRequest && (
                <Tooltip title="Delete">
                  <span>
                    <IconButton
                      size="small"
                      color="error"
                      disabled={row.status !== "Pending" || isSaving}
                      onClick={() => setDeleteTarget(row)}
                    >
                      <i className="bx bx-trash" />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
            </Stack>
          </CellBox>
        ),
      },
    ],
    [canApprove, canRequest, isSaving],
  );

  return (
    <Stack spacing={5}>
      <EmployeesPageHeader
        title="Advances"
        description="Cash advance requests and repayment notes."
      >
        <Can permission="employees.advances.request">
          <Button
            variant="contained"
            startIcon={<i className="bx bx-plus" />}
            onClick={() => {
              setEditing(null);
              setDrawerOpen(true);
            }}
          >
            Request Advance
          </Button>
        </Can>
      </EmployeesPageHeader>

      {advancesQuery.isError && (
        <Alert severity="error">Advances could not be loaded.</Alert>
      )}

      <Paper sx={{ overflow: "hidden" }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
          className="p-5 pb-0"
        >
          <Stack spacing={0.5}>
            <Typography variant="h5">Advance Requests</Typography>
            <Typography variant="body2" color="text.secondary">
              {rows.length} request{rows.length === 1 ? "" : "s"} shown.
            </Typography>
          </Stack>
          <TextField
            size="small"
            placeholder="Search advances..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <i className="bx bx-search" />
                </InputAdornment>
              ),
            }}
            sx={{ width: { xs: "100%", md: 300 } }}
          />
        </Stack>
        <CustomTable
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          loading={advancesQuery.isPending}
          emptyTitle="No advance requests"
          emptyDescription="Cash advance requests will appear here."
          getRowHeight={() => 64}
          sx={{
            "& .MuiDataGrid-row:hover": { backgroundColor: "action.hover" },
            "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
              outline: "none",
            },
            "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 600 },
          }}
        />
      </Paper>

      <AdvanceFormDrawer
        open={drawerOpen}
        advance={editing}
        employees={employeesQuery.data?.data ?? []}
        isSaving={isSaving}
        onClose={() => {
          if (isSaving) return;
          setDrawerOpen(false);
          setEditing(null);
        }}
        onSubmit={saveAdvance}
      />

      <AdvanceDecisionDialog
        open={Boolean(decision)}
        advance={decision?.row ?? null}
        status={decision?.status ?? null}
        isSaving={updateStatus.isPending}
        onClose={() => {
          if (!updateStatus.isPending) setDecision(null);
        }}
        onConfirm={confirmDecision}
      />

      <WorkflowStatusDialog
        open={Boolean(paidTarget)}
        title="Mark advance paid?"
        description={
          paidTarget
            ? `${paidTarget.employee?.fullName ?? paidTarget.employeeName ?? "This employee"}'s approved advance will be marked paid.`
            : ""
        }
        confirmLabel="Mark Paid"
        confirmColor="primary"
        isSaving={updateStatus.isPending}
        onClose={() => {
          if (!updateStatus.isPending) setPaidTarget(null);
        }}
        onConfirm={markPaid}
      />

      <WorkflowStatusDialog
        open={Boolean(deleteTarget)}
        title="Delete advance?"
        description={
          deleteTarget
            ? `${deleteTarget.employee?.fullName ?? deleteTarget.employeeName ?? "This employee"}'s pending advance request will be removed.`
            : ""
        }
        confirmLabel="Delete"
        confirmColor="error"
        isSaving={deleteAdvance.isPending}
        onClose={() => {
          if (!deleteAdvance.isPending) setDeleteTarget(null);
        }}
        onConfirm={removeAdvance}
      />
    </Stack>
  );
};

export default AdvancesView;
