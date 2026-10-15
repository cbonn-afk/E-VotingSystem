import type { Mode } from "@core/types";
import EmployeeWorkspaceSidebar from "./EmployeeWorkspaceSidebar";

const EmployeePortalSidebar = ({ mode }: { mode: Mode }) => (
  <EmployeeWorkspaceSidebar mode={mode} />
);

export default EmployeePortalSidebar;
