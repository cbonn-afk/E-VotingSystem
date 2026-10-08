export const permissionNames = [
  "settings.access",
  "settings.users.view",
  "settings.users.manage",
  "settings.roles.view",
  "settings.roles.manage",
  "settings.audit.view",
  "election.access",
  "election.assemblies.manage",
  "election.members.view",
  "election.members.manage",
  "election.registration.view",
  "election.registration.manage",
  "election.ballot.view",
  "election.ballot.manage",
  "election.voting.cast",
  "election.tokens.manage",
  "election.results.view",
  "election.reports.export",
  "election.settings.manage",
  "loan.access",
  "loan.manage",
] as const;

export const systemRoles = ["Super Admin", "Admin", "Member"] as const;

export const moduleNames = ["settings", "election", "loan"] as const;

export type PermissionName = (typeof permissionNames)[number];
export type SystemRole = (typeof systemRoles)[number];
export type ModuleName = (typeof moduleNames)[number];
