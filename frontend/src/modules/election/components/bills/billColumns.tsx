import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import type { CustomTableColumn } from "@components/app/CustomTable";
import Link from "@components/Link";

import type { ExpenseResource } from "../../api/types";
import { formatDate, formatPeso } from "../../utils/accountingFormat";
import { getBillPayeeName } from "../../utils/bills";
import { getExpenseCategoryPresentation } from "../../utils/expenseCategoryPresentation";
import AccountingStatusChip from "../shared/AccountingStatusChip";

type BillColumnActions = {
  canEdit: boolean;
  canPost: boolean;
  canRecordPayment: boolean;
  canVoid: boolean;
  canDelete: boolean;
  onPost: (bill: ExpenseResource) => void;
  onRecordPayment: (bill: ExpenseResource) => void;
  onVoid: (bill: ExpenseResource) => void;
  onDelete: (bill: ExpenseResource) => void;
  onViewReceipt: (bill: ExpenseResource) => void;
};

export const getBillColumns = ({
  canEdit,
  canPost,
  canRecordPayment,
  canVoid,
  canDelete,
  onPost,
  onRecordPayment,
  onVoid,
  onDelete,
  onViewReceipt,
}: BillColumnActions): CustomTableColumn<ExpenseResource>[] => [
  {
    id: "bill_date",
    label: "Expense",
    minWidth: 175,
    flex: 1.35,
    sortable: true,
    render: (bill) => {
      const presentation = getExpenseCategoryPresentation(
        bill.category?.slug ?? "",
      );

      return (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              display: "grid",
              placeItems: "center",
              flex: "0 0 auto",
              width: 34,
              height: 34,
              borderRadius: 1,
              color: "primary.main",
              bgcolor: "primary.lighterOpacity",
              fontSize: 19,
            }}
          >
            <i className={presentation.icon} />
          </Box>
          <Stack minWidth={0}>
            <Typography
              component={Link}
              href={`/accounting/expenses/${bill.id}`}
              color="primary.main"
              fontWeight={600}
              noWrap
            >
              {bill.expenseName}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {bill.billReference}
            </Typography>
          </Stack>
        </Stack>
      );
    },
  },
  {
    id: "expenseDate",
    label: "Expense Date",
    width: 118,
    render: (bill) => formatDate(bill.expenseDate),
  },
  {
    id: "vendor",
    label: "Vendor",
    minWidth: 165,
    flex: 1.15,
    sortable: true,
    render: (bill) =>
      bill.vendor ? (
        <Typography
          component={Link}
          href={`/accounting/vendors/${bill.vendor.id}`}
          color="primary.main"
          fontWeight={600}
        >
          {getBillPayeeName(bill)}
        </Typography>
      ) : (
        <Typography variant="body2" fontWeight={500}>
          {getBillPayeeName(bill)}
        </Typography>
      ),
  },
  {
    id: "category",
    label: "Category",
    minWidth: 145,
    flex: 0.9,
    render: (bill) => bill.category?.label ?? "—",
  },
  {
    id: "total",
    label: "Total",
    width: 118,
    align: "right",
    sortable: true,
    render: (bill) => formatPeso(bill.totalAmount),
  },
  {
    id: "paid",
    label: "Paid",
    width: 118,
    align: "right",
    render: (bill) => formatPeso(bill.paidAmount),
  },
  {
    id: "outstanding",
    label: "Amount Due",
    width: 140,
    align: "right",
    sortable: true,
    render: (bill) => (
      <Stack
        spacing={0.25}
        alignItems="flex-end"
        justifyContent="center"
        sx={{ inlineSize: "100%", blockSize: "100%" }}
      >
        <Typography variant="body2" fontWeight={700} lineHeight={1.2}>
          {formatPeso(bill.outstandingAmount)}
        </Typography>
        <Typography variant="caption" color="text.secondary" lineHeight={1.2}>
          {bill.paidAmount > 0
            ? `${Math.round((bill.paidAmount / bill.totalAmount) * 100)}% paid`
            : "Outstanding"}
        </Typography>
      </Stack>
    ),
  },
  {
    id: "paymentStatus",
    label: "Payment Status",
    width: 138,
    render: (bill) => <AccountingStatusChip status={bill.paymentStatus} />,
  },
  {
    id: "status",
    label: "Expense Status",
    width: 105,
    render: (bill) => <AccountingStatusChip status={bill.status} />,
  },
  {
    id: "actions",
    label: "Actions",
    minWidth: 190,
    flex: 1,
    align: "right",
    sortable: false,
    render: (bill) => (
      <Stack
        direction="row"
        spacing={0.125}
        alignItems="center"
        sx={{
          inlineSize: "100%",
          blockSize: "100%",
          justifyContent: "flex-end",
          "& .MuiIconButton-root": { inlineSize: 32, blockSize: 32 },
        }}
      >
        <Tooltip title="View">
          <IconButton
            component={Link}
            href={`/accounting/expenses/${bill.id}`}
            size="small"
          >
            <i className="bx bx-show" />
          </IconButton>
        </Tooltip>
        {bill.status === "draft" && canEdit && (
          <Tooltip title="Edit draft">
            <IconButton
              component={Link}
              href={`/accounting/expenses/${bill.id}/edit`}
              size="small"
            >
              <i className="bx bx-edit" />
            </IconButton>
          </Tooltip>
        )}
        {bill.status === "draft" && canPost && (
          <Tooltip title="Post draft">
            <IconButton size="small" onClick={() => onPost(bill)}>
              <i className="bx bx-check-circle" />
            </IconButton>
          </Tooltip>
        )}
        {bill.status === "draft" && canDelete && (
          <Tooltip title="Delete draft">
            <IconButton
              size="small"
              color="error"
              onClick={() => onDelete(bill)}
            >
              <i className="bx bx-trash" />
            </IconButton>
          </Tooltip>
        )}
        {bill.status === "posted" &&
          bill.outstandingAmount > 0 &&
          canRecordPayment && (
            <Tooltip title="Record payment">
              <IconButton
                size="small"
                color="primary"
                onClick={() => onRecordPayment(bill)}
              >
                <i className="bx bx-wallet" />
              </IconButton>
            </Tooltip>
          )}
        {(bill.documents?.length ?? 0) > 0 && (
          <Tooltip title="View documents">
            <IconButton size="small" onClick={() => onViewReceipt(bill)}>
              <i className="bx bx-image" />
            </IconButton>
          </Tooltip>
        )}
        {bill.recognitionJournalEntryId && (
          <Tooltip title="Open journal">
            <IconButton
              size="small"
              component={Link}
              href={`/accounting/journals/${bill.recognitionJournalEntryId}`}
            >
              <i className="bx bx-book-open" />
            </IconButton>
          </Tooltip>
        )}
        {bill.status === "posted" && canVoid && (
          <Tooltip title="Void expense">
            <IconButton size="small" color="error" onClick={() => onVoid(bill)}>
              <i className="bx bx-block" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    ),
  },
];
