"use client";

// React Imports
import { useCallback, useEffect, useRef, useState } from "react";

// Next Imports
import { usePathname, useRouter } from "next/navigation";

type UseUnsavedChangesGuardOptions = {
  /** When true, in-app link navigation and tab close/refresh are intercepted. */
  enabled: boolean;
};

type UseUnsavedChangesGuardResult = {
  /** The href the user is trying to navigate to, or null when no attempt is pending. */
  pendingHref: string | null;
  /** Proceed with the intercepted navigation (call after saving or when discarding). */
  confirmNavigation: () => void;
  /** Dismiss the prompt and stay on the page. */
  cancelNavigation: () => void;
};

/**
 * Guards a page against losing unsaved work.
 *
 * While `enabled` is true it:
 * - warns on browser tab close / refresh via the native `beforeunload` prompt, and
 * - intercepts clicks on internal links (e.g. the sidebar) so the caller can show
 *   a "save your changes" dialog before the App Router navigates away.
 *
 * The caller renders the dialog from `pendingHref` and calls `confirmNavigation`
 * to continue or `cancelNavigation` to stay.
 */
export const useUnsavedChangesGuard = ({
  enabled,
}: UseUnsavedChangesGuardOptions): UseUnsavedChangesGuardResult => {
  const router = useRouter();
  const pathname = usePathname();
  const enabledRef = useRef(enabled);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // Native guard for tab close / refresh / external navigation.
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () =>
      window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [enabled]);

  // Intercept in-app link clicks (sidebar, menus, buttons rendered as anchors).
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!enabledRef.current) return;
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = (event.target as HTMLElement | null)?.closest("a");

      if (!anchor) return;

      const href = anchor.getAttribute("href");

      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      ) {
        return;
      }

      // Only guard internal navigations to a different path.
      const url = new URL(href, window.location.origin);

      if (url.origin !== window.location.origin) return;
      if (url.pathname === pathname) return;

      event.preventDefault();
      event.stopPropagation();
      setPendingHref(url.pathname + url.search + url.hash);
    };

    document.addEventListener("click", handleClick, true);

    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname]);

  const confirmNavigation = useCallback(() => {
    const href = pendingHref;

    setPendingHref(null);
    enabledRef.current = false;

    if (href) router.push(href);
  }, [pendingHref, router]);

  const cancelNavigation = useCallback(() => {
    setPendingHref(null);
  }, []);

  return { pendingHref, confirmNavigation, cancelNavigation };
};

export default useUnsavedChangesGuard;
