// "use client";

// import Alert from "@mui/material/Alert";
// import Button from "@mui/material/Button";
// import Chip from "@mui/material/Chip";
// import Stack from "@mui/material/Stack";
// import Typography from "@mui/material/Typography";
// import { useState } from "react";

// import { toast } from "react-toastify";

// import type { ApplicationDocument, LoanApplication } from "../types";
// import { downloadFile, formatFileSize } from "../utils/downloadFile";
// import FilePreviewDialog, { type PreviewTarget } from "./FilePreviewDialog";

// type Props = {
//   application: LoanApplication;
//   uploading: boolean;
//   onUpload: (requirement: string, file: File) => void;
//   onRemove: (documentId: number) => void;
// };

// const statusColor = { pending: "default", accepted: "success", rejected: "error" } as const;
// const statusLabel = { pending: "Not reviewed yet", accepted: "Accepted", rejected: "Rejected" } as const;

// export default function MemberApplicationDocuments({ application, uploading, onUpload, onRemove }: Props) {
//   const [preview, setPreview] = useState<PreviewTarget | null>(null);
//   const requirements = application.product?.documents ?? [];
//   const uploaded = new Map<string, ApplicationDocument>((application.documents ?? []).map((d) => [d.requirement, d]));

//   if (requirements.length === 0) {
//     return <Typography variant="body2">This loan does not need any documents.</Typography>;
//   }

//   return (
//     <Stack spacing={3}>
//       {requirements.map((requirement) => {
//         const document = uploaded.get(requirement.name);

//         return (
//           <Stack key={requirement.name} spacing={1}>
//             <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
//               <Typography variant="subtitle2">{requirement.name}</Typography>
//               <Chip size="small" variant="tonal" color={requirement.is_required ? "primary" : "default"} label={requirement.is_required ? "Required" : "Optional"} />
//               {document && <Chip size="small" variant="tonal" color={statusColor[document.status]} label={statusLabel[document.status]} />}
//             </Stack>

//             {document?.status === "rejected" && document.remarks && <Alert severity="error">{document.remarks}</Alert>}

//             {document && (
//               <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
//                 <Typography variant="body2">
//                   {document.original_name} ({formatFileSize(document.size)})
//                 </Typography>
//                 <Button
//                   size="small"
//                   onClick={() =>
//                     setPreview({
//                       path: `/api/loan-portal/applications/${application.id}/documents/${document.id}/download`,
//                       filename: document.original_name,
//                     })
//                   }
//                 >
//                   View
//                 </Button>
//                 <Button
//                   size="small"
//                   onClick={() =>
//                     downloadFile(
//                       `/api/loan-portal/applications/${application.id}/documents/${document.id}/download`,
//                       document.original_name,
//                     ).catch((e: Error) => toast.error(e.message))
//                   }
//                 >
//                   Download
//                 </Button>
//                 {application.editable && (
//                   <Button size="small" color="error" onClick={() => onRemove(document.id)}>
//                     Remove
//                   </Button>
//                 )}
//               </Stack>
//             )}

//             {application.editable && (
//               <Button variant="outlined" size="small" component="label" disabled={uploading} sx={{ alignSelf: "flex-start" }}>
//                 {document ? "Replace file" : "Upload file"}
//                 <input
//                   hidden
//                   type="file"
//                   accept=".pdf,.jpg,.jpeg,.png"
//                   onChange={(event) => {
//                     const file = event.target.files?.[0];

//                     event.target.value = "";
//                     if (file) onUpload(requirement.name, file);
//                   }}
//                 />
//               </Button>
//             )}
//           </Stack>
//         );
//       })}
//       {application.editable && <Typography variant="caption" color="text.secondary">PDF, JPG or PNG, up to 5 MB each.</Typography>}
//       <FilePreviewDialog target={preview} onClose={() => setPreview(null)} />
//     </Stack>
//   );
// }
