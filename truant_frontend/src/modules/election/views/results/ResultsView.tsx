"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { toast } from "react-toastify";

import CustomKPICard from "@components/app/CustomKPICard";
import CustomTextField from "@core/components/mui/TextField";

import ElectionPageHeader from "../../components/shared/ElectionPageHeader";
import VoteBar from "../../components/results/VoteBar";
import { useAssemblies } from "../../hooks/useAssembliesApi";
import { useResults } from "../../hooks/useResultsApi";
import { getElectionErrorMessage } from "../../utils/electionFormat";
import { exportResultsPdf } from "../../utils/exportResultsPdf";

const kpiGrid = {
  display: "grid",
  gap: 4,
  gridTemplateColumns: {
    xs: "1fr",
    sm: "repeat(2, minmax(0, 1fr))",
    xl: "repeat(4, minmax(0, 1fr))",
  },
} as const;

export default function ResultsView() {
  const [assemblyId, setAssemblyId] = useState("");
  const [exporting, setExporting] = useState(false);
  const assemblies = useAssemblies().data?.data ?? [];
  const query = useResults({ assembly_id: assemblyId || undefined });
  const results = query.data?.data;
  const registered = results?.turnout.registered ?? 0;
  const turnoutPercent =
    registered > 0 && results
      ? ((results.turnout.election_voters / registered) * 100).toFixed(1)
      : "0.0";

  const exportPdf = async () => {
    if (!results) return;
    setExporting(true);

    try {
      await exportResultsPdf(results);
    } catch (error) {
      toast.error(getElectionErrorMessage(error, "The PDF could not be created."));
    } finally {
      setExporting(false);
    }
  };

  return (
    <Stack spacing={5}>
      <ElectionPageHeader
        title="Election Results"
        description="Votes are counted without knowing who cast them. Percentages are of registered members."
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <CustomTextField
            select
            size="small"
            label="Assembly"
            value={assemblyId}
            onChange={(event) => setAssemblyId(event.target.value)}
            sx={{ minInlineSize: 200 }}
          >
            <MenuItem value="">Current assembly</MenuItem>
            {assemblies.map((assembly) => (
              <MenuItem key={assembly.id} value={String(assembly.id)}>
                {assembly.year} · {assembly.name}
              </MenuItem>
            ))}
          </CustomTextField>
          <Button
            variant="contained"
            disabled={!results || exporting}
            startIcon={<i className="bx bx-file" />}
            onClick={() => void exportPdf()}
          >
            {exporting ? "Preparing…" : "Export PDF"}
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
          {getElectionErrorMessage(query.error, "Results could not be loaded.")}
        </Alert>
      )}

      <Box sx={kpiGrid}>
        <CustomKPICard
          label="Registered Members"
          value={String(registered)}
          loading={query.isLoading}
          iconString="bx bx-id-card"
          iconColor="primary"
        />
        <CustomKPICard
          label="Voted (Candidates)"
          value={String(results?.turnout.election_voters ?? 0)}
          loading={query.isLoading}
          iconString="bx bx-poll"
          iconColor="success"
        />
        <CustomKPICard
          label="Voted (Amendments)"
          value={String(results?.turnout.amendment_voters ?? 0)}
          loading={query.isLoading}
          iconString="bx bx-file"
          iconColor="info"
        />
        <CustomKPICard
          label="Turnout"
          value={`${turnoutPercent}%`}
          loading={query.isLoading}
          iconString="bx bx-bar-chart-alt-2"
          iconColor="warning"
        />
      </Box>

      <Typography variant="h5">Candidate Votes</Typography>
      {results && results.positions.length === 0 && (
        <Alert severity="info">No positions have been set up.</Alert>
      )}
      {results?.positions.map((position) => (
        <Paper key={position.id} sx={{ p: 5 }}>
          <Stack spacing={3}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Stack>
                <Typography variant="h6">{position.title}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {position.seats} seat{position.seats === 1 ? "" : "s"} ·{" "}
                  {position.total_votes} vote{position.total_votes === 1 ? "" : "s"} cast
                </Typography>
              </Stack>
            </Stack>
            {position.tie_for_last_seat && (
              <Alert severity="warning">
                There is a tie for the last seat. Nobody tied is marked elected.
              </Alert>
            )}
            {position.candidates.map((candidate) => (
              <VoteBar
                key={candidate.id}
                label={candidate.name}
                votes={candidate.votes}
                total={registered}
                color={candidate.elected ? "success" : "primary"}
                extra={
                  candidate.elected ? (
                    <Chip size="small" variant="tonal" color="success" label="Elected" />
                  ) : undefined
                }
              />
            ))}
          </Stack>
        </Paper>
      ))}

      <Typography variant="h5">Amendment Votes</Typography>
      {results && results.amendments.length === 0 && (
        <Alert severity="info">There are no amendment proposals.</Alert>
      )}
      {results?.amendments.map((amendment) => (
        <Paper key={amendment.id} sx={{ p: 5 }}>
          <Stack spacing={3}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Stack>
                <Typography variant="h6">{amendment.title}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Proposed by {amendment.proposed_by || "—"}
                </Typography>
              </Stack>
              <Chip
                size="small"
                variant="tonal"
                color={amendment.passed ? "success" : "secondary"}
                label={amendment.passed ? "Passed" : "Not passed"}
              />
            </Stack>
            <VoteBar label="Agree" votes={amendment.agree} total={registered} color="success" />
            <VoteBar label="Disagree" votes={amendment.disagree} total={registered} color="error" />
            <VoteBar label="Did not vote" votes={amendment.abstained} total={registered} color="secondary" />
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
