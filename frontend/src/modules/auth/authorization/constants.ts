export const permissionNames = [
  "settings.access",
  "settings.users.view",
  "settings.users.manage",
  "settings.roles.view",
  "settings.roles.manage",
  "settings.audit.view",
  "members.view",
  "members.manage",
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
  "loan.settings.manage",
  "loan.products.manage",
  "loan.applications.view",
  "loan.applications.manage",
  "loan.evaluate",
  "loan.approve",
  "loan.release",
  "loan.payments.view",
  "loan.payments.record",
  "loan.payments.void",
  "loan.reports.view",
  "inquiry.access",
  "inquiry.statements.view",
  "inquiry.statements.import",
  "inquiry.station.use",
  "inquiry.announcements.manage",
] as const;

export const systemRoles = ["Super Admin", "Admin", "Member"] as const;

export const moduleNames = ["settings", "members", "election", "loan", "inquiry"] as const;

export type PermissionName = (typeof permissionNames)[number];
export type SystemRole = (typeof systemRoles)[number];
export type ModuleName = (typeof moduleNames)[number];
