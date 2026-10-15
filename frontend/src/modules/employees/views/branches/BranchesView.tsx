"use client";

import { useMemo, useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { toast } from "react-toastify";

import CustomTable, {
  type CustomTableColumn,
} from "@components/app/CustomTable";
import { useAuthorization } from "@/modules/auth/hooks/useAuthorization";
import type {
  BranchEmployeeResource,
  BranchPayload,
  BranchResource,
} from "../../api/types";
import BranchFormDialog from "../../components/branches/BranchFormDialog";
import EmployeesPageHeader from "../../components/shared/EmployeesPageHeader";
import WorkflowStatusDialog from "../../components/shared/WorkflowStatusDialog";
import {
  CellBox,
  TableAvatar,
  renderStatusChip,
} from "../../components/shared/statusUtils";
import {
  useBranches,
  useCreateBranch,
  useDeleteBranch,
  useUpdateBranch,
} from "../../hooks/useEmployeesApi";

const BranchesView = () => {
  const authorization = useAuthorization();
  const branchesQuery = useBranches();
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const deleteBranch = useDeleteBranch();
  const branches = branchesQuery.data?.data ?? [];
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchResource | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<BranchResource | null>(null);
  const activeBranch =
    branches.find((branch) => branch.id === selectedBranchId) ?? branches[0];
  const canCreate = authorization.can("employees.records.create");
  const canUpdate = authorization.can("employees.records.update");
  const canDelete = authorization.can("employees.records.deactivate");
  const isSaving = createBranch.isPending || updateBranch.isPending;

  const columns = useMemo<CustomTableColumn<BranchEmployeeResource>[]>(
    () => [
      {
        id: "employeeNo",
        label: "Employee No.",
        minWidth: 160,
        flex: 0.9,
        render: (row) => (
          <CellBox>
            <Typography
              sx={{
                fontFamily: "monospace",
                fontSize: "0.82rem",
                fontWeight: 600,
              }}
            >
              {row.employeeNo}
            </Typography>
          </CellBox>
        ),
      },
      {
        id: "fullName",
        label: "Employee",
        minWidth: 240,
        flex: 1.4,
        render: (row) => (
          <CellBox>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <TableAvatar name={row.fullName} />
              <Typography variant="body2" fontWeight={600}>
                {row.fullName}
              </Typography>
            </Stack>
          </CellBox>
        ),
      },
      {
        id: "jobPosition",
        label: "Job Position",
        minWidth: 210,
        flex: 1.1,
        render: (row) => (
          <CellBox>
            <Typography variant="body2">
              {row.jobPosition ?? "Unassigned"}
            </Typography>
          </CellBox>
        ),
      },
      {
        id: "accessRoles",
        label: "Access Roles",
        minWidth: 240,
        flex: 1.3,
        render: (row) => (
          <CellBox>
            <Stack
              direction="row"
              useFlexGap
              flexWrap="wrap"
              gap={0.75}
              sx={{ py: 1 }}
            >
              {row.accessRoles.length > 0 ? (
                row.accessRoles.map((role) => (
                  <Chip
                    key={role}
                    size="small"
                    variant="tonal"
                    color="secondary"
                    label={role}
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.disabled">
                  No linked access role
                </Typography>
              )}
            </Stack>
          </CellBox>
        ),
      },
      {
        id: "status",
        label: "Status",
        align: "center",
        minWidth: 130,
        flex: 0.7,
        render: (row) => (
          <CellBox justify="center">{renderStatusChip(row.status)}</CellBox>
        ),
      },
    ],
    [],
  );

  const openCreate = () => {
    setEditingBranch(null);
    setFormOpen(true);
  };

  const openEdit = () => {
    if (!activeBranch) return;
    setEditingBranch(activeBranch);
    setFormOpen(true);
  };

  const saveBranch = (payload: BranchPayload) => {
    const mutation = editingBranch
      ? updateBranch.mutateAsync({ id: editingBranch.id, payload })
      : createBranch.mutateAsync(payload);

    mutation
      .then(({ data }) => {
        toast.success(editingBranch ? "Branch updated." : "Branch added.");
        setSelectedBranchId(data.id);
        setFormOpen(false);
        setEditingBranch(null);
      })
      .catch((error) =>
        toast.error(
          error instanceof Error ? error.message : "Branch could not be saved.",
        ),
      );
  };

  const removeBranch = () => {
    if (!deleteTarget) return;

    deleteBranch
      .mutateAsync(deleteTarget.id)
      .then(() => {
        toast.success("Branch deleted.");
        setDeleteTarget(null);
        setSelectedBranchId(null);
      })
      .catch((error) =>
        toast.error(
          error instanceof Error
            ? error.message
            : "Branch could not be deleted.",
        ),
      );
  };

  return (
    <Stack spacing={5}>
      <EmployeesPageHeader
        title="Branches"
        description="Manage operating locations and review employee assignments by branch."
      >
        {canCreate && (
          <Button
            variant="contained"
            startIcon={<i className="bx bx-plus" />}
            onClick={openCreate}
          >
            Add Branch
          </Button>
        )}
      </EmployeesPageHeader>

      {branchesQuery.isError && (
        <Alert severity="error">Branch assignments could not be loaded.</Alert>
      )}

      {branchesQuery.isPending ? (
        <Stack spacing={2}>
          <Skeleton variant="rounded" height={72} />
          <Skeleton variant="rounded" height={360} />
        </Stack>
      ) : (
        <Paper sx={{ overflow: "hidden" }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={2}
            sx={{ px: 5, pt: 4, pb: 2 }}
          >
            <Stack spacing={0.5}>
              <Typography variant="h5">Branch Directory</Typography>
              <Typography variant="body2" color="text.secondary">
                {branches.length} branch{branches.length === 1 ? "" : "es"} ·{" "}
                {branches.reduce(
                  (total, branch) => total + branch.employeesCount,
                  0,
                )}{" "}
                assignments
              </Typography>
            </Stack>

            {activeBranch && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  icon={<i className="bx bx-user" />}
                  variant="tonal"
                  color="primary"
                  label={`${activeBranch.employeesCount} employees`}
                />
                <Chip
                  size="small"
                  variant="tonal"
                  color={activeBranch.isActive ? "success" : "default"}
                  label={activeBranch.isActive ? "Active" : "Inactive"}
                />
                {canUpdate && (
                  <Tooltip title="Edit branch">
                    <IconButton color="primary" onClick={openEdit}>
                      <i className="bx bx-pencil" />
                    </IconButton>
                  </Tooltip>
                )}
                {canDelete && (
                  <Tooltip
                    title={
                      activeBranch.employeesCount > 0
                        ? "Reassign employees before deleting"
                        : "Delete branch"
                    }
                  >
                    <span>
                      <IconButton
                        color="error"
                        disabled={activeBranch.employeesCount > 0}
                        onClick={() => setDeleteTarget(activeBranch)}
                      >
                        <i className="bx bx-trash" />
                      </IconButton>
                    </span>
                  </Tooltip>
                )}
              </Stack>
            )}
          </Stack>

          <Box sx={{ px: 3, borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={activeBranch?.id ?? false}
              onChange={(_event, value: string) => setSelectedBranchId(value)}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
            >
              {branches.map((branch) => (
                <Tab
                  key={branch.id}
                  value={branch.id}
                  icon={<i className="bx bx-map-pin" />}
                  iconPosition="start"
                  label={`${branch.name} (${branch.employeesCount})`}
                />
              ))}
            </Tabs>
          </Box>

          <CustomTable
            rows={activeBranch?.employees ?? []}
            columns={columns}
            getRowId={(row) => row.id}
            getRowHeight={() => "auto"}
            emptyTitle={
              branches.length ? "No employees assigned" : "No branches yet"
            }
            emptyDescription={
              branches.length
                ? "Assign this branch from an employee's create or edit form."
                : "Add the first branch to begin organizing employees by location."
            }
            sx={{
              "& .MuiDataGrid-row": { minHeight: "68px !important" },
              "& .MuiDataGrid-cell": { py: 1.25 },
              "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 600 },
            }}
          />
        </Paper>
      )}

      <BranchFormDialog
        open={formOpen}
        branch={editingBranch}
        isSaving={isSaving}
        onClose={() => {
          if (isSaving) return;
          setFormOpen(false);
          setEditingBranch(null);
        }}
        onSubmit={saveBranch}
      />

      <WorkflowStatusDialog
        open={Boolean(deleteTarget)}
        title="Delete branch?"
        description={
          deleteTarget
            ? `${deleteTarget.name} will be permanently removed from branch options.`
            : ""
        }
        confirmLabel="Delete Branch"
        confirmColor="error"
        isSaving={deleteBranch.isPending}
        onClose={() => {
          if (!deleteBranch.isPending) setDeleteTarget(null);
        }}
        onConfirm={removeBranch}
      />
    </Stack>
  );
};

export default BranchesView;
