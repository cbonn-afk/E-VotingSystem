"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";

import { AgreementDocument, PrintButton, PrintStyles } from "../components/PrintDocuments";
import { useLoanApplication } from "../hooks/useLoanApplications";
import { usePortalApplication } from "../portal/usePortalApplications";

type Props = { applicationId: number; audience: "staff" | "member" };

/** One page with only the agreement, ready to print or save as a PDF. */
export default function AgreementPrintView({ applicationId, audience }: Props) {
  const staff = useLoanApplication(applicationId, audience === "staff");
  const member = usePortalApplication(applicationId, audience === "member");
  const query = audience === "staff" ? staff : member;
  const application = query.data?.data;

  if (query.isPending) return <CircularProgress size={32} />;
  if (!application?.agreement) return <Alert severity="info">There is no agreement for this application yet.</Alert>;

  return (
    <Box sx={{ p: { xs: 2, sm: 4 } }}>
      <PrintStyles />
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="center">
          <PrintButton />
        </Stack>
        <AgreementDocument application={application} agreement={application.agreement} />
      </Stack>
    </Box>
  );
}
