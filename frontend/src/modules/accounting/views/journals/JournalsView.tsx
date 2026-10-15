"use client";

import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";

import { toast } from "react-toastify";

import CustomDialog from "@components/app/CustomDialog";
import CustomPageHeader from "@components/app/CustomPageHeader";
import CustomTable, {
  type CustomTablePaginationModel,
} from "@components/app/CustomTable";
import CustomTextField from "@core/components/mui/TextField";
import PromptUserCard from "@components/app/PromptUserCard";
import Can from "@/modules/auth/components/Can";
import { useAuthorization } from "@/modules/auth/hooks/useAuthorization";

import JournalEntryViewModal from "@/modules/accounting/components/journals/JournalEntryViewModal";
import NewJournalEntryButton from "@/modules/accounting/components/journals/NewJournalEntryButton";
import { getJournalColumns } from "@/modules/accounting/components/journals/journalColumns";

import {
  useDeleteJournal,
  useJournals,
  usePostJournal,
  useVoidJournal,
} from "@/modules/accounting/hooks/useAccountingApi";
import type {
  JournalEntryResource,
  JournalEntryStatus,
  JournalEntryType,
} from "@/modules/accounting/api/types";
import { useDebouncedValue } from "@/modules/users/hooks/useDebouncedValue";
import { getAccountingErrorMessage } from "@/modules/accounting/utils/accountingFormat";

const statuses: Array<JournalEntryStatus | ""> = [
  "",
  "draft",
  "posted",
  "reversed",
  "void",
];
const types: Array<JournalEntryType | ""> = [
  "",
  "general",
  "adjusting",
  "closing",
  "reversal",
];

