"use client";

import type { Mode } from "@core/types";

import ModuleSidebar from "@components/layout/vertical/ModuleSidebar";

import { membersNavigation } from "../data/membersNavigation";

const MembersSidebar = ({ mode }: { mode: Mode }) => (
  <ModuleSidebar mode={mode} navigation={membersNavigation} homeHref="/members" />
);

export default MembersSidebar;
