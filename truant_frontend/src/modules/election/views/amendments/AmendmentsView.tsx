"use client";

import { useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { toast } from "react-toastify";

import CustomDialog from "@components/app/CustomDialog";
import { useAuthorization } from "@/modules/auth/hooks/useAuthorization";

import type { AmendmentResource } from "../../api/types";
import AmendmentFormDrawer from "../../components/amendments/AmendmentFormDrawer";
import ElectionPageHeader from "../../components/shared/ElectionPageHeader";
import { useCurrentAssembly } from "../../hooks/useAssembliesApi";
import {
  useAmendmentMutations,
  useAmendments,
} from "../../hooks/useBallotApi";
import type { AmendmentFormValues } from "../../schemas/electionSchemas";
import { getElectionErrorMessage } from "../../utils/electionFormat";

const Section = ({ label, value }: { label: string; value: string | null }) => (
  <Stack spacing={0.5}>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
      {value || "—"}
    </Typography>
  </Stack>
);

export default function AmendmentsView() {
  const authorization = useAuthorization();
  const assembly = useCurrentAssembly().data?.data;
  const query = useAmendments();
  const mutations = useAmendmentMutations();
  const amendments = query.data?.data ?? [];
  const locked = Boolean(
    assembly && !["draft", "registration"].includes(assembly.status),
  );
  const canManage = authorization.can("election.ballot.manage") && !locked;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<AmendmentResource | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AmendmentResource | null>(null);

  const save = async (values: AmendmentFormValues) => {
    const payload = {
      title: values.title,
      proposed_by: values.proposedBy,
      original_content: values.originalContent,
      proposed_content: values.proposedContent,
      effect: values.effect,
    };

    try {
      if (editing)
        await mutations.update.mutateAsync({ id: editing.id, payload });
      else await mutations.create.mutateAsync(payload);
      toast.success(editing ? "Proposal updated." : "Proposal created.");
      setDrawerOpen(false);
      setEditing(null);
    } catch (error) {
      toast.error(getElectionErrorMessage(error, "The proposal could not be saved."));
    }
  };

  return (
    <Stack spacing={5}>
      <ElectionPageHeader
        title="Amendment Proposals"
        description="Proposed changes members vote on, agree or disagree."
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
            New Proposal
          </Button>
        )}
      </ElectionPageHeader>

      {locked && (
        <Alert severity="info">
          Voting has started, so proposals are locked.
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
          {getElectionErrorMessage(query.error, "Proposals could not be loaded.")}
        </Alert>
      )}
      {!query.isLoading && !query.isError && amendments.length === 0 && (
        <Alert severity="info">No amendment proposals yet.</Alert>
      )}

      <Stack spacing={2}>
        {amendments.map((amendment) => (
          <Accordion key={amendment.id} disableGutters>
            <AccordionSummary expandIcon={<i className="bx bx-chevron-down" />}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ inlineSize: "100%", pr: 2 }}
              >
                <Stack>
                  <Typography variant="h6">{amendment.title}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Proposed by {amendment.proposed_by || "—"}
                  </Typography>
                </Stack>
                {canManage && (
                  <Stack
                    direction="row"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditing(amendment);
                          setDrawerOpen(true);
                        }}
                      >
                        <i className="bx bx-edit" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleteTarget(amendment)}
                      >
                        <i className="bx bx-trash" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                )}
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={3}>
                <Section label="Original content" value={amendment.original_content} />
                <Section label="Proposed content" value={amendment.proposed_content} />
                <Section label="Effect" value={amendment.effect} />
              </Stack>
            </AccordionDetails>
          </Accordion>
        ))}
      </Stack>

      <AmendmentFormDrawer
        open={drawerOpen}
        amendment={editing}
        saving={mutations.create.isPending || mutations.update.isPending}
        onClose={() => {
          setDrawerOpen(false);
          setEditing(null);
        }}
        onSubmit={save}
      />
      <CustomDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        closeAfterTransition
        title="Delete Proposal"
        description={
          deleteTarget ? `Delete "${deleteTarget.title}"?` : undefined
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
                    toast.success("Proposal deleted.");
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
        <Typography sx={{ mt: 2 }}>This cannot be undone.</Typography>
      </CustomDialog>
    </Stack>
  );
}
