// Fired by apiClient when the backend is unreachable or reports 500/503
// (e.g. Laravel's `artisan down --retry=60`). A single listener redirects to
// the maintenance page — see ServerAvailabilityListener.

export const SERVER_UNAVAILABLE_EVENT = "truant:server-unavailable";
export const MAINTENANCE_PATH = "/maintenance";
export const DEFAULT_RETRY_SECONDS = 60;

export type ServerUnavailableEventDetail = {
  retryAfterSeconds?: number;
};

export function dispatchServerUnavailable(retryAfterSeconds?: number): void {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<ServerUnavailableEventDetail>(SERVER_UNAVAILABLE_EVENT, {
      detail: { retryAfterSeconds },
    }),
  );
}
