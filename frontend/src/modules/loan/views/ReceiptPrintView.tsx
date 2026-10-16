"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";

import { PrintButton, PrintStyles, ReceiptDocument } from "../components/PrintDocuments";
import { useLoanApplication } from "../hooks/useLoanApplications";

/** The release receipt, ready to print for the member to sign. */
export default function ReceiptPrintView({ applicationId }: { applicationId: number }) {
  const query = useLoanApplication(applicationId);
  const application = query.data?.data;

  if (query.isPending) return <CircularProgress size={32} />;
  if (!application?.loan?.release) return <Alert severity="info">This loan has not been released yet.</Alert>;

  return (
    <Box sx={{ p: { xs: 2, sm: 4 } }}>
      <PrintStyles />
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="center">
          <PrintButton label="Print receipt" />
        </Stack>
        <ReceiptDocument application={application} loan={application.loan} />
      </Stack>
    </Box>
  );
}
