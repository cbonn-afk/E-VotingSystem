// MUI Imports
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

// Component Imports
import type { CustomTableColumn } from "@components/app/CustomTable";
import EmployeeTableActions from "./EmployeeTableActions";
import { CellBox, TableAvatar, renderStatusChip } from "../shared/statusUtils";

// Type Imports
import type { Employee } from "../../types";

const InfoCell = ({ icon, value }: { icon: string; value: string }) => (
  <CellBox>
    <Stack direction="row" spacing={1} alignItems="center">
      <Box
        component="i"
        className={`bx ${icon}`}
        sx={{ color: "text.secondary", fontSize: "1.05rem" }}
      />
      <Typography variant="body2">{value || "—"}</Typography>
    </Stack>
  </CellBox>
);

export const getEmployeeTableColumns = (actions: {
  onView: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onDeactivate: (employee: Employee) => void;
  onViewAttendance: (employee: Employee) => void;
  onViewPayroll: (employee: Employee) => void;
  canManage?: boolean;
}): CustomTableColumn<Employee>[] => [
  {
    id: "employeeId",
    label: "Employee ID",
    sortable: true,
    minWidth: 150,
    flex: 0.9,
    render: (row) => (
      <CellBox>
        <Typography
          sx={{ fontFamily: "monospace", fontSize: "0.82rem", fontWeight: 600 }}
        >
          {row.employeeId}
        </Typography>
      </CellBox>
    ),
  },
  {
    id: "fullName",
    label: "Full Name",
    sortable: true,
    minWidth: 230,
    flex: 1.5,
    render: (row) => (
      <CellBox>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <TableAvatar name={row.fullName} />
        </Stack>
      </CellBox>
    ),
  },
  {
    id: "position",
    label: "Employee Type",
    sortable: true,
    minWidth: 180,
    flex: 1,
    render: (row) => (
      <CellBox>
        <Typography variant="body2" fontWeight={600}>
          {row.position || "—"}
        </Typography>
      </CellBox>
    ),
  },
  {
    id: "employmentType",
    label: "Employment Type",
    sortable: true,
    minWidth: 160,
    flex: 0.9,
    render: (row) => (
      <CellBox>
        <Typography variant="body2" color="text.secondary">
          {row.employmentType || "—"}
        </Typography>
      </CellBox>
    ),
  },
  {
    id: "contactNumber",
    label: "Contact Number",
    minWidth: 170,
    flex: 1,
    render: (row) => <InfoCell icon="bx-phone" value={row.contactNumber} />,
  },
  {
    id: "email",
    label: "Email",
    minWidth: 220,
    flex: 1.2,
    render: (row) => <InfoCell icon="bx-envelope" value={row.email} />,
  },
  {
    id: "status",
    label: "Status",
    sortable: true,
    align: "center",
    minWidth: 130,
    flex: 0.8,
    render: (row) => (
      <CellBox justify="center">{renderStatusChip(row.status)}</CellBox>
    ),
  },
  {
    id: "dateHired",
    label: "Date Hired",
    sortable: true,
    minWidth: 150,
    flex: 0.9,
    render: (row) => <InfoCell icon="bx-calendar" value={row.dateHired} />,
  },
  {
    id: "actions",
    label: "Actions",
    align: "center",
    minWidth: 120,
    flex: 0.6,
    render: (row) => (
      <CellBox justify="center">
        <EmployeeTableActions employee={row} {...actions} />
      </CellBox>
    ),
  },
];
