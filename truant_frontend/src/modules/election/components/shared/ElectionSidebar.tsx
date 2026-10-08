"use client";

// React Imports
import { useEffect, useRef } from "react";

// Next Imports
import Link from "next/link";

import { styled, useColorScheme, useTheme } from "@mui/material/styles";

// Third-party Imports
import PerfectScrollbar from "react-perfect-scrollbar";

// Type Imports
import type { Mode } from "@core/types";
import type { VerticalMenuContextProps } from "@menu/components/vertical-menu/Menu";

// Component Imports
import Logo from "@components/layout/shared/Logo";
import VerticalNav, {
  Menu,
  MenuItem,
  MenuSection,
  NavCollapseIcons,
  NavHeader,
} from "@menu/vertical-menu";

// Hook Imports
import useVerticalNav from "@menu/hooks/useVerticalNav";
import { useSettings } from "@core/hooks/useSettings";
import { useAuthorization } from "@/modules/auth/hooks/useAuthorization";

// Data Imports
import { electionNavigation } from "@/modules/election/data/electionNavigation";

// Styled Component Imports
import StyledVerticalNavExpandIcon from "@menu/styles/vertical/StyledVerticalNavExpandIcon";

// Style Imports
import menuItemStyles from "@core/styles/vertical/menuItemStyles";
import menuSectionStyles from "@core/styles/vertical/menuSectionStyles";
import navigationCustomStyles from "@core/styles/vertical/navigationCustomStyles";

type AccountingSidebarProps = {
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

const AccountingSidebar = ({ mode }: AccountingSidebarProps) => {
  const theme = useTheme();
  const verticalNavOptions = useVerticalNav();
  const { updateSettings, settings } = useSettings();
  const { mode: muiMode, systemMode: muiSystemMode } = useColorScheme();
  const shadowRef = useRef<HTMLDivElement>(null);
  const authorization = useAuthorization();
  const visibleGroups = electionNavigation
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => authorization.isAuthorized(item)),
    }))
    .filter((group) => group.items.length > 0);

  const {
    isCollapsed,
    isHovered,
    collapseVerticalNav,
    isBreakpointReached,
    transitionDuration,
  } = verticalNavOptions;

  const isLogoCollapsed = isCollapsed && !isHovered;

  const currentMode = muiMode === "system" ? muiSystemMode : muiMode || mode;
  const isDark = currentMode === "dark";

  const scrollMenu = (container: unknown, isPerfectScrollbar: boolean) => {
    const element = (
      isBreakpointReached || !isPerfectScrollbar
        ? (container as { target: HTMLElement }).target
        : container
    ) as HTMLElement;

    if (shadowRef.current && element.scrollTop > 0) {
      shadowRef.current.classList.add("scrolled");
    } else {
      shadowRef.current?.classList.remove("scrolled");
    }
  };

  useEffect(() => {
    collapseVerticalNav(settings.layout === "collapsed");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.layout]);

  const renderMenuItem = (item: AccountingNavItem) => (
    <MenuItem key={item.href} href={item.href} icon={<i className={item.icon} />}>
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
          href="/accounting"
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
          {visibleGroups.map((group) => (
            <MenuSection key={group.label} label={group.label}>
              {group.items.map((item) => renderMenuItem(item))}
            </MenuSection>
          ))}

          {authorization.shouldShowSystemHomeLink && (
            <MenuSection label="System">
              <MenuItem href="/home" icon={<i className="bx-left-arrow-alt" />}>
                Back to Home
              </MenuItem>
            </MenuSection>
          )}
        </Menu>
      </PerfectScrollbar>
    </VerticalNav>
  );
};

type AccountingNavItem = (typeof electionNavigation)[number]["items"][number];

export default AccountingSidebar;
