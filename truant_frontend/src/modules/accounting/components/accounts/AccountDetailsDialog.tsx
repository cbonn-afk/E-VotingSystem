"use client";

import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import CustomDialog from "@components/app/CustomDialog";

import type { AccountResource } from "../../api/types";
import { ACCOUNT_TYPE_COLOR } from "./accountsShared";

type AccountDetailsDialogProps = {
  account: AccountResource | null;
  open: boolean;
  onClose: () => void;
};

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <Stack
    direction="row"
    spacing={2}
    sx={{ justifyContent: "space-between", alignItems: "center" }}
  >
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
      {children}
    </Stack>
  </Stack>
);

const AccountDetailsDialog = ({
  account,
  open,
  onClose,
}: AccountDetailsDialogProps) => (
  <CustomDialog
    open={open}
    onClose={onClose}
    closeAfterTransition
    width="520px"
    title="Account Details"
    icon={<i className="bx bx-list-ul text-primary" />}
    description={account ? `${account.code} — ${account.name}` : ""}
    actions={
      <Button variant="outlined" color="secondary" onClick={onClose}>
        Close
      </Button>
    }
  >
    {account && (
      <Stack spacing={2.5} sx={{ mt: 3 }}>
        <Row label="Code">
          <Typography variant="body2" fontWeight={600}>
            {account.code}
          </Typography>
        </Row>
        <Row label="Name">
          <Typography variant="body2">{account.name}</Typography>
        </Row>
        <Divider />
        <Row label="Type">
          <Chip
            label={account.type}
            color={ACCOUNT_TYPE_COLOR[account.type]}
            variant="tonal"
            size="small"
            className="capitalize"
          />
        </Row>
        <Row label="Normal balance">
          <Typography variant="body2" className="capitalize">
            {account.normalBalance}
          </Typography>
        </Row>
        <Row label="Posting">
          <Chip
            label={account.isPosting ? "Posting" : "Non-posting folder"}
            color={account.isPosting ? "info" : "secondary"}
            variant="tonal"
            size="small"
          />
        </Row>
        <Row label="Contra account">
          <Typography variant="body2">
            {account.isContra ? "Yes" : "No"}
          </Typography>
        </Row>
        <Row label="Source">
          {account.isSystem ? (
            <Chip
              label="Built-in"
              color="secondary"
              variant="tonal"
              size="small"
              icon={<i className="bx-lock-alt" />}
            />
          ) : (
            <Chip
              label="Custom"
              color="info"
              variant="tonal"
              size="small"
              icon={<i className="bx-user" />}
            />
          )}
        </Row>
        <Row label="Status">
          <Chip
            label={account.status}
            color={account.status === "active" ? "success" : "secondary"}
            variant="tonal"
            size="small"
            className="capitalize"
          />
        </Row>
        <Divider />
        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            Description
          </Typography>
          <Typography variant="body2">
            {account.description || "—"}
          </Typography>
        </Stack>
      </Stack>
    )}
  </CustomDialog>
);

export default AccountDetailsDialog;
