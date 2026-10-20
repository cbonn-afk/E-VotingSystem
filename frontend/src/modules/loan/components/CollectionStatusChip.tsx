import Chip from "@mui/material/Chip";

import type { CollectionStatus } from "../types";
import { collectionStatusColor, collectionStatusLabel, memberCollectionLabel } from "../utils/applicationStatus";

/** The overdue label. Members see any late state simply as "Overdue". */
export default function CollectionStatusChip({ status, forMember = false }: { status: CollectionStatus; forMember?: boolean }) {
  const shown = forMember && ["delinquent", "default"].includes(status) ? "overdue" : status;

  return (
    <Chip
      size="small"
      variant="tonal"
      color={collectionStatusColor[shown]}
      label={forMember ? memberCollectionLabel(status) : collectionStatusLabel[status]}
    />
  );
}
