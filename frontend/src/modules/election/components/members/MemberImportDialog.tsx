"use client";

import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { toast } from "react-toastify";

import CustomDialog from "@components/app/CustomDialog";

import type { MemberImportSummary } from "../../api/types";
import { useMemberMutations } from "../../hooks/useMembersApi";
import { getElectionErrorMessage } from "../../utils/electionFormat";

type Props = { open: boolean; onClose: () => void };

export default function MemberImportDialog({ open, onClose }: Props) {
  const { importFile } = useMemberMutations();
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<MemberImportSummary | null>(null);

  useEffect(() => {
    if (open) {
      setFile(null);
      setSummary(null);
    }
  }, [open]);

  const submit = async () => {
    if (!file) return;

    try {
      const response = await importFile.mutateAsync(file);

      setSummary(response.data);
      toast.success("Members imported.");
    } catch (error) {
      toast.error(
        getElectionErrorMessage(error, "The file could not be imported."),
      );
    }
  };

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      closeAfterTransition
      title="Import Members"
      description="Upload an Excel file (.xlsx or .xls). Existing members are updated by member code; nobody is deleted."
      actions={
        <>
          <Button onClick={onClose}>{summary ? "Close" : "Cancel"}</Button>
          {!summary && (
            <Button
              variant="contained"
              disabled={!file || importFile.isPending}
              onClick={() => void submit()}
            >
              {importFile.isPending ? "Importing…" : "Import"}
            </Button>
          )}
        </>
      }
    >
      <Stack spacing={3} sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Columns, starting on row 2: Member Code, Name, Birth Date, Address,
          Delinquent (yes/no).
        </Typography>
        <Button
          component="label"
          variant="outlined"
          startIcon={<i className="bx bx-upload" />}
        >
          {file ? file.name : "Choose file"}
          <input
            hidden
            type="file"
            accept=".xlsx,.xls"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setSummary(null);
            }}
          />
        </Button>
        {summary && (
          <Alert severity="success">
            {summary.created} created, {summary.updated} updated,{" "}
            {summary.skipped} skipped.
          </Alert>
        )}
      </Stack>
    </CustomDialog>
  );
}
