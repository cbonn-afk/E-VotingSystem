"use client";

// React Imports
import { useState } from "react";

// MUI Imports
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

// Type Imports
import type { Employee } from "../../types";

type EmployeeTableActionsProps = {
  employee: Employee;
  onView: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onDeactivate: (employee: Employee) => void;
  onViewAttendance: (employee: Employee) => void;
  onViewPayroll: (employee: Employee) => void;
  canManage?: boolean;
};

const EmployeeTableActions = ({
  employee,
  onView,
  onEdit,
  onDeactivate,
  onViewAttendance,
  onViewPayroll,
  canManage = true,
}: EmployeeTableActionsProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const closeMenu = () => setAnchorEl(null);

  const selectAction = (action: (employee: Employee) => void) => {
    action(employee);
    closeMenu();
  };

  return (
    <>
      <IconButton
        size="small"
        onClick={(event) => setAnchorEl(event.currentTarget)}
      >
        <i className="bx-dots-vertical-rounded" />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={closeMenu}>
        <MenuItem onClick={() => selectAction(onView)}>
          <i className="bx-show mie-2" />
          View
        </MenuItem>
        <MenuItem onClick={() => selectAction(onEdit)} disabled={!canManage}>
          <i className="bx-pencil mie-2" />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => selectAction(onDeactivate)}
          disabled={!canManage || employee.status === "Inactive"}
        >
          <i className="bx-trash mie-2" />
          Deactivate
        </MenuItem>
        <MenuItem onClick={() => selectAction(onViewAttendance)}>
          <i className="bx-time mie-2" />
          View Attendance
        </MenuItem>
        <MenuItem onClick={() => selectAction(onViewPayroll)}>
          <i className="bx-money mie-2" />
          View Payroll
        </MenuItem>
      </Menu>
    </>
  );
};

export default EmployeeTableActions;
