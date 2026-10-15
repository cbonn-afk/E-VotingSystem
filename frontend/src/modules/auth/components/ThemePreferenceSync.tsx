"use client";

import { useEffect, useRef } from "react";

import { useSettings } from "@core/hooks/useSettings";
import type { Mode } from "@core/types";

import { useCurrentUser } from "@/modules/auth/hooks/useCurrentUser";

/**
 * Applies the authenticated user's saved theme preference to the live UI once,
 * so the choice persists across devices and sessions.
 */
const ThemePreferenceSync = () => {
  const currentUser = useCurrentUser();
  const { settings, updateSettings } = useSettings();
  const applied = useRef(false);

  useEffect(() => {
    const preference = currentUser.data?.theme_preference;

    if (applied.current || !preference) return;

    applied.current = true;

    if (settings.mode !== (preference as Mode)) {
      updateSettings({ mode: preference as Mode });
    }
  }, [currentUser.data?.theme_preference, settings.mode, updateSettings]);

  return null;
};

export default ThemePreferenceSync;
