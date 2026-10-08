import Chip from "@mui/material/Chip";

type ChipColor = "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning";

const colors: Record<string, ChipColor> = {
  draft: "secondary",
  registration: "info",
  voting: "warning",
  closed: "success",
  good_standing: "success",
  delinquent: "error",
};

const labels: Record<string, string> = {
  draft: "Draft",
  registration: "Registration",
  voting: "Voting",
  closed: "Closed",
  good_standing: "Good standing",
  delinquent: "Delinquent",
};

const ElectionStatusChip = ({ status }: { status: string }) => (
  <Chip
    size="small"
    variant="tonal"
    color={colors[status] ?? "default"}
    label={labels[status] ?? status}
  />
);

export default ElectionStatusChip;
