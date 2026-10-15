"use client";

import { useState } from "react";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import { toast } from "react-toastify";

import CustomDialog from "@components/app/CustomDialog";
import Link from "@components/Link";
import Can from "@/modules/auth/components/Can";
import AccountingPageHeader from "@/modules/accounting/components/shared/AccountingPageHeader";
import { centeredTableSx } from "@/modules/accounting/components/shared/centerColumns";

import {
  useJournal,
  usePostJournal,
  useVoidJournal,
} from "@/modules/accounting/hooks/useAccountingApi";
import type { JournalEntryStatus } from "@/modules/accounting/api/types";
import {
  formatDate,
  formatPeso,
  getAccountingErrorMessage,
} from "@/modules/accounting/utils/accountingFormat";

const statusColor: Record<
  JournalEntryStatus,
  "secondary" | "success" | "error" | "warning"
> = {
  draft: "secondary",
  posted: "success",
  void: "error",
  reversed: "warning",
};

type Props = { journalId: string };

const JournalDetailView = ({ journalId }: Props) => {
  const journalQuery = useJournal(journalId);
  const postJournal = usePostJournal();
  const voidJournal = useVoidJournal();
  const [voidOpen, setVoidOpen] = useState(false);

  const entry = journalQuery.data?.data;

  const post = async () => {
    try {
      await postJournal.mutateAsync(journalId);
      toast.success("Journal entry posted.");
    } catch (error) {
      toast.error(
        getAccountingErrorMessage(error, "The entry could not be posted."),
      );
    }
  };

  const confirmVoid = async () => {
    try {
      await voidJournal.mutateAsync({ id: journalId });
      toast.success("Journal entry voided.");
      setVoidOpen(false);
    } catch (error) {
      toast.error(
        getAccountingErrorMessage(error, "The entry could not be voided."),
      );
    }
  };

  if (journalQuery.isPending) {
    return (
      <Stack className="items-center" sx={{ py: 10 }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (journalQuery.isError || !entry) {
    return (
      <Alert severity="error">The journal entry could not be loaded.</Alert>
    );
  }

  return (
    <Stack spacing={5}>
      <AccountingPageHeader
        title={entry.entryNo ?? "Draft Journal Entry"}
        description={entry.memo ?? "Journal entry detail"}
      >
        <Stack direction="row" spacing={2} className="items-center">
          <Button
            component={Link}
            href="/accounting/journals"
            variant="outlined"
            color="secondary"
            startIcon={<i className="bx-arrow-back" />}
          >
            Back
          </Button>
          {entry.status === "draft" && (
            <Can permission="accounting.journals.update">
              <Button
                component={Link}
                href={`/accounting/journals/${entry.id}/edit`}
                variant="outlined"
                startIcon={<i className="bx-edit" />}
              >
                Edit
              </Button>
            </Can>
          )}
          {entry.status === "draft" && (
            <Can permission="accounting.journals.post">
              <Button
                variant="contained"
                color="success"
                disabled={postJournal.isPending}
                onClick={() => void post()}
              >
                {postJournal.isPending ? "Posting..." : "Post"}
              </Button>
            </Can>
          )}
          {entry.status === "posted" && (
            <Can permission="accounting.journals.reverse">
              <Button
                variant="contained"
                color="error"
                startIcon={<i className="bx-block" />}
                onClick={() => setVoidOpen(true)}
              >
                Void
              </Button>
            </Can>
          )}
        </Stack>
      </AccountingPageHeader>

      <Paper className="p-5">
        <Stack direction="row" spacing={6} flexWrap="wrap">
          <Meta label="Status">
            <Chip
              label={entry.status}
              color={statusColor[entry.status]}
              variant="tonal"
              size="small"
            />
          </Meta>
          <Meta label="Date">{formatDate(entry.entryDate)}</Meta>
          <Meta label="Type">{entry.type}</Meta>
          <Meta label="Reference">{entry.reference ?? "—"}</Meta>
          <Meta label="Total">{formatPeso(entry.totalDebit)}</Meta>
        </Stack>
      </Paper>

      {entry.status === "reversed" && (
        <Alert severity="warning">
          This entry was reversed. Its original lines are preserved for history.
        </Alert>
      )}

      {entry.status === "void" && (
        <Alert severity="error">
          This entry was voided and is excluded from all financial reports.
        </Alert>
      )}

      <Paper>
        <TableContainer>
          <Table size="small" sx={centeredTableSx}>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Account</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Debit</TableCell>
                <TableCell align="right">Credit</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entry.items?.map((line) => (
                <TableRow key={line.id} hover>
                  <TableCell>{line.lineNo}</TableCell>
                  <TableCell>
                    {line.account
                      ? `${line.account.code} — ${line.account.name}`
                      : line.accountId}
                  </TableCell>
                  <TableCell>{line.description ?? "—"}</TableCell>
                  <TableCell align="right">{formatPeso(line.debit)}</TableCell>
                  <TableCell align="right">{formatPeso(line.credit)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3}>
                  <Typography fontWeight={700}>Total</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={700}>
                    {formatPeso(entry.totalDebit)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={700}>
                    {formatPeso(entry.totalCredit)}
                  </Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <CustomDialog
        open={voidOpen}
        onClose={
          voidJournal.isPending ? () => undefined : () => setVoidOpen(false)
        }
        closeAfterTransition
        width="480px"
        title="Void Journal Entry"
        icon={<i className="bx bx-block text-error" />}
        actions={
          <>
            <Button
              variant="outlined"
              color="secondary"
              disabled={voidJournal.isPending}
              onClick={() => setVoidOpen(false)}
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

const Meta = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <Stack spacing={0.5}>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" component="div" fontWeight={500}>
      {children}
    </Typography>
  </Stack>
);

export default JournalDetailView;
