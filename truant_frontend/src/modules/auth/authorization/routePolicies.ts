import type { AuthorizationRequirement } from "./types";

type RoutePolicy = AuthorizationRequirement & {
  matches: (pathname: string) => boolean;
};

const isPath = (pathname: string, route: string) =>
  pathname === route || pathname.startsWith(`${route}/`);

export const routePolicies: readonly RoutePolicy[] = [
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
