// "use client";

// import { useState } from "react";

// import Alert from "@mui/material/Alert";
// import Box from "@mui/material/Box";
// import Button from "@mui/material/Button";
// import Checkbox from "@mui/material/Checkbox";
// import FormControlLabel from "@mui/material/FormControlLabel";
// import Paper from "@mui/material/Paper";
// import Stack from "@mui/material/Stack";
// import Typography from "@mui/material/Typography";
// import { toast } from "react-toastify";

// import { ApiError } from "@/libs/api/apiError";

// import { usePortalApplicationActions } from "../portal/usePortalApplications";
// import type { LoanApplication } from "../types";
// import { formatDate, formatPeso, frequencyLabel } from "../utils/applicationStatus";
// import ScheduleTable from "./ScheduleTable";
// import SignaturePad from "./SignaturePad";

// /** The member reads the agreement and accepts it. A drawn signature is asked for only when the cooperative requires one. */
// export default function MemberAgreementPanel({ application }: { application: LoanApplication }) {
//   const actions = usePortalApplicationActions(application.id);
//   const agreement = application.agreement;
//   const [agreed, setAgreed] = useState(false);
//   const [signature, setSignature] = useState<string | null>(null);
//   const [error, setError] = useState<string | null>(null);

//   if (!agreement) return null;

//   const waiting = application.status === "for_agreement";
//   const fees = Number(agreement.processing_fee) + Number(agreement.service_fee);
//   const needsSignature = agreement.signature_required;

//   const accept = () => {
//     setError(null);
//     if (needsSignature && !signature) {
//       setError("Draw your signature and press Save signature first.");

//       return;
//     }

//     actions.acceptAgreement.mutate(signature, {
//       onSuccess: () => toast.success("You accepted the agreement."),
//       onError: (e) => setError(e instanceof ApiError ? (e.errors.signature?.[0] ?? e.errors.agreed?.[0] ?? e.errors.status?.[0] ?? e.message) : "The agreement could not be accepted."),
//     });
//   };

//   return (
//     <Paper className="p-6">
//       <Stack spacing={3}>
//         <Typography variant="h6">Loan agreement</Typography>

//         <Stack spacing={0.5}>
//           <Typography variant="body2">
//             Loan {formatPeso(agreement.principal)} at {Number(agreement.interest_rate)}% a year · {agreement.installments_count} {frequencyLabel[agreement.payment_frequency].toLowerCase()} payments of{" "}
//             <strong>{formatPeso(agreement.installment_amount)}</strong>
//           </Typography>
//           <Typography variant="body2">
//             Fees {formatPeso(fees)} · you will receive <strong>{formatPeso(agreement.net_proceeds)}</strong>
//             {agreement.fee_handling === "collect_separately" && fees > 0 ? " and pay the fees separately" : " after fees"}
//           </Typography>
//           <Typography variant="body2">
//             First payment {formatDate(agreement.first_due_date)} · final payment {formatDate(agreement.maturity_date)}
//           </Typography>
//         </Stack>

//         <Button variant="outlined" href={`/loan-portal/applications/${application.id}/agreement`} target="_blank" rel="noopener" sx={{ alignSelf: "flex-start" }}>
//           Open the full agreement (print or save as PDF)
//         </Button>

//         <Typography variant="subtitle2">Payment schedule</Typography>
//         <ScheduleTable items={agreement.schedule} />

//         <Typography variant="subtitle2">Terms and conditions</Typography>
//         <Box sx={{ maxHeight: 220, overflow: "auto", border: 1, borderColor: "divider", borderRadius: 1, p: 2 }}>
//           <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
//             {agreement.terms_text}
//           </Typography>
//         </Box>

//         {waiting ? (
//           <Stack spacing={2}>
//             {error && <Alert severity="error">{error}</Alert>}
//             {needsSignature && (
//               <>
//                 <Typography variant="subtitle2">Your signature</Typography>
//                 <SignaturePad onSave={(dataUrl) => { setSignature(dataUrl); toast.success("Signature ready."); }} />
//               </>
//             )}
//             <FormControlLabel
//               label="I have read the agreement and I accept its terms."
//               control={<Checkbox checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />}
//             />
//             <Button variant="contained" disabled={!agreed || actions.acceptAgreement.isPending} sx={{ alignSelf: "flex-start" }} onClick={accept}>
//               Accept agreement
//             </Button>
//           </Stack>
//         ) : (
//           <Alert severity="success">
//             You accepted this agreement. The cooperative will release your loan and give you a receipt.
//           </Alert>
//         )}
//       </Stack>
//     </Paper>
//   );
// }
