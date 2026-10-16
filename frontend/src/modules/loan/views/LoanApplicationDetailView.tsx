"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { toast } from "react-toastify";

import { ApiError } from "@/libs/api/apiError";
import { useAuthorization } from "@/modules/auth/hooks/useAuthorization";

import type { ApplicationAction } from "../api/loanApplicationsApi";
import ApplicationStatusChip from "../components/ApplicationStatusChip";
import AgreementPanel from "../components/AgreementPanel";
import ApplicationTimeline from "../components/ApplicationTimeline";
import ApprovalPanel from "../components/ApprovalPanel";
import EvaluationForm from "../components/EvaluationForm";
import EvaluationSummary from "../components/EvaluationSummary";
import LoanAccountPanel from "../components/LoanAccountPanel";
import ReleasePanel from "../components/ReleasePanel";
import FilePreviewDialog, { type PreviewTarget } from "../components/FilePreviewDialog";
import RemarksDialog from "../components/RemarksDialog";
import { useLoanApplication, useLoanApplicationActions } from "../hooks/useLoanApplications";
import type { ApplicationDocument } from "../types";
import { formatDateTime, formatPeso } from "../utils/applicationStatus";
import { downloadFile, formatFileSize } from "../utils/downloadFile";

const docColor = { pending: "default", accepted: "success", rejected: "error" } as const;
const docLabel = { pending: "Not reviewed yet", accepted: "Accepted", rejected: "Rejected" } as const;

const errorText = (error: unknown): string => {
  if (!(error instanceof ApiError)) return "Something went wrong. Try again.";

  return (
    error.errors.action?.[0] ??
    error.errors.remarks?.[0] ??
    error.errors.status?.[0] ??
    error.errors.decision?.[0] ??
    error.message
  );
};

