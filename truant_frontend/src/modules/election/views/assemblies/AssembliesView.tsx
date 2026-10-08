"use client";

import { useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { toast } from "react-toastify";

import CustomDialog from "@components/app/CustomDialog";
import CustomTable from "@components/app/CustomTable";
import { useAuthorization } from "@/modules/auth/hooks/useAuthorization";

import type { AssemblyResource, AssemblyStatus } from "../../api/types";
import AssemblyFormDrawer from "../../components/assemblies/AssemblyFormDrawer";
import AssemblyStatusDialog from "../../components/assemblies/AssemblyStatusDialog";
import { getAssemblyColumns } from "../../components/assemblies/assemblyColumns";
import ElectionPageHeader from "../../components/shared/ElectionPageHeader";
import {
  useAssemblies,
  useAssemblyMutations,
} from "../../hooks/useAssembliesApi";
import type { AssemblyFormValues } from "../../schemas/electionSchemas";
import { getElectionErrorMessage } from "../../utils/electionFormat";

export default function AssembliesView() {
  const authorization = useAuthorization();
  const canManage = authorization.can("election.assemblies.manage");
  const query = useAssemblies();
  const mutations = useAssemblyMutations();
  const assemblies = query.data?.data ?? [];
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<AssemblyResource | null>(null);
  const [statusTarget, setStatusTarget] = useState<AssemblyResource | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AssemblyResource | null>(null);

  const columns = useMemo(
    () =>
      getAssemblyColumns({
        canManage,
        onChangeStatus: setStatusTarget,
        onDelete: setDeleteTarget,
        onEdit: (assembly) => {
          setEditing(assembly);
          setDrawerOpen(true);
        },
      }),
    [canManage],
  );

  const save = async (values: AssemblyFormValues) => {
    try {
      if (editing)
        await mutations.update.mutateAsync({ id: editing.id, name: values.name });
      else
        await mutations.create.mutateAsync({
          year: Number(values.year),
          name: values.name,
        });
      toast.success(editing ? "Assembly updated." : "Assembly created.");
      setDrawerOpen(false);
      setEditing(null);
    } catch (error) {
      toast.error(
        getElectionErrorMessage(error, "The assembly could not be saved."),
      );
    }
  };

  const changeStatus = (status: AssemblyStatus) => {
    if (!statusTarget) return;
    void mutations.updateStatus
      .mutateAsync({ id: statusTarget.id, status })
      .then(() => {
        toast.success("Assembly status updated.");
        setStatusTarget(null);
      })
      .catch((error) => toast.error(getElectionErrorMessage(error)));
  };

  return (
    <Stack spacing={5}>
      <ElectionPageHeader
        title="Assemblies"
        description="One general assembly per year. Its status controls what the staff can do."
      >
        {canManage && (
          <Button
            variant="contained"
            startIcon={<i className="bx bx-plus" />}
            onClick={() => {
              setEditing(null);
              setDrawerOpen(true);
            }}
          >
            New Assembly
          </Button>
        )}
      </ElectionPageHeader>

      {query.isError && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={() => void query.refetch()}>
              Retry
            </Button>
          }
        >
          {getElectionErrorMessage(query.error, "Assemblies could not be loaded.")}
        </Alert>
      )}

      <Paper sx={{ overflow: "hidden" }}>
        <CustomTable
          rows={assemblies}
          columns={columns}
          getRowId={(row) => row.id}
          loading={query.isFetching}
          density="compact"
          disableRowSelectionOnClick
          emptyTitle="No assemblies yet"
          emptyDescription="Create this year's assembly to get started."
          sx={{ minBlockSize: 320, p: 0 }}
        />
      </Paper>

      <AssemblyFormDrawer
        open={drawerOpen}
        assembly={editing}
        saving={mutations.create.isPending || mutations.update.isPending}
        onClose={() => {
          setDrawerOpen(false);
          setEditing(null);
        }}
        onSubmit={save}
      />
      <AssemblyStatusDialog
        assembly={statusTarget}
        saving={mutations.updateStatus.isPending}
        onClose={() => setStatusTarget(null)}
        onConfirm={changeStatus}
      />
      <CustomDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        closeAfterTransition
        title="Delete Assembly"
        description={
          deleteTarget ? `Permanently remove ${deleteTarget.name}?` : undefined
        }
        actions={
          <>
            <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              color="error"
              variant="contained"
              disabled={mutations.remove.isPending}
              onClick={() => {
                if (!deleteTarget) return;
                void mutations.remove
                  .mutateAsync(deleteTarget.id)
                  .then(() => {
                    toast.success("Assembly deleted.");
                    setDeleteTarget(null);
                  })
                  .catch((error) => toast.error(getElectionErrorMessage(error)));
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <Typography sx={{ mt: 2 }}>
          Only an empty draft assembly can be deleted. This cannot be undone.
        </Typography>
      </CustomDialog>
    </Stack>
  );
}
