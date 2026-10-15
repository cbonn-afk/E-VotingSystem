import type { ModuleNavigationGroup } from "@components/layout/vertical/ModuleSidebar";

export const membersNavigation: ModuleNavigationGroup[] = [
  {
    label: "Workspace",
    items: [{ label: "Members", href: "/members", icon: "bx-id-card", permission: "members.view" }],
  },
];
