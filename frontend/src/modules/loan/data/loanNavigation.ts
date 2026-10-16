import type { ModuleNavigationGroup } from "@components/layout/vertical/ModuleSidebar";

/** Groups without any permitted item are hidden automatically. */
export const loanNavigation: ModuleNavigationGroup[] = [
  {
    label: "Workspace",
    items: [{ label: "Overview", href: "/loan", icon: "bx-home-circle" }],
  },
  {
    label: "Lending",
    items: [
      {
        label: "Applications",
        href: "/loan/applications",
        icon: "bx-file",
        permission: "loan.applications.view",
      },
      {
        label: "Loan Products",
        href: "/loan/products",
        icon: "bx-purchase-tag-alt",
        permission: "loan.products.manage",
      },
    ],
  },
  {
    label: "Members",
    items: [
      {
        label: "Members",
        href: "/members",
        icon: "bx-id-card",
        permission: "members.view",
      },
    ],
  },
  {
    label: "Setup",
    items: [
      {
        label: "Approval Levels",
        href: "/loan/approval-levels",
        icon: "bx-git-merge",
        permission: "loan.settings.manage",
      },
      {
        label: "Settings",
        href: "/loan/settings",
        icon: "bx-cog",
        permission: "loan.settings.manage",
      },
    ],
  },
];