export default function LoanApplicationDetailView({ applicationId }: { applicationId: number }) {
  const router = useRouter();
  const canManage = useAuthorization().can("loan.applications.manage");
  const query = useLoanApplication(applicationId);
  const actions = useLoanApplicationActions(applicationId);

  const [preview, setPreview] = useState<PreviewTarget | null>(null);
  const [dialog, setDialog] = useState<{ kind: "return" | "reject" } | { kind: "document"; document: ApplicationDocument } | null>(null);

  const application = query.data?.data;

  if (query.isPending) return <CircularProgress size={32} />;
  if (!application) return <Alert severity="error">The application could not be loaded.</Alert>;

  const inReview = application.status === "document_review";
  const documents = application.documents ?? [];
  const requirements = application.product?.documents ?? [];

  const run = (action: ApplicationAction, remarks?: string) =>
    actions.transition.mutate(
      { action, remarks },
      {
        onSuccess: () => {
          setDialog(null);
          toast.success("Application updated.");
        },
        onError: (error) => toast.error(errorText(error)),
      },
    );

  const review = (document: ApplicationDocument, status: "accepted" | "rejected", remarks?: string) =>
    actions.reviewDocument.mutate(
      { documentId: document.id, status, remarks },
      {
        onSuccess: () => setDialog(null),
        onError: (error) => toast.error(errorText(error)),
      },
    );

  return (
    <Stack spacing={4}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="h4">{application.reference_no}</Typography>
          <Typography variant="body2" color="text.secondary">
            {application.member?.name} ({application.member?.member_code}) · submitted {formatDateTime(application.submitted_at)}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <ApplicationStatusChip status={application.status} />
          <Button color="secondary" onClick={() => router.push("/loan/applications")}>
            Back to list
          </Button>
        </Stack>
      </Stack>

      {application.status_remarks && <Alert severity="info">Last note: {application.status_remarks}</Alert>}

      {canManage && (
        <Paper className="p-5">
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            {application.status === "submitted" && (
              <Button variant="contained" disabled={actions.transition.isPending} onClick={() => run("start_review")}>
                Start document review
              </Button>
            )}
            {inReview && (
              <>
                <Button variant="contained" color="success" disabled={actions.transition.isPending} onClick={() => run("accept_documents")}>
                  Accept documents
                </Button>
                <Button variant="outlined" color="warning" onClick={() => setDialog({ kind: "return" })}>
                  Return for correction
                </Button>
              </>
            )}
            {(application.status === "submitted" || inReview) && (
              <Button variant="outlined" color="error" onClick={() => setDialog({ kind: "reject" })}>
                Reject application
              </Button>
            )}
            {!["submitted", "document_review", "for_evaluation", "for_approval", "approved", "for_agreement", "for_release"].includes(application.status) && (
              <Typography variant="body2" color="text.secondary">
                No review action is available for this status.
              </Typography>
            )}
          </Stack>
        </Paper>
      )}

      {application.can_evaluate && (
        <EvaluationForm
          application={application}
          pending={actions.evaluate.isPending}
          onSubmit={(payload, onError) =>
            actions.evaluate.mutate(payload, { onSuccess: () => toast.success("Evaluation submitted."), onError })
          }
        />
      )}

      {application.evaluation && <EvaluationSummary evaluation={application.evaluation} />}

      <ApprovalPanel
        application={application}
        pending={actions.decide.isPending}
        onDecide={(payload, onError) =>
          actions.decide.mutate(payload, { onSuccess: () => toast.success("Decision saved."), onError })
        }
      />

      <AgreementPanel application={application} />
      <ReleasePanel application={application} />
      {application.loan && <LoanAccountPanel loan={application.loan} receiptHref={`/loan/applications/${application.id}/receipt`} />}

      <Paper className="p-6">
        <Stack spacing={1}>
          <Typography variant="h6">Loan</Typography>
          <Typography variant="body2">
            {application.product?.name} · {formatPeso(application.amount)} over {application.term_months} months
          </Typography>
          {application.product_snapshot && (
            <Typography variant="body2" color="text.secondary">
              Terms when submitted: {Number(application.product_snapshot.interest_rate)}% a year,{" "}
              {application.product_snapshot.interest_method === "flat" ? "flat" : "diminishing"}
            </Typography>
          )}
          <Typography variant="body2">Purpose: {application.purpose}</Typography>
          {application.monthly_income && <Typography variant="body2">Monthly income: {formatPeso(application.monthly_income)}</Typography>}
          {application.employer_business && <Typography variant="body2">Employer or business: {application.employer_business}</Typography>}
          {application.collateral_description && (
            <Typography variant="body2">
              Collateral: {application.collateral_description}
              {application.collateral_value ? ` (${formatPeso(application.collateral_value)})` : ""}
            </Typography>
          )}
          {application.has_signature && (
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                onClick={() =>
                  setPreview({
                    path: `/api/loan/applications/${application.id}/signature`,
                    filename: `signature-${application.reference_no}.png`,
                  })
                }
              >
                View signature
              </Button>
              <Button
                size="small"
                onClick={() =>
                  downloadFile(`/api/loan/applications/${application.id}/signature`, `signature-${application.reference_no}.png`).catch((e: Error) => toast.error(e.message))
                }
              >
                Download signature
              </Button>
            </Stack>
          )}
        </Stack>
      </Paper>

      <Paper className="p-6">
        <Stack spacing={3}>
          <Typography variant="h6">Documents</Typography>
          {!inReview && canManage && documents.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              Start the document review to accept or reject files.
            </Typography>
          )}
          {requirements.map((requirement) => {
            const document = documents.find((d) => d.requirement === requirement.name);

            return (
              <Stack key={requirement.name} spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography variant="subtitle2">{requirement.name}</Typography>
                  <Chip size="small" variant="tonal" color={requirement.is_required ? "primary" : "default"} label={requirement.is_required ? "Required" : "Optional"} />
                  {document ? (
                    <Chip size="small" variant="tonal" color={docColor[document.status]} label={docLabel[document.status]} />
                  ) : (
                    <Chip size="small" variant="tonal" color="warning" label="Not uploaded" />
                  )}
                </Stack>
                {document && (
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography variant="body2">
                      {document.original_name} ({formatFileSize(document.size)})
                    </Typography>
                    <Button
                      size="small"
                      onClick={() =>
                        setPreview({
                          path: `/api/loan/applications/${application.id}/documents/${document.id}/download`,
                          filename: document.original_name,
                        })
                      }
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      onClick={() =>
                        downloadFile(`/api/loan/applications/${application.id}/documents/${document.id}/download`, document.original_name).catch((e: Error) => toast.error(e.message))
                      }
                    >
                      Download
                    </Button>
                    {canManage && inReview && (
                      <>
                        <Button size="small" color="success" disabled={document.status === "accepted"} onClick={() => review(document, "accepted")}>
                          Accept
                        </Button>
                        <Button size="small" color="error" onClick={() => setDialog({ kind: "document", document })}>
                          Reject
                        </Button>
                      </>
                    )}
                  </Stack>
                )}
                {document?.remarks && <Alert severity="error">{document.remarks}</Alert>}
              </Stack>
            );
          })}
        </Stack>
      </Paper>

      {(application.guarantors?.length ?? 0) > 0 && (
        <Paper className="p-6">
          <Stack spacing={1}>
            <Typography variant="h6">Guarantors</Typography>
            {application.guarantors?.map((g) => (
              <Typography key={g.member_code} variant="body2">
                {g.name} ({g.member_code})
              </Typography>
            ))}
          </Stack>
        </Paper>
      )}

      <Paper className="p-6">
        <Stack spacing={2}>
          <Typography variant="h6">History</Typography>
          <ApplicationTimeline events={application.events ?? []} />
        </Stack>
      </Paper>

      <FilePreviewDialog target={preview} onClose={() => setPreview(null)} />
      <RemarksDialog
        open={dialog?.kind === "return"}
        title="Return for correction"
        label="What should the member fix?"
        confirmLabel="Return to member"
        pending={actions.transition.isPending}
        onClose={() => setDialog(null)}
        onConfirm={(remarks) => run("return", remarks)}
      />
      <RemarksDialog
        open={dialog?.kind === "reject"}
        title="Reject application"
        label="Reason (the member will see this)"
        confirmLabel="Reject"
        pending={actions.transition.isPending}
        onClose={() => setDialog(null)}
        onConfirm={(remarks) => run("reject", remarks)}
      />
      <RemarksDialog
        open={dialog?.kind === "document"}
        title="Reject document"
        label="What is wrong with this file?"
        confirmLabel="Reject document"
        pending={actions.reviewDocument.isPending}
        onClose={() => setDialog(null)}
        onConfirm={(remarks) => dialog?.kind === "document" && review(dialog.document, "rejected", remarks)}
      />
    </Stack>
  );
}
