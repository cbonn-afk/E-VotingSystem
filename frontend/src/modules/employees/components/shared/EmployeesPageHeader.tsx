// React Imports
import type { ReactNode } from "react";

// Component Imports
import CustomPageHeader from "@components/app/CustomPageHeader";

type EmployeesPageHeaderProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

const EmployeesPageHeader = ({
  title,
  description,
  children,
}: EmployeesPageHeaderProps) => {
  return (
    <CustomPageHeader title={title} description={description}>
      {children}
    </CustomPageHeader>
  );
};

export default EmployeesPageHeader;
