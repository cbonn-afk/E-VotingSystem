import Chip from "@mui/material/Chip";

const labels: Record<string, string> = {
  unpaid: "Unpaid",
  partially_paid: "Partially Paid",
  paid: "Paid",
  draft: "Draft",
  posted: "Confirmed",
  void: "Voided",
  active: "Active",
  inactive: "Inactive",
};

const colors: Record<
  string,
  "default" | "warning" | "info" | "success" | "error" | "secondary"
> = {
  unpaid: "warning",
  partially_paid: "info",
  paid: "success",
  draft: "secondary",
  posted: "success",
  void: "error",
  active: "success",
  inactive: "default",
};

export default function AccountingStatusChip({ status }: { status: string }) {
  return (
    <Chip
      size="small"
      variant="tonal"
      color={colors[status] ?? "default"}
      label={labels[status] ?? status}
    />
  );
}
