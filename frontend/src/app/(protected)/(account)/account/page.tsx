import type { Metadata } from "next";

import AccountSettings from "@/modules/auth/views/AccountSettings";

export const metadata: Metadata = {
  title: "My User Settings",
  description: "Manage your personal details, appearance, and password.",
};

const AccountSettingsPage = () => <AccountSettings />;

export default AccountSettingsPage;
