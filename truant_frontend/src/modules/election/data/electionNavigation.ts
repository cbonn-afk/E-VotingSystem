// Type Imports
import type { ElectionNavigationItem } from "../types";

export type ElectionNavigationGroup = {
  /** Plain-language heading shown above the group in the sidebar. */
  label: string;
  items: ElectionNavigationItem[];
};

/** Empty groups are hidden automatically for users without the permissions. */
export const electionNavigation: ElectionNavigationGroup[] = [
  {
    label: "Workspace",
    items: [{ label: "Overview", href: "/election", icon: "bx-home-circle" }],
  },
  {
    label: "General Assembly",
    items: [
      {
        label: "Assemblies",
        href: "/election/assemblies",
        icon: "bx-calendar-event",
        permission: "election.access",
      },
      {
        label: "Members",
        href: "/election/members",
        icon: "bx-group",
        permission: "election.members.view",
      },
      {
        label: "Registration",
        href: "/election/registration",
        icon: "bx-id-card",
        permission: "election.registration.view",
      },
      {
        label: "Token Distribution",
        href: "/election/tokens",
        icon: "bx-gift",
        permission: "election.tokens.manage",
      },
    ],
  },
  {
    label: "Ballot",
    items: [
      {
        label: "Positions & Candidates",
        href: "/election/ballot",
        icon: "bx-user-pin",
        permission: "election.ballot.view",
      },
      {
        label: "Amendments",
        href: "/election/amendments",
        icon: "bx-file",
        permission: "election.ballot.view",
      },
      {
        label: "Voting Station",
        href: "/election/voting",
        icon: "bx-poll",
        permission: "election.voting.cast",
      },
    ],
  },
  {
    label: "Results",
    items: [
      {
        label: "Results",
        href: "/election/results",
        icon: "bx-bar-chart-alt-2",
        permission: "election.results.view",
      },
    ],
  },
  {
    label: "Setup",
    items: [
      {
        label: "Settings",
        href: "/election/settings",
        icon: "bx-cog",
        permission: "election.settings.manage",
      },
    ],
  },
];
