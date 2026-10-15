"use client";

import { useEffect } from "react";

import {
  DEFAULT_RETRY_SECONDS,
  MAINTENANCE_PATH,
  SERVER_UNAVAILABLE_EVENT,
  type ServerUnavailableEventDetail,
} from "@/modules/misc/serverAvailability";

const ServerAvailabilityListener = () => {
  useEffect(() => {
    const handleServerUnavailable = (event: Event) => {
      if (window.location.pathname.startsWith(MAINTENANCE_PATH)) return;

      const { retryAfterSeconds } =
        (event as CustomEvent<ServerUnavailableEventDetail>).detail ?? {};
      const retry = retryAfterSeconds ?? DEFAULT_RETRY_SECONDS;
      const from = `${window.location.pathname}${window.location.search}`;

      window.location.replace(
        `${MAINTENANCE_PATH}?retry=${retry}&from=${encodeURIComponent(from)}`,
      );
    };

    window.addEventListener(SERVER_UNAVAILABLE_EVENT, handleServerUnavailable);

    return () => {
      window.removeEventListener(
        SERVER_UNAVAILABLE_EVENT,
        handleServerUnavailable,
      );
    };
  }, []);

  return null;
};

export default ServerAvailabilityListener;
