"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import type { ExpenseResource } from "../../api/types";
import { getBillPayeeName } from "../../utils/bills";
import { formatDate, formatPeso } from "../../utils/accountingFormat";

type ReceiptViewerDialogProps = {
  open: boolean;
  bill: ExpenseResource | null;
  onClose: () => void;
};

const formatFileSize = (bytes: number): string => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) => (
  <Stack spacing={0.25}>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography
      variant="body2"
      fontWeight={600}
      sx={{ wordBreak: "break-word" }}
    >
      {value && value.trim() !== "" ? value : "—"}
    </Typography>
  </Stack>
);

const ReceiptViewerDialog = ({
  open,
  bill,
  onClose,
}: ReceiptViewerDialogProps) => {
  const receipt = bill?.receipt ?? null;
  const isImage = receipt?.mimeType?.startsWith("image/") ?? false;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Stack spacing={0.25}>
          <Typography variant="h6">Expense Document</Typography>
          {bill && (
            <Typography variant="caption" color="text.secondary">
              {bill.billReference} · {bill.expenseName}
            </Typography>
          )}
        </Stack>
        <IconButton onClick={onClose} size="small" aria-label="Close">
          <i className="bx bx-x" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={4}
          alignItems="stretch"
        >
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              minHeight: 320,
              display: "grid",
              placeItems: "center",
              bgcolor: "action.hover",
              borderRadius: 1,
              overflow: "hidden",
              p: 2,
            }}
          >
            {receipt && isImage ? (
              <Box
                component="img"
                src={receipt.previewUrl}
                alt={receipt.originalName}
                sx={{
                  width: "100%",
                  maxHeight: "60vh",
                  objectFit: "contain",
                }}
              />
            ) : (
              <Stack alignItems="center" spacing={2} sx={{ p: 4 }}>
                <i className="bx bx-file" style={{ fontSize: 44 }} />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  textAlign="center"
                >
                  {receipt
                    ? "This receipt can't be previewed here. Open it in a new tab to view."
                    : "No receipt attached to this expense."}
                </Typography>
              </Stack>
            )}
          </Box>

          <Stack spacing={2.5} sx={{ width: { xs: "100%", md: 260 } }}>
            <Typography variant="subtitle2" fontWeight={700}>
              Expense Details
            </Typography>
            <DetailRow
              label="Vendor / Payee"
              value={bill ? getBillPayeeName(bill) : null}
            />
            <DetailRow label="Category" value={bill?.category?.label} />
            <DetailRow
              label="Expense Date"
              value={bill ? formatDate(bill.expenseDate) : null}
            />
            <Divider />
            <DetailRow
              label="Total Amount"
              value={bill ? formatPeso(bill.totalAmount) : null}
            />
            <DetailRow
              label="Amount Due"
              value={bill ? formatPeso(bill.outstandingAmount) : null}
            />
            <Divider />
            <DetailRow label="File" value={receipt?.originalName} />
            <DetailRow
              label="Size"
              value={receipt ? formatFileSize(receipt.size) : null}
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Stack direction={"row"} spacing={2} sx={{ mt: 5 }}>
          {receipt && (
            <Button
              component="a"
              href={receipt.previewUrl}
              target="_blank"
              rel="noreferrer"
              variant="outlined"
              startIcon={<i className="bx bx-link-external" />}
            >
              Open in new tab
            </Button>
          )}
          <Button variant="contained" onClick={onClose}>
            Close
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default ReceiptViewerDialog;
