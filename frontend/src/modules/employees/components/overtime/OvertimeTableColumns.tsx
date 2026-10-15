import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import type { CustomTableColumn } from "@components/app/CustomTable";
import type { OvertimeResource, OvertimeStatus } from "../../api/types";
import {
  CellBox,
  formatCurrency,
  renderStatusChip,
  TableAvatar,
} from "../shared/statusUtils";

type OvertimeDecisionStatus = Exclude<OvertimeStatus, "Pending">;

type OvertimeTableColumnActions = {
  canApprove: boolean;
  isSaving: boolean;
  onDecision: (row: OvertimeResource, status: OvertimeDecisionStatus) => void;
};

export const getOvertimeTableColumns = ({
  canApprove,
  isSaving,
  onDecision,
}: OvertimeTableColumnActions): CustomTableColumn<OvertimeResource>[] => [
  {
    id: "employeeName",
    label: "Employee",
    minWidth: 190,
    flex: 1.1,
    render: (row) => (
      <CellBox>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <TableAvatar
            name={row.employee?.fullName ?? row.employeeName ?? "—"}
          />
          <Stack sx={{ minWidth: 0 }}>
            <Typography fontWeight={650} noWrap>
              {row.employee?.fullName ?? row.employeeName ?? "—"}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {row.employee?.employeeNo ?? row.employeeName ?? "—"}
            </Typography>
          </Stack>
        </Stack>
      </CellBox>
    ),
  },
  {
    id: "workDate",
    label: "Date",
    minWidth: 125,
    render: (row) => (
      <CellBox>
        <Stack direction="row" spacing={0.75} alignItems="center">
          <i className="bx bx-calendar" style={{ fontSize: 17 }} />
          <Typography
            variant="body2"
            sx={{ fontVariantNumeric: "tabular-nums" }}
          >
            {row.workDate}
          </Typography>
        </Stack>
      </CellBox>
    ),
  },
  {
    id: "hours",
    label: "Hours",
    align: "right",
    minWidth: 100,
    render: (row) => (
      <CellBox justify="flex-end">
        <Stack direction="row" spacing={0.75} alignItems="center">
          <i className="bx bx-time-five" style={{ fontSize: 17 }} />
          <Typography
            variant="body2"
            sx={{ fontVariantNumeric: "tabular-nums" }}
          >
            {row.hours}h
          </Typography>
        </Stack>
      </CellBox>
    ),
  },
  {
    id: "amount",
    label: "Amount",
    align: "right",
    minWidth: 130,
    render: (row) => (
      <CellBox justify="flex-end">
        <Stack direction="row" spacing={0.75} alignItems="center">
          <i className="bx bx-money" style={{ fontSize: 17 }} />
          <Typography
            fontWeight={650}
            sx={{ fontVariantNumeric: "tabular-nums" }}
          >
            {formatCurrency(row.amount ?? 0)}
          </Typography>
        </Stack>
      </CellBox>
    ),
  },
  {
    id: "source",
    label: "Source",
    minWidth: 180,
    render: (row) =>
      row.isAttendanceCandidate ? (
        <Chip
          size="small"
          variant="tonal"
          color="info"
          icon={<i className="bx bx-transfer-alt" />}
          label="Attendance Candidate"
        />
      ) : (
        <Chip
          size="small"
          variant="tonal"
          color="default"
          icon={<i className="bx bx-edit-alt" />}
          label={row.source}
        />
      ),
  },
  {
    id: "status",
    label: "Status",
    minWidth: 160,
    align: "center",
    render: (row) => (
      <CellBox justify="center">
        <Stack
          direction="row"
          spacing={0.75}
          alignItems="center"
          justifyContent="center"
        >
          <i
            className={
              row.status === "Pending"
                ? "bx bx-time-five"
                : row.status === "Approved"
                  ? "bx bx-check-circle"
                  : "bx bx-x-circle"
            }
            style={{ fontSize: 18 }}
          />
          {renderStatusChip(row.status)}
        </Stack>
      </CellBox>
    ),
  },
  {
    id: "actions",
    label: "Actions",
    minWidth: 110,
    align: "right",
    render: (row) => (
      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
        {canApprove && (
          <>
            <Tooltip title="Approve">
              <span>
                <IconButton
                  size="small"
                  color="success"
                  disabled={row.status !== "Pending" || isSaving}
                  onClick={() => onDecision(row, "Approved")}
                >
                  <i className="bx bx-check" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Reject">
              <span>
                <IconButton
                  size="small"
                  color="error"
                  disabled={row.status !== "Pending" || isSaving}
                  onClick={() => onDecision(row, "Rejected")}
                >
                  <i className="bx bx-x" />
                </IconButton>
              </span>
            </Tooltip>
          </>
        )}
      </Stack>
    ),
  },
];
