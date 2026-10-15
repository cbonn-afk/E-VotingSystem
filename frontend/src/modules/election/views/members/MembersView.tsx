"use client";

import { useEffect, useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { toast } from "react-toastify";

import CustomDialog from "@components/app/CustomDialog";
import CustomTable, {
  type CustomTablePaginationModel,
} from "@components/app/CustomTable";
import CustomTextField from "@core/components/mui/TextField";
import { useAuthorization } from "@/modules/auth/hooks/useAuthorization";
import { useDebouncedValue } from "@/modules/users/hooks/useDebouncedValue";

import type { MemberResource } from "../../api/types";
import MemberFormDrawer from "../../components/members/MemberFormDrawer";
import MemberImportDialog from "../../components/members/MemberImportDialog";
import { getMemberColumns } from "../../components/members/memberColumns";
import ElectionPageHeader from "../../components/shared/ElectionPageHeader";
import {
  useMemberMutations,
  useMembers,
} from "../../hooks/useMembersApi";
import type { MemberFormValues } from "../../schemas/electionSchemas";
import { downloadExport } from "../../utils/downloadExport";
import { getElectionErrorMessage } from "../../utils/electionFormat";

export default function MembersView() {
  const authorization = useAuthorization();
  const canManage = authorization.can("election.members.manage");
  const [search, setSearch] = useState("");
  const [standing, setStanding] = useState("");
  const [pagination, setPagination] = useState<CustomTablePaginationModel>({
    page: 0,
    pageSize: 30,
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<MemberResource | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MemberResource | null>(null);
  const debouncedSearch = useDebouncedValue(search.trim(), 350);
  const query = useMembers({
    search: debouncedSearch || undefined,
    delinquent: standing === "" ? undefined : standing === "delinquent",
    page: pagination.page + 1,
    per_page: pagination.pageSize,
  });
  const mutations = useMemberMutations();
  const members = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;

  useEffect(() => {
    setPagination((current) =>
      current.page === 0 ? current : { ...current, page: 0 },
    );
  }, [debouncedSearch, standing]);

  const columns = useMemo(
    () =>
      getMemberColumns({
        canManage,
        onDelete: setDeleteTarget,
        onEdit: (member) => {
          setEditing(member);
          setDrawerOpen(true);
        },
      }),
    [canManage],
  );

  const save = async (values: MemberFormValues) => {
    const payload = {
      member_code: values.memberCode,
      name: values.name,
      birth_date: values.birthDate || null,
      address: values.address || null,
      is_delinquent: values.isDelinquent,
    };

    try {
      if (editing)
        await mutations.update.mutateAsync({ id: editing.id, payload });
      else await mutations.create.mutateAsync(payload);
      toast.success(editing ? "Member updated." : "Member created.");
      setDrawerOpen(false);
      setEditing(null);
    } catch (error) {
      toast.error(
        getElectionErrorMessage(error, "The member could not be saved."),
      );
    }
  };

  return (
    <Stack spacing={5}>
      <ElectionPageHeader
        title="Members"
        description="The master list of members. Registration and voting read from this list."
      >
        {(canManage || authorization.can("election.reports.export")) && (
          <Stack direction="row" spacing={2}>
            {authorization.can("election.reports.export") && (
              <Button
                variant="outlined"
                startIcon={<i className="bx bx-download" />}
                onClick={() => downloadExport("members")}
              >
                Export Excel
              </Button>
            )}
            {canManage && (
              <>
            <Button
              variant="outlined"
              startIcon={<i className="bx bx-upload" />}
              onClick={() => setImportOpen(true)}
            >
              Import Excel
            </Button>
            <Button
              variant="contained"
              startIcon={<i className="bx bx-plus" />}
              onClick={() => {
                setEditing(null);
                setDrawerOpen(true);
              }}
            >
              New Member
            </Button>
              </>
            )}
          </Stack>
        )}
      </ElectionPageHeader>

      <Paper sx={{ p: 3 }}>
        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "minmax(280px, 520px) minmax(160px, 220px) auto",
            },
            justifyContent: "flex-start",
            alignItems: "center",
          }}
        >
          <CustomTextField
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            size="small"
            label="Search members"
            placeholder="Name or member code"
          />
          <CustomTextField
            select
            value={standing}
            onChange={(event) => setStanding(event.target.value)}
            size="small"
            label="Standing"
          >
            <MenuItem value="">All members</MenuItem>
            <MenuItem value="good">Good standing</MenuItem>
            <MenuItem value="delinquent">Delinquent</MenuItem>
          </CustomTextField>
          <Button
            color="secondary"
            startIcon={<i className="bx bx-reset" />}
            onClick={() => {
              setSearch("");
              setStanding("");
            }}
          >
            Clear filters
          </Button>
        </Box>
      </Paper>

      {query.isError && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={() => void query.refetch()}>
              Retry
            </Button>
          }
        >
          {getElectionErrorMessage(query.error, "Members could not be loaded.")}
        </Alert>
      )}

      <Paper sx={{ inlineSize: "100%", minInlineSize: 0, overflow: "hidden" }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 4, py: 3, borderBottom: 1, borderColor: "divider" }}
        >
          <Typography variant="h6">Member Register</Typography>
          <Chip
            size="small"
            variant="tonal"
            color="primary"
            label={`${total} member${total === 1 ? "" : "s"}`}
          />
        </Stack>
        <CustomTable
          rows={members}
          columns={columns}
          getRowId={(row) => row.id}
          loading={query.isFetching}
          disableRowSelectionOnClick
          density="compact"
          paginationMode="server"
          rowCount={total}
          paginationModel={pagination}
          onPaginationModelChange={setPagination}
          emptyTitle={
            query.isError ? "Could not load members" : "No members found"
          }
          emptyDescription={
            query.isError
              ? "Retry or check your connection."
              : "Import an Excel file or add a member."
          }
          sx={{ minBlockSize: 520, p: 0 }}
        />
      </Paper>

      <MemberFormDrawer
        open={drawerOpen}
        member={editing}
        saving={mutations.create.isPending || mutations.update.isPending}
        onClose={() => {
          setDrawerOpen(false);
          setEditing(null);
        }}
        onSubmit={save}
      />
      <MemberImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
      />
      <CustomDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        closeAfterTransition
        title="Delete Member"
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
                    toast.success("Member deleted.");
                    setDeleteTarget(null);
                  })
                  .catch((error) =>
                    toast.error(getElectionErrorMessage(error)),
                  );
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <Typography sx={{ mt: 2 }}>
          A member who registered for an assembly cannot be deleted.
        </Typography>
      </CustomDialog>
    </Stack>
  );
}
