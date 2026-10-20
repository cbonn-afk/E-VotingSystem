import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import type { LoanScheduleRow } from "../types";
import { formatDate, formatPeso, scheduleStatusColor, scheduleStatusLabel } from "../utils/applicationStatus";

/** The repayment schedule with what has been paid and any penalty, installment by installment. */
export default function LoanScheduleTable({ rows }: { rows: LoanScheduleRow[] }) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>No.</TableCell>
            <TableCell>Due date</TableCell>
            <TableCell align="right">Payment due</TableCell>
            <TableCell align="right">Paid (principal + interest)</TableCell>
            <TableCell align="right">Penalty owed</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.number} hover>
              <TableCell>{row.number}</TableCell>
              <TableCell>{formatDate(row.due_date)}</TableCell>
              <TableCell align="right">{formatPeso(row.total)}</TableCell>
              <TableCell align="right">{formatPeso(Number(row.paid_principal) + Number(row.paid_interest))}</TableCell>
              <TableCell align="right">{Number(row.penalty_owed) > 0 ? formatPeso(row.penalty_owed) : "-"}</TableCell>
              <TableCell>
                <Chip size="small" variant="tonal" color={scheduleStatusColor[row.status]} label={scheduleStatusLabel[row.status]} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
