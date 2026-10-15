import Chip from "@mui/material/Chip";

import type { ApplicationStatus } from "../types";
import { applicationStatusColor, applicationStatusLabel } from "../utils/applicationStatus";

export default function ApplicationStatusChip({ status }: { status: ApplicationStatus }) {
  return <Chip size="small" variant="tonal" color={applicationStatusColor[status]} label={applicationStatusLabel[status]} />;
}
