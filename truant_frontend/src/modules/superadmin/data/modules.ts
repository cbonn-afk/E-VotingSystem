// Type Imports
import type { SuperAdminModule } from "../types";

export const superAdminModules: SuperAdminModule[] = [
  {
    title: "Election System",
    description: "Manage elections, candidates, voters, and results.",
    icon: "bx-poll",
    color: "primary",
    href: "/election",
    module: "election",
  },
  {
    title: "Loan System",
    description: "Manage borrowers, loan applications, payments, and balances.",
    icon: "bx-wallet",
    color: "warning",
    href: "/loan",
    module: "loan",
  },
  {
    title: "Users",
    description: "Manage users, change roles, and access control.",
    icon: "bx-user",
    color: "info",
    href: "/users",
    any: ["settings.users.view", "settings.roles.view"],
  },
];
