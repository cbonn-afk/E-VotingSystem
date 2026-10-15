"use client";

import { useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { toast } from "react-toastify";

import CustomDialog from "@components/app/CustomDialog";
import { useAuthorization } from "@/modules/auth/hooks/useAuthorization";

import type { CandidateResource, PositionResource } from "../../api/types";
import CandidateCard from "../../components/ballot/CandidateCard";
import CandidateFormDrawer, {
  type CandidateSubmit,
} from "../../components/ballot/CandidateFormDrawer";
import PositionFormDrawer from "../../components/ballot/PositionFormDrawer";
import ElectionPageHeader from "../../components/shared/ElectionPageHeader";
import { useCurrentAssembly } from "../../hooks/useAssembliesApi";
import { useBallotMutations, usePositions } from "../../hooks/useBallotApi";
import type { PositionFormValues } from "../../schemas/electionSchemas";
import { getElectionErrorMessage } from "../../utils/electionFormat";

export default function BallotSetupView() {
  const authorization = useAuthorization();
  const assembly = useCurrentAssembly().data?.data;
  const query = usePositions();
  const mutations = useBallotMutations();
  const positions = query.data?.data ?? [];
  const locked = Boolean(
    assembly && !["draft", "registration"].includes(assembly.status),
  );
  const canManage = authorization.can("election.ballot.manage") && !locked;

  const [positionDrawer, setPositionDrawer] = useState(false);
  const [editingPosition, setEditingPosition] = useState<PositionResource | null>(null);
  const [candidateDrawer, setCandidateDrawer] = useState(false);
  const [candidatePosition, setCandidatePosition] = useState<PositionResource | null>(null);
  const [editingCandidate, setEditingCandidate] = useState<CandidateResource | null>(null);
  const [deletePosition, setDeletePosition] = useState<PositionResource | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<CandidateResource | null>(null);

  const savePosition = async (values: PositionFormValues) => {
    try {
      if (editingPosition)
        await mutations.updatePosition.mutateAsync({
          id: editingPosition.id,
          payload: values,
        });
      else await mutations.createPosition.mutateAsync(values);
      toast.success(editingPosition ? "Position updated." : "Position created.");
      setPositionDrawer(false);
      setEditingPosition(null);
    } catch (error) {
      toast.error(getElectionErrorMessage(error, "The position could not be saved."));
    }
  };

  const saveCandidate = async (values: CandidateSubmit): Promise<boolean> => {
    try {
      if (editingCandidate)
        await mutations.updateCandidate.mutateAsync({
          id: editingCandidate.id,
          name: values.name,
          photo: values.photo,
          removePhoto: values.removePhoto,
        });
      else if (candidatePosition)
        await mutations.createCandidate.mutateAsync({
          positionId: candidatePosition.id,
          name: values.name,
          photo: values.photo,
        });
      toast.success(editingCandidate ? "Candidate updated." : "Candidate added.");
      if (editingCandidate) {
        setCandidateDrawer(false);
        setEditingCandidate(null);
      }

      return true;
    } catch (error) {
      toast.error(getElectionErrorMessage(error, "The candidate could not be saved."));

      return false;
    }
  };

  return (
    <Stack spacing={5}>
      <ElectionPageHeader
        title="Positions & Candidates"
        description={
          assembly
            ? `${assembly.name} · each position lists its candidates and how many seats are open.`
            : "Each position lists its candidates and how many seats are open."
        }
      >
        {canManage && (
          <Button
            variant="contained"
            startIcon={<i className="bx bx-plus" />}
            onClick={() => {
              setEditingPosition(null);
              setPositionDrawer(true);
            }}
          >
            New Position
          </Button>
        )}
      </ElectionPageHeader>

      {locked && (
        <Alert severity="info">
          Voting has started, so positions and candidates are locked.
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
          {getElectionErrorMessage(query.error, "Positions could not be loaded.")}
        </Alert>
      )}
      {!query.isLoading && !query.isError && positions.length === 0 && (
        <Alert severity="info">
          No positions yet.{canManage ? " Create the first one to add candidates." : ""}
        </Alert>
      )}

      <Stack spacing={2}>
        {positions.map((position) => (
          <Accordion key={position.id} defaultExpanded disableGutters>
            <AccordionSummary expandIcon={<i className="bx bx-chevron-down" />}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ inlineSize: "100%", pr: 2 }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography variant="h6">{position.title}</Typography>
                  <Chip
                    size="small"
                    variant="tonal"
                    color="primary"
                    label={`${position.seats} seat${position.seats === 1 ? "" : "s"}`}
                  />
                  <Chip
                    size="small"
                    variant="tonal"
                    color="secondary"
                    label={`${position.candidates?.length ?? 0} candidate${(position.candidates?.length ?? 0) === 1 ? "" : "s"}`}
                  />
                </Stack>
                {canManage && (
                  <Stack
                    direction="row"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Tooltip title="Add candidate">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => {
                          setCandidatePosition(position);
                          setEditingCandidate(null);
                          setCandidateDrawer(true);
                        }}
                      >
                        <i className="bx bx-user-plus" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit position">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditingPosition(position);
                          setPositionDrawer(true);
                        }}
                      >
                        <i className="bx bx-edit" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete position">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeletePosition(position)}
                      >
                        <i className="bx bx-trash" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                )}
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              {(position.candidates ?? []).length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No candidates for this position yet.
                </Typography>
              ) : (
                <Box
                  sx={{
                    display: "grid",
                    gap: 4,
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, minmax(0, 1fr))",
                      lg: "repeat(4, minmax(0, 1fr))",
                    },
                  }}
                >
                  {(position.candidates ?? []).map((candidate) => (
                    <CandidateCard
                      key={candidate.id}
                      candidate={candidate}
                      canManage={canManage}
                      onEdit={(value) => {
                        setCandidatePosition(position);
                        setEditingCandidate(value);
                        setCandidateDrawer(true);
                      }}
                      onDelete={setDeleteCandidate}
                    />
                  ))}
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        ))}
      </Stack>

      <PositionFormDrawer
        open={positionDrawer}
        position={editingPosition}
        saving={
          mutations.createPosition.isPending || mutations.updatePosition.isPending
        }
        onClose={() => {
          setPositionDrawer(false);
          setEditingPosition(null);
        }}
        onSubmit={savePosition}
      />
      <CandidateFormDrawer
        open={candidateDrawer}
        candidate={editingCandidate}
        positionTitle={candidatePosition?.title ?? ""}
        saving={
          mutations.createCandidate.isPending ||
          mutations.updateCandidate.isPending
        }
        onClose={() => {
          setCandidateDrawer(false);
          setEditingCandidate(null);
        }}
        onSubmit={saveCandidate}
      />
      <CustomDialog
        open={Boolean(deletePosition)}
        onClose={() => setDeletePosition(null)}
        closeAfterTransition
        title="Delete Position"
        description={
          deletePosition
            ? `Delete ${deletePosition.title} and all of its candidates?`
            : undefined
        }
        actions={
          <>
            <Button onClick={() => setDeletePosition(null)}>Cancel</Button>
            <Button
              color="error"
              variant="contained"
              disabled={mutations.removePosition.isPending}
              onClick={() => {
                if (!deletePosition) return;
                void mutations.removePosition
                  .mutateAsync(deletePosition.id)
                  .then(() => {
                    toast.success("Position deleted.");
                    setDeletePosition(null);
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
      <CustomDialog
        open={Boolean(deleteCandidate)}
        onClose={() => setDeleteCandidate(null)}
        closeAfterTransition
        title="Delete Candidate"
        description={
          deleteCandidate ? `Remove ${deleteCandidate.name} from the ballot?` : undefined
        }
        actions={
          <>
            <Button onClick={() => setDeleteCandidate(null)}>Cancel</Button>
            <Button
              color="error"
              variant="contained"
              disabled={mutations.removeCandidate.isPending}
              onClick={() => {
                if (!deleteCandidate) return;
                void mutations.removeCandidate
                  .mutateAsync(deleteCandidate.id)
                  .then(() => {
                    toast.success("Candidate deleted.");
                    setDeleteCandidate(null);
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
