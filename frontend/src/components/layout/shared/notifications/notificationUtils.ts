import type { HeaderNotification, NotificationViewer } from "./types";

const normalise = (value?: string) => value?.trim().toLowerCase() ?? "";

export const canViewerSeeNotification = (
  notification: HeaderNotification,
  viewer?: NotificationViewer,
) => {
  const recipientNames = notification.recipientNames?.map(normalise) ?? [];
  const matchesRecipient =
    recipientNames.length === 0 ||
    recipientNames.includes(normalise(viewer?.name));

  if (!matchesRecipient) return false;
  if (viewer?.isSuperAdmin) return true;

  const requiredPermissions = notification.requiredPermissions ?? [];
  const requiredModules = notification.requiredModules ?? [];

  if (requiredPermissions.length === 0 && requiredModules.length === 0) {
    return true;
  }

  const viewerPermissions = new Set(viewer?.permissions ?? []);
  const viewerModules = new Set(viewer?.modules ?? []);

  return (
    requiredPermissions.some((permission) =>
      viewerPermissions.has(permission),
    ) || requiredModules.some((module) => viewerModules.has(module))
  );
};
