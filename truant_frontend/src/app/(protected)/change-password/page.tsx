import type { Metadata } from "next";

import RequiredPasswordChange from "@/modules/auth/views/RequiredPasswordChange";

export const metadata: Metadata = {
  title: "Change Password",
  description: "Change your password to continue",
};

const ChangePasswordPage = () => <RequiredPasswordChange />;

export default ChangePasswordPage;
