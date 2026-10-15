"use client";

import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";

import CustomTextField from "@core/components/mui/TextField";

import type { AccountTypeValue, RecordStatus } from "../../api/types";
import { ACCOUNT_TYPES } from "./accountsShared";

export type PostingFilter = "" | "1" | "0";

type AccountsToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  type: AccountTypeValue | "";
  onTypeChange: (value: AccountTypeValue | "") => void;
  status: RecordStatus | "";
  onStatusChange: (value: RecordStatus | "") => void;
  posting: PostingFilter;
  onPostingChange: (value: PostingFilter) => void;
  onCreate: () => void;
  canCreate: boolean;
};

// Mirrors partner AccountsTableActions: a Paper with a search field on the left
// and the type/status/posting filters + the "New Account" button on the right.
const AccountsToolbar = ({
  search,
  onSearchChange,
  type,
  onTypeChange,
  status,
  onStatusChange,
  posting,
  onPostingChange,
  onCreate,
  canCreate,
}: AccountsToolbarProps) => (
  <Paper sx={{ p: 5 }}>
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={3}
      justifyContent="space-between"
      alignItems={{ xs: "stretch", md: "center" }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <i className="bx-search" style={{ fontSize: 24 }} />
        <CustomTextField
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search an account"
          sx={{ width: { xs: "100%", md: 300 } }}
        />
      </Stack>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", sm: "center" }}
      >
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Type</InputLabel>
          <Select
            label="Type"
            value={type}
            onChange={(event) =>
              onTypeChange(event.target.value as AccountTypeValue | "")
            }
          >
            <MenuItem value="">All types</MenuItem>
            {ACCOUNT_TYPES.map((option) => (
              <MenuItem key={option} value={option} className="capitalize">
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            label="Status"
            value={status}
            onChange={(event) =>
              onStatusChange(event.target.value as RecordStatus | "")
            }
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Posting</InputLabel>
          <Select
            label="Posting"
            value={posting}
            onChange={(event) =>
              onPostingChange(event.target.value as PostingFilter)
            }
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="1">Posting</MenuItem>
            <MenuItem value="0">Non-posting</MenuItem>
          </Select>
        </FormControl>
        {canCreate && (
          <Button
            variant="contained"
            onClick={onCreate}
            startIcon={<i className="bx-plus" />}
          >
            New Account
          </Button>
        )}
      </Stack>
    </Stack>
  </Paper>
);

export default AccountsToolbar;
