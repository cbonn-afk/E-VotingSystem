"use client";

import { useEffect } from "react";

import { type QueryClient, useQueryClient } from "@tanstack/react-query";

import {
  getRequiredPasswordChangePath,
  PASSWORD_CHANGE_REQUIRED_EVENT,
  REQUIRED_PASSWORD_CHANGE_PATH,
} from "@/modules/auth/passwordChange";
import { authQueryKeys } from "@/modules/auth/queryKeys";
import type { User } from "@/modules/auth/types";

export const handleRequiredPasswordChange = (
  queryClient: QueryClient,
  currentLocation: string,
  replace: (path: string) => void,
) => {
  queryClient.setQueryData<User | null>(
    authQueryKeys.currentUser(),
    (currentUser) =>
      currentUser
        ? { ...currentUser, require_password_change: true }
        : currentUser,
  );

  if (currentLocation.startsWith(REQUIRED_PASSWORD_CHANGE_PATH)) return;

  replace(getRequiredPasswordChangePath(currentLocation));
};

const PasswordChangeRequiredListener = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const requirePasswordChange = () => {
      handleRequiredPasswordChange(
        queryClient,
        `${window.location.pathname}${window.location.search}`,
        (path) => window.location.replace(path),
      );
    };

    window.addEventListener(
      PASSWORD_CHANGE_REQUIRED_EVENT,
      requirePasswordChange,
    );

    return () => {
      window.removeEventListener(
        PASSWORD_CHANGE_REQUIRED_EVENT,
        requirePasswordChange,
      );
    };
  }, [queryClient]);

  return null;
};

export default PasswordChangeRequiredListener;
