import type { AssemblyStatus } from "../api/types";

export const assemblyStatusLabels: Record<AssemblyStatus, string> = {
  draft: "Draft",
  registration: "Registration",
  voting: "Voting",
  closed: "Closed",
};

/** Mirrors the backend: which status an assembly may move to next. */
export const assemblyTransitions: Record<AssemblyStatus, AssemblyStatus[]> = {
  draft: ["registration"],
  registration: ["voting", "draft"],
  voting: ["closed", "registration"],
  closed: [],
};

export const assemblyTransitionHints: Record<AssemblyStatus, string> = {
  draft: "Back to setup. Members can be edited freely.",
  registration: "Opens attendance sign-in. The ballot can still be edited.",
  voting: "Opens the voting station and locks positions, candidates and amendments.",
  closed: "Ends the assembly. Only results and exports remain.",
};
