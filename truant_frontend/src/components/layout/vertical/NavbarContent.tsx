"use client";

// Third-party Imports
import classnames from "classnames";

// Component Imports
import NavToggle from "./NavToggle";
import HeaderNotifications from "@components/layout/shared/HeaderNotifications";
import ModeDropdown from "@components/layout/shared/ModeDropdown";
import UserDropdown from "@components/layout/shared/UserDropdown";

// Util Imports
import { verticalLayoutClasses } from "@layouts/utils/layoutClasses";

const NavbarContent = () => {
  return (
    <div
      className={classnames(
        verticalLayoutClasses.navbarContent,
        "flex items-center justify-end is-full",
      )}
    >
      <div className="flex items-center">
        <NavToggle />
        <ModeDropdown />
        <HeaderNotifications />
        <UserDropdown />
      </div>
    </div>
  );
};

export default NavbarContent;
