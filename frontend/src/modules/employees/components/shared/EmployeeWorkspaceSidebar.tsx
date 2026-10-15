"use client";

import { useEffect, useRef } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { styled, useColorScheme, useTheme } from "@mui/material/styles";
import PerfectScrollbar from "react-perfect-scrollbar";

import type { Mode } from "@core/types";
import type { VerticalMenuContextProps } from "@menu/components/vertical-menu/Menu";
import VerticalNav, {
  Menu,
  MenuItem,
  MenuSection,
  NavCollapseIcons,
  NavHeader,
} from "@menu/vertical-menu";
import StyledVerticalNavExpandIcon from "@menu/styles/vertical/StyledVerticalNavExpandIcon";
import useVerticalNav from "@menu/hooks/useVerticalNav";
import { useSettings } from "@core/hooks/useSettings";
import Logo from "@components/layout/shared/Logo";
import { useAuthorization } from "@/modules/auth/hooks/useAuthorization";
import { productionNavigation } from "@/modules/production/data/productionNavigation";
import menuItemStyles from "@core/styles/vertical/menuItemStyles";
import menuSectionStyles from "@core/styles/vertical/menuSectionStyles";
import navigationCustomStyles from "@core/styles/vertical/navigationCustomStyles";

type EmployeeWorkspaceSidebarProps = {
  mode: Mode;
};

type RenderExpandIconProps = {
  open?: boolean;
  transitionDuration?: VerticalMenuContextProps["transitionDuration"];
};

const StyledBoxForShadow = styled("div")(({ theme }) => ({
  top: 72,
  zIndex: 2,
  opacity: 0,
  position: "absolute",
  pointerEvents: "none",
  width: "100%",
  height: theme.mixins.toolbar.minHeight,
  transition: "opacity .15s ease-in-out",
  background: `linear-gradient(var(--mui-palette-background-paper) ${
    theme.direction === "rtl" ? "95%" : "5%"
  }, rgb(var(--mui-palette-background-paperChannel) / 0.85) 30%, rgb(var(--mui-palette-background-paperChannel) / 0.5) 65%, rgb(var(--mui-palette-background-paperChannel) / 0.3) 75%, transparent)`,
  "&.scrolled": {
    opacity: 1,
  },
}));

const MenuToggle = (
  <div className="icon-wrapper">
    <i className="bx-bxs-chevron-left" />
  </div>
);

const RenderExpandIcon = ({
  open,
  transitionDuration,
}: RenderExpandIconProps) => (
  <StyledVerticalNavExpandIcon
    open={open}
    transitionDuration={transitionDuration}
  >
    <i className="bx-chevron-right" />
  </StyledVerticalNavExpandIcon>
);

const EmployeeWorkspaceSidebar = ({
  mode: _mode,
}: EmployeeWorkspaceSidebarProps) => {
  const theme = useTheme();
  const verticalNavOptions = useVerticalNav();
  const { updateSettings, settings } = useSettings();
  const { mode: muiMode, systemMode: muiSystemMode } = useColorScheme();
  const shadowRef = useRef<HTMLDivElement>(null);
  const authorization = useAuthorization();
  const pathname = usePathname();

  const isAdmin = authorization.isSuperAdmin || authorization.hasRole("Admin");
  const canUseEmployeeSelfService =
    authorization.canAccessEmployeePortal() && !isAdmin;
  const isTailor = authorization.hasRole("Tailor");
  const visibleNavigation = productionNavigation.filter(
    (item) =>
      authorization.isAuthorized(item) &&
      (!item.href.startsWith("/employee-portal") || canUseEmployeeSelfService) &&
      // Attendance self-service is for time-based employees, not tailors.
      (item.href !== "/employee-portal/attendance" || !isTailor),
  );
  const homeHref = pathname.startsWith("/employee-portal")
    ? "/employee-portal"
    : (authorization.user?.employee_workspace?.home_path ?? "/production");
  const showSystemHomeLink = authorization.shouldShowSystemHomeLink;

  const {
    isCollapsed,
    isHovered,
    collapseVerticalNav,
    isBreakpointReached,
    transitionDuration,
  } = verticalNavOptions;

  const isLogoCollapsed = isCollapsed && !isHovered;
  const currentMode = muiMode === "system" ? muiSystemMode : muiMode || _mode;
  const isDark = currentMode === "dark";

  const scrollMenu = (container: any, isPerfectScrollbar: boolean) => {
    container =
      isBreakpointReached || !isPerfectScrollbar ? container.target : container;

    if (shadowRef.current && container.scrollTop > 0) {
      shadowRef.current.classList.add("scrolled");
    } else {
      shadowRef.current?.classList.remove("scrolled");
    }
  };

  useEffect(() => {
    collapseVerticalNav(settings.layout === "collapsed");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.layout]);

  const renderNavigationItem = (item: (typeof visibleNavigation)[number]) => (
    <MenuItem
      key={item.href}
      href={item.href}
      icon={<i className={`bx ${item.icon}`} />}
    >
      {item.label}
    </MenuItem>
  );

  return (
    <VerticalNav
      customStyles={navigationCustomStyles(verticalNavOptions, theme, settings)}
      collapsedWidth={85}
      backgroundColor="var(--mui-palette-background-paper)"
      {...(settings.semiDark &&
        !isDark && {
          "data-dark": "",
        })}
    >
      <NavHeader>
        <Link
          href={homeHref}
          className={
            isLogoCollapsed
              ? "flex items-center justify-center is-full"
              : "flex items-center min-is-0"
          }
        >
          <Logo collapsed={isLogoCollapsed} />
        </Link>
        {!(isCollapsed && !isHovered) && (
          <NavCollapseIcons
            lockedIcon={MenuToggle}
            unlockedIcon={MenuToggle}
            closeIcon={MenuToggle}
            onClick={() =>
              updateSettings({
                layout: !isCollapsed ? "collapsed" : "vertical",
              })
            }
          />
        )}
      </NavHeader>

      <StyledBoxForShadow ref={shadowRef} />

      <PerfectScrollbar
        options={{ wheelPropagation: false, suppressScrollX: true }}
        onScrollY={(container) => scrollMenu(container, true)}
      >
        <Menu
          popoutMenuOffset={{ mainAxis: 27 }}
          menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
          renderExpandIcon={({ open }) => (
            <RenderExpandIcon
              open={open}
              transitionDuration={transitionDuration}
            />
          )}
          renderExpandedMenuItemIcon={{ icon: <i className="bx-bxs-circle" /> }}
          menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
        >
          {visibleNavigation.length > 0 && (
            <MenuSection label="Production">
              {visibleNavigation.map(renderNavigationItem)}
            </MenuSection>
          )}

          {visibleNavigation.length === 0 &&
            authorization.user?.employee_workspace && (
              <MenuSection label="Workspace">
                <MenuItem
                  href={authorization.user.employee_workspace.home_path}
                  icon={<i className="bx bx-briefcase" />}
                >
                  {authorization.user.employee_workspace.label}
                </MenuItem>
              </MenuSection>
            )}

          {showSystemHomeLink && (
            <MenuSection label="System">
              <MenuItem
                href="/home"
                icon={<i className="bx bx-left-arrow-alt" />}
              >
                Back to Home
              </MenuItem>
            </MenuSection>
          )}
        </Menu>
      </PerfectScrollbar>
    </VerticalNav>
  );
};

export default EmployeeWorkspaceSidebar;
