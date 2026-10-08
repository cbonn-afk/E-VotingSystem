import type { ReactNode } from "react";

import FormControl from "@mui/material/FormControl";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

import CustomTable, {
  type CustomTableColumn,
  type CustomTablePaginationModel,
} from "@components/app/CustomTable";

import type { UserRole } from "../../types";

type RolesTabProps = {
  roles: UserRole[];
  columns: CustomTableColumn<UserRole>[];
  query: string;
  statusFilter: "Active" | "All";
  pagination: CustomTablePaginationModel;
  rowCount: number;
  loading: boolean;
  actions?: ReactNode;
  onQueryChange: (value: string) => void;
  onPaginationChange: (model: CustomTablePaginationModel) => void;
};

const RolesTab = ({
  roles,
  columns,
  query,
  statusFilter,
  pagination,
  rowCount,
  loading,
  actions,
  onQueryChange,
  onPaginationChange,
}: RolesTabProps) => (
  <Stack spacing={4}>
    <Paper className="p-5">
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={3}
        className="items-stretch md:items-center justify-between"
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={3}
          sx={{ flex: 1 }}
        >
          <TextField
            label="Search roles"
            size="small"
            value={query}
            sx={{ minWidth: { md: 280 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <i className="bx bx-search" />
                </InputAdornment>
              ),
            }}
            onChange={(event) => onQueryChange(event.target.value)}
          />
          <FormControl size="small" sx={{ minWidth: 160 }} disabled>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={statusFilter}>
              <MenuItem value="All">All Statuses</MenuItem>
              <MenuItem value="Active">Active</MenuItem>
            </Select>
          </FormControl>
        </Stack>
        {actions}
      </Stack>
    </Paper>

    <Paper sx={{ overflow: "hidden" }}>
      <CustomTable
        rows={roles}
        columns={columns}
        getRowId={(row) => row.id}
        density="compact"
        loading={loading}
        paginationMode="server"
        rowCount={rowCount}
        paginationModel={pagination}
        onPaginationModelChange={onPaginationChange}
        getRowHeight={() => "auto"}
        emptyTitle="No roles found"
        emptyDescription="Adjust the search to find a role."
        sx={{
          minBlockSize: 480,
          p: 0,
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "action.hover",
          },
          "& .MuiDataGrid-cell": { alignItems: "center", py: 2 },
        }}
      />
    </Paper>
  </Stack>
);

export default RolesTab;