const JournalsView = () => {
  const router = useRouter();
  const authorization = useAuthorization();
  const canUpdate = authorization.can("accounting.journals.update");
  const canPost = authorization.can("accounting.journals.post");
  const canVoid = authorization.can("accounting.journals.reverse");
  const canCreate = authorization.can("accounting.journals.create");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<JournalEntryStatus | "">("");
  const [type, setType] = useState<JournalEntryType | "">("");
  const [paginationModel, setPaginationModel] =
    useState<CustomTablePaginationModel>({ page: 0, pageSize: 30 });
  const [viewId, setViewId] = useState<string | null>(null);
  const [pendingVoid, setPendingVoid] = useState<JournalEntryResource | null>(
    null,
  );

  const debouncedSearch = useDebouncedValue(search, 400);

  const params = {
    page: paginationModel.page + 1,
    per_page: paginationModel.pageSize,
    search: debouncedSearch.trim() || undefined,
    status: status || undefined,
    type: type || undefined,
  };

  const journalsQuery = useJournals(params);
  const postJournal = usePostJournal();
  const voidJournal = useVoidJournal();
  const deleteJournal = useDeleteJournal();

  const rows = journalsQuery.data?.data ?? [];
  const rowCount = journalsQuery.data?.meta.total ?? 0;
  const busy =
    postJournal.isPending || voidJournal.isPending || deleteJournal.isPending;

  const filtersApplied = Boolean(debouncedSearch.trim() || status || type);
  const showEmptyPrompt =
    !journalsQuery.isPending &&
    !journalsQuery.isFetching &&
    rowCount === 0 &&
    !filtersApplied;

  const resetPage = () =>
    setPaginationModel((current) => ({ ...current, page: 0 }));

  const post = async (entry: JournalEntryResource) => {
    try {
      await postJournal.mutateAsync(entry.id);
      toast.success("Journal entry posted.");
    } catch (error) {
      toast.error(
        getAccountingErrorMessage(error, "The entry could not be posted."),
      );
    }
  };

  const remove = async (entry: JournalEntryResource) => {
    try {
      await deleteJournal.mutateAsync(entry.id);
      toast.success("Draft entry deleted.");
    } catch (error) {
      toast.error(
        getAccountingErrorMessage(error, "The entry could not be deleted."),
      );
    }
  };

  const confirmVoid = async () => {
    if (!pendingVoid) return;

    try {
      await voidJournal.mutateAsync({ id: pendingVoid.id });
      toast.success("Journal entry voided.");
      setPendingVoid(null);
    } catch (error) {
      toast.error(
        getAccountingErrorMessage(error, "The entry could not be voided."),
      );
    }
  };

  const columns = useMemo(
    () =>
      getJournalColumns({
        onView: (row) => setViewId(row.id),
        onEdit: (row) => router.push(`/accounting/journals/${row.id}/edit`),
        onPost: (row) => void post(row),
        onVoid: (row) => setPendingVoid(row),
        onDelete: (row) => void remove(row),
        busy,
        canUpdate,
        canPost,
        canVoid,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [busy, canUpdate, canPost, canVoid],
  );

  return (
    <Stack spacing={5}>
      <CustomPageHeader
        title="Journal Entries"
        description="Create manual ledger entries and review journals generated by accounting workflows."
      >
        <Can permission="accounting.journals.create">
          <NewJournalEntryButton />
        </Can>
      </CustomPageHeader>

      {journalsQuery.isError && (
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => journalsQuery.refetch()}
            >
              Retry
            </Button>
          }
        >
          Journal entries could not be loaded.
        </Alert>
      )}

      <Paper className="p-5">
        <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
          <CustomTextField
            fullWidth
            placeholder="Search entry no, reference, or memo"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              resetPage();
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <i className="bx-search" />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Type</InputLabel>
            <Select
              label="Type"
              value={type}
              onChange={(event) => {
                setType(event.target.value as JournalEntryType | "");
                resetPage();
              }}
            >
              {types.map((option) => (
                <MenuItem
                  key={option || "all"}
                  value={option}
                  className="capitalize"
                >
                  {option || "All types"}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as JournalEntryStatus | "");
                resetPage();
              }}
            >
              {statuses.map((option) => (
                <MenuItem
                  key={option || "all"}
                  value={option}
                  className="capitalize"
                >
                  {option || "All"}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {showEmptyPrompt ? (
        <PromptUserCard
          icon="bx-book"
          mainText="No transactions found"
          subText="Create a journal entry to begin recording financial activity."
          buttonText={canCreate ? "Create Journal Entry" : undefined}
          buttonAction={
            canCreate
              ? () => router.push("/accounting/journals/new")
              : undefined
          }
        />
      ) : (
        <Paper>
          <CustomTable
            rows={rows}
            loading={journalsQuery.isPending || journalsQuery.isFetching}
            columns={columns}
            getRowId={(row) => row.id}
            paginationMode="server"
            rowCount={rowCount}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            disableRowSelectionOnClick
            emptyTitle="No journal entries"
            emptyDescription="No entries match your filters."
            getRowClassName={(params) =>
              params.row.status === "void" ? "row-disabled" : ""
            }
            sx={{
              minBlockSize: 480,
              "& .row-disabled": { opacity: 0.5 },
            }}
          />
        </Paper>
      )}

      <JournalEntryViewModal
        entryId={viewId}
        open={Boolean(viewId)}
        onClose={() => setViewId(null)}
      />

      <CustomDialog
        open={Boolean(pendingVoid)}
        onClose={
          voidJournal.isPending ? () => undefined : () => setPendingVoid(null)
        }
        closeAfterTransition
        width="480px"
        title="Void Journal Entry"
        icon={<i className="bx bx-block text-error" />}
        description={pendingVoid?.entryNo ?? ""}
        actions={
          <>
            <Button
              variant="outlined"
              color="secondary"
              disabled={voidJournal.isPending}
              onClick={() => setPendingVoid(null)}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              disabled={voidJournal.isPending}
              onClick={() => void confirmVoid()}
            >
              {voidJournal.isPending ? "Voiding..." : "Void"}
            </Button>
          </>
        }
      >
        <Stack spacing={3} sx={{ mt: 3 }}>
          <Alert severity="warning">
            Voiding this entry permanently locks the record and removes its
            values from all financial reports. This cannot be undone.
          </Alert>
        </Stack>
      </CustomDialog>
    </Stack>
  );
};

export default JournalsView;
