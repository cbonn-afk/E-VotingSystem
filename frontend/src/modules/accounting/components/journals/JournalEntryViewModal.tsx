"use client";

import { useMemo, useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableFooter from "@mui/material/TableFooter";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import { toast } from "react-toastify";

import CustomDialog from "@components/app/CustomDialog";
import { useAuthorization } from "@/modules/auth/hooks/useAuthorization";

import { useJournal, usePostJournal } from "../../hooks/useAccountingApi";
import {
  formatDate,
  formatPeso,
  getAccountingErrorMessage,
} from "../../utils/accountingFormat";
import { journalStatusColor } from "./journalColumns";

type Props = {
  entryId: string | null;
  open: boolean;
  onClose: () => void;
};

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <Stack
    direction="row"
    justifyContent="space-between"
    alignItems="center"
    spacing={2}
  >
    <Typography variant="subtitle2">{label}</Typography>
    <Box
      sx={{
        typography: "body2",
        color: "text.secondary",
        textAlign: "right",
        minWidth: 0,
      }}
    >
      {value}
    </Box>
  </Stack>
);

const JournalEntryViewModal = ({ entryId, open, onClose }: Props) => {
  const authorization = useAuthorization();
  const canPost = authorization.can("accounting.journals.post");

  const query = useJournal(open && entryId ? entryId : "");
  const postJournal = usePostJournal();
  const entry = query.data?.data;

  const [confirmPost, setConfirmPost] = useState(false);

  const totals = useMemo(() => {
    const items = entry?.items ?? [];

    return {
      debit: items.reduce((sum, item) => sum + (item.debit || 0), 0),
      credit: items.reduce((sum, item) => sum + (item.credit || 0), 0),
    };
  }, [entry]);

  const handlePost = async () => {
    if (!entry) return;

    try {
      await postJournal.mutateAsync(entry.id);
      toast.success("Journal entry posted.");
      setConfirmPost(false);
      onClose();
    } catch (error) {
      toast.error(
        getAccountingErrorMessage(error, "The entry could not be posted."),
      );
    }
  };

  return (
    <>
      <CustomDialog
        open={open}
        onClose={onClose}
        closeAfterTransition
        width="900px"
        title={`Journal Entry ${entry?.entryNo ?? (entry ? "(Draft)" : "")}`}
        icon={<i className="bx bx-book text-primary" />}
        actions={
          <>
            <Button variant="outlined" color="secondary" onClick={onClose}>
              Close
            </Button>
            {entry?.status === "draft" && canPost && (
              <Button variant="contained" onClick={() => setConfirmPost(true)}>
                Post
              </Button>
            )}
          </>
        }
      >
        {query.isPending || !entry ? (
          <Stack alignItems="center" sx={{ py: 6 }}>
            <CircularProgress />
          </Stack>
        ) : (
          <Stack spacing={5} sx={{ mt: 2 }}>
            {/* Entry details */}
            <Stack spacing={2}>
              <Typography variant="h6">Entry Details</Typography>
              <Paper variant="outlined" sx={{ p: 4 }}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={8}>
                  <Stack spacing={2} sx={{ flex: 1 }}>
                    <DetailRow
                      label="Date"
                      value={formatDate(entry.entryDate)}
                    />
                    <DetailRow
                      label="Type"
                      value={<span className="capitalize">{entry.type}</span>}
                    />
                    <DetailRow
                      label="Fund Source"
                      value={entry.fundSource?.name ?? "-"}
                    />
                    <DetailRow
                      label="Amount"
                      value={formatPeso(entry.totalDebit)}
                    />
                    <DetailRow
                      label="Reference #"
                      value={entry.reference || "-"}
                    />
                    <DetailRow
                      label="Status"
                      value={
                        <Chip
                          label={entry.status.toUpperCase()}
                          color={journalStatusColor[entry.status]}
                          variant="tonal"
                          size="small"
                        />
                      }
                    />
                  </Stack>
                  <Stack spacing={1} sx={{ flex: 1 }}>
                    <Typography variant="subtitle2">Note</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {entry.memo || "-"}
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
            </Stack>

            {/* Ledger */}
            <Stack spacing={2}>
              <Typography variant="h6">Ledger</Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <strong>Account Code</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Account Name</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Description</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Tax</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>Debit</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>Credit</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(entry.items ?? []).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.account?.code ?? "-"}</TableCell>
                        <TableCell>{item.account?.name ?? "-"}</TableCell>
                        <TableCell>{item.description || "-"}</TableCell>
                        <TableCell>
                          {item.tax
                            ? `${item.tax.name} (${item.tax.rate}%)`
                            : "-"}
                        </TableCell>
                        <TableCell align="right">
                          {item.debit ? formatPeso(item.debit) : ""}
                        </TableCell>
                        <TableCell align="right">
                          {item.credit ? formatPeso(item.credit) : ""}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={4} align="right">
                        <Typography variant="subtitle2" fontWeight={700}>
                          Total
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2" fontWeight={700}>
                          {formatPeso(totals.debit)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2" fontWeight={700}>
                          {formatPeso(totals.credit)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </Paper>
            </Stack>
          </Stack>
        )}
      </CustomDialog>

      <CustomDialog
        open={confirmPost}
        onClose={() => setConfirmPost(false)}
        closeAfterTransition
        width="460px"
        title="Post Confirmation"
        icon={<i className="bx bx-check-double text-success" />}
        description={`You are about to post ${entry?.entryNo ?? "this draft entry"}.`}
        actions={
          <>
            <Button
              variant="outlined"
              color="secondary"
              disabled={postJournal.isPending}
              onClick={() => setConfirmPost(false)}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              disabled={postJournal.isPending}
              onClick={() => void handlePost()}
            >
              {postJournal.isPending ? "Posting..." : "Post"}
            </Button>
          </>
        }
      >
        <Typography variant="body2" sx={{ mt: 2 }}>
          Posting finalizes the transaction and updates ledger balances and
          reports. Once posted, the entry can no longer be edited — this cannot
          be undone.
        </Typography>
      </CustomDialog>
    </>
  );
};

export default JournalEntryViewModal;
