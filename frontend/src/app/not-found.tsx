"use client";

import { useEffect } from "react";

import AuthorizationLoadingScreen from "@/modules/auth/components/AuthorizationLoadingScreen";
import { useCurrentUser } from "@/modules/auth/hooks/useCurrentUser";
import { getFallbackHomePath } from "@/modules/auth/passwordChange";

const NotFound = () => {
  const currentUser = useCurrentUser();

  useEffect(() => {
    if (currentUser.isPending) return;

    window.location.replace(getFallbackHomePath(currentUser.data));
  }, [currentUser.data, currentUser.isPending]);

  return <AuthorizationLoadingScreen />;
};

export default NotFound;
