"use client";

import type { Mode } from "@core/types";

import ModuleSidebar from "@components/layout/vertical/ModuleSidebar";

import { loanNavigation } from "../data/loanNavigation";

const LoanSidebar = ({ mode }: { mode: Mode }) => (
  <ModuleSidebar mode={mode} navigation={loanNavigation} homeHref="/loan" />
);

export default LoanSidebar;
