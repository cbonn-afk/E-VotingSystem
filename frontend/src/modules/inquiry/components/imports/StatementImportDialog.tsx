"use client";

import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { toast } from "react-toastify";

import CustomDialog from "@components/app/CustomDialog";

import { inquiryApi } from "../../api/inquiryApi";
import type { ImportResult, StatementType } from "../../api/types";
import { useStatementImport } from "../../hooks/useInquiryApi";
import { formatDate, getInquiryErrorMessage } from "../../utils/inquiryFormat";

type Props = { open: boolean; type: StatementType; onClose: () => void };

const copy: Record<StatementType, { title: string; columns: string }> = {
  balances: {
    title: "Import Account Balances",
    columns:
      "RFID (optional), Member Code, Member Name, Share Capital, Savings Bonus, Regular Savings, Dividend to Share Capital, Dividend to Savings, As-of Date, Time Deposit (optional).",
  },
  transactions: {
    title: "Import Savings Transactions",
    columns:
      "Member Code, Type (RS = Regular Savings, TD = Time Deposit, SC = Share Capital), Mode (D = Deposit, W = Withdrawal), Amount, Balance, Date.",
  },
  loans: {
    title: "Import Loan Balances",
    columns:
      "Member Code, Loan Code, Loan Number, Loan Type, Principal, Interest, Principal Paid, Interest Paid, Principal Balance, Interest Balance, Date Released, Start Date, Maturity Date.",
  },
};

export default function StatementImportDialog({ open, type, onClose }: Props) {
  const importer = useStatementImport();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFile(null);
      setResult(null);
      setError(null);
    }
  }, [open]);

  const run = async (commit: boolean) => {
    if (!file) return;
    setError(null);

    try {
      const response = await importer.mutateAsync({ type, file, commit });

      setResult(response.data);
      if (response.data.committed) toast.success("Import complete.");
    } catch (caught) {
      setError(getInquiryErrorMessage(caught, "The file could not be imported."));
    }
  };

  const canImport = result !== null && !result.committed && result.errors.length === 0 && result.importable > 0;

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      closeAfterTransition
      title={copy[type].title}
      description="Upload the Excel export (.xlsx, .xls or .csv). Check it first; nothing is saved until you import."
      actions={
        <>
          <Button onClick={onClose}>{result?.committed ? "Close" : "Cancel"}</Button>
          {!result?.committed && (
            <Button
              variant="outlined"
              disabled={!file || importer.isPending}
              onClick={() => void run(false)}
            >
              {importer.isPending ? "Working…" : "Check file"}
            </Button>
          )}
          {!result?.committed && (
            <Button
              variant="contained"
              disabled={!canImport || importer.isPending}
              onClick={() => void run(true)}
            >
              Import {result?.importable ?? 0} rows
            </Button>
          )}
        </>
      }
    >
      <Stack spacing={3} sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Columns, starting on row 2 (row 1 is the heading row): {copy[type].columns}
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            component="label"
            variant="outlined"
            startIcon={<i className="bx bx-upload" />}
            disabled={result?.committed}
          >
            {file ? file.name : "Choose file"}
            <input
              hidden
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setResult(null);
                setError(null);
              }}
            />
          </Button>
          <Button
            component="a"
            href={inquiryApi.imports.templateUrl(type)}
            startIcon={<i className="bx bx-download" />}
          >
            Download template
          </Button>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        {result?.committed && (
          <Alert severity="success">
            Done. {result.importable} rows loaded
            {result.as_of_date ? `, as of ${formatDate(result.as_of_date)}` : ""}.
          </Alert>
        )}

        {result && !result.committed && (
          <>
            <Alert severity={result.errors.length > 0 ? "error" : "info"}>
              {result.total} rows checked: {result.importable} ready, {result.errors.length} with errors.
              {result.errors.length === 0 &&
                ` Importing replaces the ${result.existing} rows currently loaded.`}
              {result.errors.length > 0 && " Fix the file and check it again; nothing was changed."}
            </Alert>
            {result.warnings.map((warning) => (
              <Alert key={warning} severity="warning">
                {warning}
              </Alert>
            ))}
            {result.errors.length > 0 && (
              <ul style={{ maxHeight: 220, overflow: "auto", paddingInlineStart: 20, margin: 0 }}>
                {result.errors.slice(0, 200).map((rowError) => (
                  <li key={`${rowError.row}-${rowError.message}`}>
                    <strong>Row {rowError.row}:</strong> {rowError.message}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </Stack>
    </CustomDialog>
  );
}
