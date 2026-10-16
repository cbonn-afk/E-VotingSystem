import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableFooter from "@mui/material/TableFooter";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import type { ScheduleItem } from "../types";
import { formatDate, formatPeso } from "../utils/applicationStatus";

/** The repayment schedule: what is due on each date and how the balance falls. */
export default function ScheduleTable({ items }: { items: ScheduleItem[] }) {
  const sum = (key: "principal" | "interest" | "total") => items.reduce((total, item) => total + Math.round(Number(item[key]) * 100), 0) / 100;

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>No.</TableCell>
            <TableCell>Due date</TableCell>
            <TableCell align="right">Principal</TableCell>
            <TableCell align="right">Interest</TableCell>
            <TableCell align="right">Payment</TableCell>
            <TableCell align="right">Balance after</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.number}>
              <TableCell>{item.number}</TableCell>
              <TableCell>{formatDate(item.due_date)}</TableCell>
              <TableCell align="right">{formatPeso(item.principal)}</TableCell>
              <TableCell align="right">{formatPeso(item.interest)}</TableCell>
              <TableCell align="right">{formatPeso(item.total)}</TableCell>
              <TableCell align="right">{formatPeso(item.balance_after)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2}>Total</TableCell>
            <TableCell align="right">{formatPeso(sum("principal"))}</TableCell>
            <TableCell align="right">{formatPeso(sum("interest"))}</TableCell>
            <TableCell align="right">{formatPeso(sum("total"))}</TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
}
