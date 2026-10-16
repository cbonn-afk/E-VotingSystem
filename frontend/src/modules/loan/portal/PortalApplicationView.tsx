"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { toast } from "react-toastify";

import { ApiError } from "@/libs/api/apiError";

import ApplicationDetailsForm from "../components/ApplicationDetailsForm";
import ApplicationStatusChip from "../components/ApplicationStatusChip";
import LoanAccountPanel from "../components/LoanAccountPanel";
import MemberAgreementPanel from "../components/MemberAgreementPanel";
import ApplicationTimeline from "../components/ApplicationTimeline";
import MemberApplicationDocuments from "../components/MemberApplicationDocuments";
import SignaturePad from "../components/SignaturePad";
import { parseCodes, toDetailsForm } from "../schemas/applicationSchema";
import { formatPeso } from "../utils/applicationStatus";
import { usePortalApplication, usePortalApplicationActions } from "./usePortalApplications";
import { portalErrorStatus } from "./usePortalMember";

const messageOf = (error: unknown, fallback: string): string => (error instanceof ApiError ? error.message : fallback);

export default function PortalApplicationView({ applicationId }: { applicationId: number }) {
  const router = useRouter();
  const query = usePortalApplication(applicationId);
  const actions = usePortalApplicationActions(applicationId);

  const [guarantorText, setGuarantorText] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [problems, setProblems] = useState<string[]>([]);

  const application = query.data?.data;
  const status = portalErrorStatus(query.error);

  if (status === 401) {
    router.replace("/loan-portal");

    return null;
  }

  if (query.isPending) {
    return (
      <Box className="flex min-bs-[100dvh] items-center justify-center">
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (!application || !application.product) {
    return (
      <Box className="flex min-bs-[100dvh] items-center justify-center p-6">
        <Alert severity="error">{status === 404 ? "This application was not found." : "The application could not be loaded."}</Alert>
      </Box>
    );
  }

  const product = application.product;
  const editable = application.editable;
  const guarantors = application.guarantors ?? [];
  const codes = guarantorText ?? guarantors.map((g) => g.member_code).join(", ");

  const submit = () =>
    actions.submit.mutate(undefined, {
      onSuccess: () => {
        setProblems([]);
        toast.success("Your application was submitted.");
      },
      onError: (error) => {
        if (error instanceof ApiError && error.errors.submit) setProblems(error.errors.submit);
        else if (error instanceof ApiError && error.errors.confirmed) setProblems(error.errors.confirmed);
        else toast.error(messageOf(error, "The application could not be submitted."));
      },
    });

  return (
    <Box className="mx-auto is-full max-is-[720px] p-6">
      <Stack spacing={4}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="h5" fontWeight="bold">
              {product.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Reference {application.reference_no} · {formatPeso(application.amount)} · {application.term_months} months
            </Typography>
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center">
            <ApplicationStatusChip status={application.status} />
            <Button color="secondary" onClick={() => router.push("/loan-portal/dashboard")}>
              Back
            </Button>
          </Stack>
        </Stack>

        {application.status === "returned" && application.status_remarks && (
          <Alert severity="warning">The cooperative returned your application: {application.status_remarks}</Alert>
        )}
        {application.status === "rejected" && application.status_remarks && (
          <Alert severity="error">Your application was not approved: {application.status_remarks}</Alert>
        )}
        {application.status === "submitted" && <Alert severity="info">Submitted. The cooperative will review your documents next.</Alert>}
        {application.status === "document_review" && <Alert severity="info">The cooperative is checking your documents.</Alert>}
        {application.status === "for_evaluation" && <Alert severity="success">Your documents were accepted. The application is waiting for evaluation.</Alert>}
        {application.status === "for_approval" && <Alert severity="info">Your application was evaluated and is now with the approvers.</Alert>}
        {application.status === "for_agreement" && <Alert severity="warning">Your loan is approved. Please read and accept the loan agreement below.</Alert>}
        {application.status === "for_release" && <Alert severity="info">Thank you. The cooperative will release your loan soon.</Alert>}
        {application.status === "released" && <Alert severity="success">Your loan was released. Your repayment schedule is below.</Alert>}
        {application.status === "approved" && (
          <Alert severity="success">
            Your loan was approved
            {application.approved_amount ? ` for ${formatPeso(application.approved_amount)}` : ""}. The cooperative will contact you about the next steps.
          </Alert>
        )}

        {application.agreement && ["for_agreement", "for_release", "released"].includes(application.status) && (
          <MemberAgreementPanel application={application} />
        )}
        {application.loan && <LoanAccountPanel loan={application.loan} />}

        <Paper className="p-6">
          <Stack spacing={3}>
            <Typography variant="h6">Loan details</Typography>
            {editable ? (
              <ApplicationDetailsForm
                key={application.updated_at ?? "form"}
                product={product}
                defaultValues={toDetailsForm(application)}
                submitLabel="Save details"
                pending={actions.update.isPending}
                onSubmit={(body) =>
                  actions.update.mutate(body, {
                    onSuccess: () => toast.success("Details saved."),
                    onError: (e) => toast.error(messageOf(e, "The details could not be saved.")),
                  })
                }
              />
            ) : (
              <Stack spacing={0.5}>
                <Typography variant="body2">Purpose: {application.purpose}</Typography>
                {application.monthly_income && <Typography variant="body2">Monthly income: {formatPeso(application.monthly_income)}</Typography>}
                {application.employer_business && <Typography variant="body2">Employer or business: {application.employer_business}</Typography>}
                {application.collateral_description && (
                  <Typography variant="body2">
                    Collateral: {application.collateral_description}
                    {application.collateral_value ? ` (${formatPeso(application.collateral_value)})` : ""}
                  </Typography>
                )}
              </Stack>
            )}
          </Stack>
        </Paper>

        <Paper className="p-6">
          <Stack spacing={3}>
            <Typography variant="h6">Documents</Typography>
            <MemberApplicationDocuments
              application={application}
              uploading={actions.upload.isPending}
              onUpload={(requirement, file) =>
                actions.upload.mutate(
                  { requirement, file },
                  { onError: (e) => toast.error(e instanceof ApiError ? (e.errors.file?.[0] ?? e.message) : "The file could not be uploaded.") },
                )
              }
              onRemove={(documentId) =>
                actions.removeDocument.mutate(documentId, { onError: (e) => toast.error(messageOf(e, "The file could not be removed.")) })
              }
            />
          </Stack>
        </Paper>

        {(product.requires_guarantor || guarantors.length > 0) && (
          <Paper className="p-6">
            <Stack spacing={3}>
              <Typography variant="h6">Guarantors</Typography>
              <Typography variant="body2" color="text.secondary">
                This loan needs {product.guarantor_count} guarantor(s). Enter their member codes, separated by commas.
              </Typography>
              {editable ? (
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "flex-start" }}>
                  <TextField fullWidth label="Guarantor member codes" value={codes} onChange={(event) => setGuarantorText(event.target.value)} />
                  <Button
                    variant="contained"
                    disabled={actions.guarantors.isPending}
                    onClick={() =>
                      actions.guarantors.mutate(parseCodes(codes), {
                        onSuccess: () => {
                          setGuarantorText(null);
                          toast.success("Guarantors saved.");
                        },
                        onError: (e) => toast.error(e instanceof ApiError ? (e.errors.member_codes?.[0] ?? e.message) : "The guarantors could not be saved."),
                      })
                    }
                  >
                    Save
                  </Button>
                </Stack>
              ) : null}
              {guarantors.map((g) => (
                <Typography key={g.member_code} variant="body2">
                  {g.name} ({g.member_code})
                </Typography>
              ))}
            </Stack>
          </Paper>
        )}

        {editable && (
          <Paper className="p-6">
            <Stack spacing={3}>
              <Typography variant="h6">Signature</Typography>
              {application.has_signature && <Alert severity="success">A signature is saved. Draw and save again to replace it.</Alert>}
              <SignaturePad
                pending={actions.signature.isPending}
                onSave={(dataUrl) =>
                  actions.signature.mutate(dataUrl, {
                    onSuccess: () => toast.success("Signature saved."),
                    onError: (e) => toast.error(messageOf(e, "The signature could not be saved.")),
                  })
                }
              />
            </Stack>
          </Paper>
        )}

        {editable && (
          <Paper className="p-6">
            <Stack spacing={3}>
              <Typography variant="h6">Submit</Typography>
              {problems.length > 0 && (
                <Alert severity="error">
                  <Stack component="ul" sx={{ m: 0, pl: 2 }}>
                    {problems.map((problem) => (
                      <li key={problem}>{problem}</li>
                    ))}
                  </Stack>
                </Alert>
              )}
              <FormControlLabel
                label="I confirm that the information and documents I gave are true and correct."
                control={<Checkbox checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />}
              />
              <Stack direction="row" spacing={2}>
                <Button variant="contained" disabled={!confirmed || actions.submit.isPending} onClick={submit}>
                  {application.status === "returned" ? "Resubmit application" : "Submit application"}
                </Button>
                {application.status === "draft" && (
                  <Button
                    color="error"
                    disabled={actions.cancel.isPending}
                    onClick={() => {
                      if (window.confirm("Cancel this draft?"))
                        actions.cancel.mutate(undefined, { onSuccess: () => router.push("/loan-portal/dashboard") });
                    }}
                  >
                    Cancel draft
                  </Button>
                )}
              </Stack>
            </Stack>
          </Paper>
        )}

        <Divider />
        <Stack spacing={2}>
          <Typography variant="h6">History</Typography>
          <ApplicationTimeline events={application.events ?? []} />
        </Stack>
      </Stack>
    </Box>
  );
}
