import { describe, expect, it } from "vitest";

import { describePermission } from "./accessCatalog";

describe("permission presentation", () => {
  it.each([
    ["election.voting.cast", "election", "cast", "Voting Station", "Cast", "cast ballots at a voting station"],
    ["election.results.view", "election", "view", "Results", "View", "view results"],
    ["loan.applications.manage", "loan", "manage", "Loan Applications", "Manage", "manage and configure loan applications"],
    ["members.manage", "members", "manage", "Members", "Manage", "manage and configure members data"],
  ])("presents %s", (name, module, action, subject, actionLabel, description) => {
    expect(
      describePermission({ id: name, name, module, action, label: actionLabel }),
    ).toMatchObject({
      subject,
      actionLabel,
      description: `Lets the user ${description}.`,
    });
  });

  it("describes module access in one sentence", () => {
    expect(
      describePermission({
        id: "loan.access",
        name: "loan.access",
        module: "loan",
        action: "access",
        label: "Access",
      }),
    ).toMatchObject({
      subject: "Module Access",
      description: "Lets the user open and use the Loan module.",
    });
  });
});
