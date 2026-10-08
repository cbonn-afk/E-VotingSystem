"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";

import Link from "@components/Link";

import JournalForm from "@/modules/accounting/components/journals/JournalForm";
import AccountingPageHeader from "@/modules/accounting/components/shared/AccountingPageHeader";
import { useJournal } from "@/modules/accounting/hooks/useAccountingApi";

type Props = { journalId: string };

const JournalEditView = ({ journalId }: Props) => {
  const journalQuery = useJournal(journalId);
  const entry = journalQuery.data?.data;

  if (journalQuery.isPending) {
    return (
      <Stack alignItems="center" sx={{ py: 10 }}>
        <CircularProgress />
      </Stack>
    );
  }

  // Only drafts can be edited; posted/reversed/void entries are immutable.
  if (!entry || entry.status !== "draft") {
    return (
      <Stack spacing={5}>
        <AccountingPageHeader
          title="Edit Journal Entry"
          description="Only draft entries can be edited."
        >
          <Button
            component={Link}
            href="/accounting/journals"
            variant="outlined"
            color="secondary"
            startIcon={<i className="bx-arrow-back" />}
          >
            Back
          </Button>
        </AccountingPageHeader>
        <Paper className="p-5">
          <Alert
            severity="warning"
            sx={{
              "& .MuiAlert-action": {
                alignItems: "center",
                pt: 0,
              },
            }}
            action={
              entry ? (
                <Button
                  component={Link}
                  href={`/accounting/journals/${entry.id}`}
                  color="inherit"
                  size="small"
                >
                  View entry
                </Button>
              ) : undefined
            }
          >
            {entry
              ? "This entry is no longer a draft and cannot be edited. Reverse it instead to make corrections."
              : "Journal entry not found."}
          </Alert>
        </Paper>
      </Stack>
    );
  }

  return <JournalForm mode="edit" entryId={journalId} />;
};

export default JournalEditView;
