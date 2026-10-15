"use client";

import { useEffect, useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { toast } from "react-toastify";

import CustomDialog from "@components/app/CustomDialog";
import CustomTable, {
  type CustomTableColumn,
  type CustomTablePaginationModel,
} from "@components/app/CustomTable";
import CustomTextField from "@core/components/mui/TextField";
import { useAuthorization } from "@/modules/auth/hooks/useAuthorization";
import { useDebouncedValue } from "@/modules/users/hooks/useDebouncedValue";

import { electionApi } from "../../api/electionApi";
import type { MemberResource, RegistrationResource } from "../../api/types";
import ElectionPageHeader from "../../components/shared/ElectionPageHeader";
import ElectionStatusChip from "../../components/shared/ElectionStatusChip";
import MemberCodeDialog from "../../components/shared/MemberCodeDialog";
import MemberInfoDialog from "../../components/shared/MemberInfoDialog";
import { useCurrentAssembly } from "../../hooks/useAssembliesApi";
import { useElectionSettings } from "../../hooks/useElectionSettingsApi";
import {
  useRegistrationMutations,
  useRegistrations,
} from "../../hooks/useRegistrationApi";
import { downloadExport } from "../../utils/downloadExport";
import {
  formatDate,
  formatDateTime,
  getElectionErrorMessage,
} from "../../utils/electionFormat";
import { exportTablePdf } from "../../utils/exportTablePdf";
import { fetchAllPages } from "../../utils/fetchAllPages";

const YesNo = ({ yes, goodWhenYes }: { yes: boolean; goodWhenYes: boolean }) => (
  <Chip
    size="small"
    variant="tonal"
    color={yes === goodWhenYes ? "success" : "warning"}
    label={yes ? "Yes" : "No"}
  />
);

export default function RegistrationView() {
  const authorization = useAuthorization();
  const canManage = authorization.can("election.registration.manage");
  const canExport = authorization.can("election.reports.export");
  const assembly = useCurrentAssembly().data?.data;
  const settings = useElectionSettings().data?.data;
  const open = Boolean(assembly?.status && ["registration", "voting"].includes(assembly.status));
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<CustomTablePaginationModel>({
    page: 0,
    pageSize: 30,
  });
  const debouncedSearch = useDebouncedValue(search.trim(), 350);
  const query = useRegistrations({
    search: debouncedSearch || undefined,
    page: pagination.page + 1,
    per_page: pagination.pageSize,
  });
  const mutations = useRegistrationMutations();
  const rows = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;

  const [codeOpen, setCodeOpen] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [pending, setPending] = useState<MemberResource | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RegistrationResource | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setPagination((current) =>
      current.page === 0 ? current : { ...current, page: 0 },
    );
  }, [debouncedSearch]);

  const register = async (code: string) => {
    try {
      await mutations.create.mutateAsync(code);
      toast.success("Successfully registered.");
    } catch (error) {
      toast.error(getElectionErrorMessage(error));
    } finally {
      setPending(null);
      setCodeOpen(true); // ready for the next member
    }
  };

  const submitCode = async (code: string) => {
    setCodeError(null);

    try {
      const { data } = await mutations.lookup.mutateAsync(code);

      if (data.registered) {
        setCodeError("This member has already registered for the general assembly.");

        return;
      }

      if (settings?.registration_show_member_info ?? true) {
        setCodeOpen(false);
        setPending(data.member);
      } else {
        await register(data.member.member_code);
      }
    } catch (error) {
      setCodeError(getElectionErrorMessage(error));
    }
  };

  const columns = useMemo<CustomTableColumn<RegistrationResource>[]>(
    () => [
      {
        id: "code",
        label: "Member Code",
        width: 140,
        render: (row) => <Typography fontWeight={600}>{row.member?.member_code}</Typography>,
      },
      {
        id: "name",
        label: "Name",
        minWidth: 200,
        flex: 1.2,
        render: (row) => row.member?.name ?? "—",
      },
      {
        id: "address",
        label: "Address",
        minWidth: 180,
        flex: 1,
        render: (row) => row.member?.address || "—",
      },
      {
        id: "birth",
        label: "Birth Date",
        width: 120,
        render: (row) => formatDate(row.member?.birth_date),
      },
      {
        id: "voted",
        label: "Voted",
        width: 90,
        render: (row) => (
          <YesNo yes={Boolean(row.election_voted_at)} goodWhenYes />
        ),
      },
      {
        id: "delinquent",
        label: "Delinquent",
        width: 110,
        render: (row) => (
          <YesNo yes={Boolean(row.member?.is_delinquent)} goodWhenYes={false} />
        ),
      },
      {
        id: "timeIn",
        label: "Time In",
        width: 170,
        render: (row) => formatDateTime(row.registered_at),
      },
      ...(canManage
        ? [
            {
              id: "actions",
              label: "Actions",
              width: 90,
              align: "right" as const,
              render: (row: RegistrationResource) =>
                !row.election_voted_at && !row.amendments_voted_at ? (
                  <Tooltip title="Remove registration">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteTarget(row)}
                    >
                      <i className="bx bx-trash" />
                    </IconButton>
                  </Tooltip>
                ) : null,
            },
          ]
        : []),
    ],
    [canManage],
  );

  const exportPdf = async () => {
    setExporting(true);

    try {
      const all = await fetchAllPages((page) =>
        electionApi.registrations.list({ page, per_page: 100 }),
      );

      await exportTablePdf({
        filename: `attendance-${assembly?.year ?? ""}.pdf`,
        title: `${settings?.document_title ?? ""} General Assembly Attendance Sheet`.trim(),
        subtitle: settings?.document_sub_title,
        landscape: true,
        head: ["#", "Member Code", "Name", "Address", "Birth Date", "Voted", "Delinquent", "Time In"],
        body: all.map((row, index) => [
          index + 1,
          row.member?.member_code ?? "",
          row.member?.name ?? "",
          row.member?.address ?? "",
          formatDate(row.member?.birth_date),
          row.election_voted_at ? "Yes" : "No",
          row.member?.is_delinquent ? "Yes" : "No",
          formatDateTime(row.registered_at),
        ]),
      });
    } catch (error) {
      toast.error(getElectionErrorMessage(error, "The PDF could not be created."));
    } finally {
      setExporting(false);
    }
  };

  return (
    <Stack spacing={5}>
      <ElectionPageHeader
        title="General Assembly Registration"
        description={
          assembly
            ? `${assembly.name} · members sign in here to attend.`
            : "Members sign in here to attend."
        }
      >
        <Stack direction="row" spacing={2} flexWrap="wrap">
          {canExport && (
            <>
              <Button
                variant="outlined"
                disabled={exporting}
                startIcon={<i className="bx bx-file" />}
                onClick={() => void exportPdf()}
              >
                {exporting ? "Preparing…" : "GA Summary (PDF)"}
              </Button>
              <Button
                variant="outlined"
                startIcon={<i className="bx bx-download" />}
                onClick={() => downloadExport("attendance")}
              >
                GA Summary (XLSX)
              </Button>
            </>
          )}
          {canManage && (
            <Button
              variant="contained"
              disabled={!open}
              startIcon={<i className="bx bx-user-plus" />}
              onClick={() => {
                setCodeError(null);
                setCodeOpen(true);
              }}
            >
              Register
            </Button>
          )}
        </Stack>
      </ElectionPageHeader>

      {assembly && !open && (
        <Alert severity="info">
          Registration is closed. Current status:{" "}
          <ElectionStatusChip status={assembly.status} />
        </Alert>
      )}
      {query.isError && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={() => void query.refetch()}>
              Retry
            </Button>
          }
        >
          {getElectionErrorMessage(query.error, "Registrations could not be loaded.")}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <CustomTextField
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          size="small"
          label="Search registered members"
          placeholder="Name or member code"
          sx={{ maxInlineSize: 520 }}
          fullWidth
        />
      </Paper>

      <Paper sx={{ inlineSize: "100%", minInlineSize: 0, overflow: "hidden" }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 4, py: 3, borderBottom: 1, borderColor: "divider" }}
        >
          <Typography variant="h6">Attendance</Typography>
          <Chip
            size="small"
            variant="tonal"
            color="primary"
            label={`${total} registered`}
          />
        </Stack>
        <CustomTable
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
          loading={query.isFetching}
          disableRowSelectionOnClick
          density="compact"
          paginationMode="server"
          rowCount={total}
          paginationModel={pagination}
          onPaginationModelChange={setPagination}
          emptyTitle="Nobody has registered yet"
          emptyDescription="Press Register and enter a member code."
          sx={{ minBlockSize: 480, p: 0 }}
        />
      </Paper>

      <MemberCodeDialog
        open={codeOpen}
        title="Register Member"
        label="Enter Member Code"
        autoSearch={settings?.registration_auto_search ?? false}
        scope="registration"
        busy={mutations.lookup.isPending || mutations.create.isPending}
        error={codeError}
        onSubmit={submitCode}
        onClose={() => {
          setCodeOpen(false);
          setCodeError(null);
        }}
      />
      <MemberInfoDialog
        open={Boolean(pending)}
        member={pending}
        confirming={mutations.create.isPending}
        onConfirm={() => pending && void register(pending.member_code)}
        onCancel={() => {
          setPending(null);
          setCodeOpen(true);
        }}
      />
      <CustomDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        closeAfterTransition
        title="Remove Registration"
        description={
          deleteTarget?.member
            ? `Remove ${deleteTarget.member.name} from the attendance list?`
            : undefined
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
                    toast.success("Registration removed.");
                    setDeleteTarget(null);
                  })
                  .catch((error) => toast.error(getElectionErrorMessage(error)));
              }}
            >
              Remove
            </Button>
          </>
        }
      >
        <Typography sx={{ mt: 2 }}>
          A member who has already voted cannot be removed.
        </Typography>
      </CustomDialog>
    </Stack>
  );
}
