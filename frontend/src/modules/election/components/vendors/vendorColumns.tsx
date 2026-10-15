import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import type { CustomTableColumn } from "@components/app/CustomTable";
import Link from "@components/Link";

import type { VendorResource } from "../../api/types";
import { formatPeso } from "../../utils/accountingFormat";
import AccountingStatusChip from "../shared/AccountingStatusChip";

type VendorColumnActions = {
  canDelete: boolean;
  canEdit: boolean;
  canToggleStatus: boolean;
  onDelete: (vendor: VendorResource) => void;
  onEdit: (vendor: VendorResource) => void;
  onToggleStatus: (vendor: VendorResource) => void;
};

export const getVendorColumns = ({
  canDelete,
  canEdit,
  canToggleStatus,
  onDelete,
  onEdit,
  onToggleStatus,
}: VendorColumnActions): CustomTableColumn<VendorResource>[] => [
  {
    id: "vendorNo",
    label: "Vendor No.",
    width: 125,
    render: (vendor) => (
      <Typography
        component={Link}
        href={`/accounting/vendors/${vendor.id}`}
        color="primary.main"
        fontWeight={600}
      >
        {vendor.vendorNo}
      </Typography>
    ),
  },
  {
    id: "name",
    label: "Vendor Name",
    minWidth: 190,
    flex: 1.2,
    render: (vendor) => (
      <Stack>
        <Typography fontWeight={600}>{vendor.name}</Typography>
        <Typography variant="caption" color="text.secondary">
          {vendor.legalName || vendor.tin || ""}
        </Typography>
      </Stack>
    ),
  },
  {
    id: "contact",
    label: "Contact",
    minWidth: 180,
    flex: 1.05,
    render: (vendor) => (
      <Stack>
        <Typography variant="body2">{vendor.contactPerson || "—"}</Typography>
        <Typography variant="caption" color="text.secondary">
          {vendor.email || vendor.phone || ""}
        </Typography>
      </Stack>
    ),
  },
  {
    id: "payableAccount",
    label: "Payable Account",
    minWidth: 160,
    flex: 1,
    render: (vendor) =>
      vendor.defaultPayableAccount
        ? `${vendor.defaultPayableAccount.code} · ${vendor.defaultPayableAccount.name}`
        : "Category default",
  },
  {
    id: "openBills",
    label: "Open Expenses",
    width: 105,
    align: "right",
    value: (vendor) => vendor.openBills,
  },
  {
    id: "totalPaid",
    label: "Total Paid",
    width: 125,
    align: "right",
    render: (vendor) => formatPeso(vendor.totalPaid),
  },
  {
    id: "totalOutstanding",
    label: "Outstanding",
    width: 135,
    align: "right",
    render: (vendor) => (
      <Typography fontWeight={700}>
        {formatPeso(vendor.totalOutstanding)}
      </Typography>
    ),
  },
  {
    id: "status",
    label: "Status",
    width: 100,
    render: (vendor) => <AccountingStatusChip status={vendor.status} />,
  },
  {
    id: "actions",
    label: "Actions",
    width: 150,
    align: "right",
    render: (vendor) => (
      <Stack
        direction="row"
        justifyContent="flex-end"
        alignItems="center"
        sx={{
          inlineSize: "100%",
          "& .MuiIconButton-root": { inlineSize: 32, blockSize: 32 },
        }}
      >
        <Tooltip title="View">
          <IconButton
            component={Link}
            href={`/accounting/vendors/${vendor.id}`}
            size="small"
          >
            <i className="bx bx-show" />
          </IconButton>
        </Tooltip>
        {canEdit && (
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => onEdit(vendor)}>
              <i className="bx bx-edit" />
            </IconButton>
          </Tooltip>
        )}
        {canToggleStatus && (
          <Tooltip
            title={vendor.status === "active" ? "Deactivate" : "Activate"}
          >
            <IconButton
              size="small"
              color={vendor.status === "active" ? "warning" : "success"}
              onClick={() => onToggleStatus(vendor)}
            >
              <i
                className={
                  vendor.status === "active"
                    ? "bx bx-user-x"
                    : "bx bx-user-check"
                }
              />
            </IconButton>
          </Tooltip>
        )}
        {canDelete && (
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={() => onDelete(vendor)}
            >
              <i className="bx bx-trash" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    ),
  },
];
