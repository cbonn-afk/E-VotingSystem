"use client";

import type { Mode } from "@core/types";

import ModuleSidebar from "@components/layout/vertical/ModuleSidebar";

import { electionNavigation } from "../../data/electionNavigation";

const ElectionSidebar = ({ mode }: { mode: Mode }) => (
  <ModuleSidebar mode={mode} navigation={electionNavigation} homeHref="/election" />
);

export default ElectionSidebar;
