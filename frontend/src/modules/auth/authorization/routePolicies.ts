import type { AuthorizationRequirement } from "./types";

type RoutePolicy = AuthorizationRequirement & {
  matches: (pathname: string) => boolean;
};

const isPath = (pathname: string, route: string) =>
  pathname === route || pathname.startsWith(`${route}/`);

export const routePolicies: readonly RoutePolicy[] = [
  {
    matches: (pathname) => isPath(pathname, "/members"),
    permission: "members.view",
  },
  {
    matches: (pathname) => isPath(pathname, "/election/members"),
    permission: "election.members.view",
  },
  {
    matches: (pathname) => isPath(pathname, "/election/registration"),
    permission: "election.registration.view",
  },
  {
    matches: (pathname) => isPath(pathname, "/election/tokens"),
    permission: "election.tokens.manage",
  },
  {
    matches: (pathname) => isPath(pathname, "/election/ballot"),
    permission: "election.ballot.view",
  },
  {
    matches: (pathname) => isPath(pathname, "/election/amendments"),
    permission: "election.ballot.view",
  },
  {
    matches: (pathname) => isPath(pathname, "/election/voting"),
    permission: "election.voting.cast",
  },
  {
    matches: (pathname) => isPath(pathname, "/election/results"),
    permission: "election.results.view",
  },
  {
    matches: (pathname) => isPath(pathname, "/election/settings"),
    permission: "election.settings.manage",
  },
  {
    matches: (pathname) => isPath(pathname, "/election"),
    permission: "election.access",
  },
  {
    matches: (pathname) => isPath(pathname, "/inquiry/station"),
    permission: "inquiry.station.use",
  },
  {
    matches: (pathname) => isPath(pathname, "/inquiry/announcements"),
    permission: "inquiry.announcements.manage",
  },
  {
    matches: (pathname) =>
      isPath(pathname, "/inquiry/balances") ||
      isPath(pathname, "/inquiry/transactions") ||
      isPath(pathname, "/inquiry/loans"),
    permission: "inquiry.statements.view",
  },
  {
    matches: (pathname) => isPath(pathname, "/inquiry"),
    permission: "inquiry.access",
  },
  {
    matches: (pathname) => isPath(pathname, "/loan/settings"),
    permission: "loan.settings.manage",
  },
  {
    matches: (pathname) => isPath(pathname, "/loan/applications"),
    permission: "loan.applications.view",
  },
  {
    matches: (pathname) => isPath(pathname, "/loan/products"),
    permission: "loan.products.manage",
  },
  {
    matches: (pathname) => isPath(pathname, "/loan"),
    permission: "loan.access",
  },
  {
    matches: (pathname) => isPath(pathname, "/settings"),
    module: "settings",
  },
  {
    matches: (pathname) =>
      isPath(pathname, "/users/roles/new") ||
      (pathname.startsWith("/users/roles/") && pathname.endsWith("/edit")),
    permission: "settings.roles.manage",
  },
  {
    matches: (pathname) => isPath(pathname, "/users/roles"),
    permission: "settings.roles.view",
  },
  {
    matches: (pathname) => isPath(pathname, "/users"),
    any: ["settings.users.view", "settings.roles.view"],
  },
  {
    matches: (pathname) => isPath(pathname, "/audit-logs"),
    permission: "settings.audit.view",
  },
];

export const getRoutePolicy = (
  pathname: string,
): AuthorizationRequirement | undefined =>
  routePolicies.find((policy) => policy.matches(pathname));
