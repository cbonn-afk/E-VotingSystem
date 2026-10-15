"use client";

import type { Mode } from "@core/types";

import ModuleSidebar from "@components/layout/vertical/ModuleSidebar";

import { inquiryNavigation } from "../../data/inquiryNavigation";

const InquirySidebar = ({ mode }: { mode: Mode }) => (
  <ModuleSidebar mode={mode} navigation={inquiryNavigation} homeHref="/inquiry" />
);

export default InquirySidebar;
