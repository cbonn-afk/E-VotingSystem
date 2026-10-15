"use client";

import { useMemo, useState } from "react";
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
import { useAuthorization } from "@/modules/auth/hooks/useAuthorization";

import { electionApi } from "../../api/electionApi";
import type { MemberResource, TokenResource } from "../../api/types";
import ElectionPageHeader from "../../components/shared/ElectionPageHeader";
import MemberCodeDialog from "../../components/shared/MemberCodeDialog";
import MemberInfoDialog from "../../components/shared/MemberInfoDialog";
import { useCurrentAssembly } from "../../hooks/useAssembliesApi";
import { useElectionSettings } from "../../hooks/useElectionSettingsApi";
import { useTokenMutations, useTokens } from "../../hooks/useTokensApi";
import { downloadExport } from "../../utils/downloadExport";
import {
  formatDateTime,
  getElectionErrorMessage,
} from "../../utils/electionFormat";
import { exportTablePdf } from "../../utils/exportTablePdf";
import { fetchAllPages } from "../../utils/fetchAllPages";

export default function TokensView() {
  const authorization = useAuthorization();
  const canExport = authorization.can("election.reports.export");
  const assembly = useCurrentAssembly().data?.data;
  const settings = useElectionSettings().data?.data;
  const [pagination, setPagination] = useState<CustomTablePaginationModel>({
    page: 0,
    pageSize: 30,
  });
  const query = useTokens({
    page: pagination.page + 1,
    per_page: pagination.pageSize,
  });
  const mutations = useTokenMutations();
  const rows = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;

  const [codeOpen, setCodeOpen] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [pending, setPending] = useState<MemberResource | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TokenResource | null>(null);
  const [exporting, setExporting] = useState(false);

  const issue = async (code: string) => {
    try {
      await mutations.create.mutateAsync(code);
      toast.success("Token recorded.");
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

      if (!data.registered) {
        setCodeError("This member has not registered to attend the general assembly.");

        return;
      }

      if (data.already_received) {
        setCodeError("This member already received the item.");

        return;
      }

      setCodeOpen(false);
      setPending(data.member);
    } catch (error) {
      setCodeError(getElectionErrorMessage(error));
    }
  };

  const columns = useMemo<CustomTableColumn<TokenResource>[]>(
    () => [
      {
        id: "code",
        label: "Member Code",
        width: 150,
        render: (row) => <Typography fontWeight={600}>{row.member?.member_code}</Typography>,
      },
      {
        id: "name",
        label: "Member Name",
        minWidth: 220,
        flex: 1.2,
        render: (row) => row.member?.name ?? "—",
      },
      {
        id: "issued",
        label: "Token Received",
        width: 200,
        render: (row) => formatDateTime(row.issued_at),
      },
      {
        id: "actions",
        label: "Actions",
        width: 90,
        align: "right",
        render: (row) => (
          <Tooltip title="Remove">
            <IconButton size="small" color="error" onClick={() => setDeleteTarget(row)}>
              <i className="bx bx-trash" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    [],
  );

  const exportPdf = async () => {
    setExporting(true);

    try {
      const all = await fetchAllPages((page) =>
        electionApi.tokens.list({ page, per_page: 100 }),
      );

      await exportTablePdf({
        filename: `token-distribution-${assembly?.year ?? ""}.pdf`,
        title: settings?.document_title || "Token Distribution List",
        subtitle: settings?.document_sub_title,
        head: ["#", "Member Code", "Name", "Date & Time Claimed"],
        body: all.map((row, index) => [
          index + 1,
          row.member?.member_code ?? "",
          row.member?.name ?? "",
          formatDateTime(row.issued_at),
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
        title="Token Distribution"
        description="Record which registered members received their token or item."
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
                {exporting ? "Preparing…" : "Distribution List (PDF)"}
              </Button>
              <Button
                variant="outlined"
                startIcon={<i className="bx bx-download" />}
                onClick={() => downloadExport("tokens")}
              >
                Distribution List (XLSX)
              </Button>
            </>
          )}
          <Button
            variant="contained"
            startIcon={<i className="bx bx-gift" />}
            onClick={() => {
              setCodeError(null);
              setCodeOpen(true);
            }}
          >
            Token Register
          </Button>
        </Stack>
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
          {getElectionErrorMessage(query.error, "Tokens could not be loaded.")}
        </Alert>
      )}

      <Paper sx={{ inlineSize: "100%", minInlineSize: 0, overflow: "hidden" }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 4, py: 3, borderBottom: 1, borderColor: "divider" }}
        >
          <Typography variant="h6">Token Distribution List</Typography>
          <Chip size="small" variant="tonal" color="primary" label={`${total} recorded`} />
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
          emptyTitle="No tokens recorded yet"
          emptyDescription="Press Token Register and enter a member code."
          sx={{ minBlockSize: 480, p: 0 }}
        />
      </Paper>

      <MemberCodeDialog
        open={codeOpen}
        title="Token Register"
        label="Enter Member Code"
        autoSearch={false}
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
        onConfirm={() => pending && void issue(pending.member_code)}
        onCancel={() => {
          setPending(null);
          setCodeOpen(true);
        }}
      />
      <CustomDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        closeAfterTransition
        title="Remove Token Record"
        description={
          deleteTarget?.member
            ? `Remove the token record of ${deleteTarget.member.name}?`
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
                    toast.success("Token record removed.");
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
          The member will be able to receive the item again.
        </Typography>
      </CustomDialog>
    </Stack>
  );
}
