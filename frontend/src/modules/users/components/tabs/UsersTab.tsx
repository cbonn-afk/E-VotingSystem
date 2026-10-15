import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
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
  type CustomTableSortModel,
} from "@components/app/CustomTable";

import type { UserAccount, UserAccountStatus, UserRole } from "../../types";

type UsersTabProps = {
  users: UserAccount[];
  roles: UserRole[];
  columns: CustomTableColumn<UserAccount>[];
  query: string;
  roleFilter: number | "All";
  moduleFilter: string;
  statusFilter: UserAccountStatus | "All";
  pagination: CustomTablePaginationModel;
  sort: CustomTableSortModel;
  rowCount: number;
  loading: boolean;
  onQueryChange: (value: string) => void;
  onRoleFilterChange: (value: number | "All") => void;
  onStatusFilterChange: (value: UserAccountStatus | "All") => void;
  onPaginationChange: (model: CustomTablePaginationModel) => void;
  onSortChange: (model: CustomTableSortModel) => void;
  onClearFilters: () => void;
};

const UsersTab = ({
  users,
  roles,
  columns,
  query,
  roleFilter,
  moduleFilter,
  statusFilter,
  pagination,
  sort,
  rowCount,
  loading,
  onQueryChange,
  onRoleFilterChange,
  onStatusFilterChange,
  onPaginationChange,
  onSortChange,
  onClearFilters,
}: UsersTabProps) => (
  <Stack spacing={4}>
    <Paper className="p-5">
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            xl: "minmax(260px, 2fr) repeat(3, minmax(150px, 1fr)) auto",
          },
          gap: 3,
          alignItems: "center",
        }}
      >
        <TextField
          label="Search users"
          size="small"
          value={query}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <i className="bx bx-search" />
              </InputAdornment>
            ),
          }}
          onChange={(event) => onQueryChange(event.target.value)}
        />
        <FormControl size="small">
          <InputLabel>Role</InputLabel>
          <Select
            label="Role"
            value={roleFilter}
            onChange={(event) =>
              onRoleFilterChange(event.target.value as number | "All")
            }
          >
            <MenuItem value="All">All Roles</MenuItem>
            {roles.map((role) => (
              <MenuItem key={role.id} value={role.id}>
                {role.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" disabled>
          <InputLabel>Module</InputLabel>
          <Select label="Module" value={moduleFilter}>
            <MenuItem value="All">All Modules</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small">
          <InputLabel>Status</InputLabel>
          <Select
            label="Status"
            value={statusFilter}
            onChange={(event) =>
              onStatusFilterChange(
                event.target.value as UserAccountStatus | "All",
              )
            }
          >
            <MenuItem value="All">All Statuses</MenuItem>
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Inactive">Inactive</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="text"
          startIcon={<i className="bx bx-reset" />}
          onClick={onClearFilters}
        >
          Clear Filters
        </Button>
      </Box>
    </Paper>

    <Paper sx={{ overflow: "hidden" }}>
      <CustomTable
        rows={users}
        columns={columns}
        getRowId={(row) => row.id}
        density="compact"
        loading={loading}
        paginationMode="server"
        sortingMode="server"
        rowCount={rowCount}
        paginationModel={pagination}
        onPaginationModelChange={onPaginationChange}
        sortModel={sort}
        onSortModelChange={onSortChange}
        getRowHeight={() => "auto"}
        emptyTitle="No users found"
        emptyDescription="Adjust the filters or add a new user account."
        sx={{
          minBlockSize: 520,
          p: 0,
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "action.hover",
          },
          "& .MuiDataGrid-cell": { alignItems: "center", py: 2 },
          "& .MuiDataGrid-columnHeader:last-of-type .MuiDataGrid-columnHeaderTitle":
            {
              display: "none",
            },
        }}
      />
    </Paper>
  </Stack>
);

export default UsersTab;
