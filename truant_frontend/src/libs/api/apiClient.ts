import { ApiError } from "./apiError";
import { initializeCsrf } from "./csrf";
import { PASSWORD_CHANGE_REQUIRED_EVENT } from "@/modules/auth/passwordChange";
import { dispatchServerUnavailable } from "@/modules/misc/serverAvailability";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not configured.");
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

let csrfReady: Promise<void> | null = null;

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") {
    return undefined;
  }

  const prefix = `${name}=`;
  const cookie = document.cookie
    .split("; ")
    .find((value) => value.startsWith(prefix));

  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : undefined;
}

function requiresCsrfHeader(method: string): boolean {
  return !["GET", "HEAD", "OPTIONS"].includes(method);
}

function isFormData(body: unknown): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

async function ensureCsrfCookie(method: string): Promise<void> {
  if (typeof document === "undefined" || !requiresCsrfHeader(method)) {
    return;
  }

  if (getCookie("XSRF-TOKEN")) {
    return;
  }

  csrfReady ??= initializeCsrf().catch((error) => {
    csrfReady = null;

    throw error;
  });

  await csrfReady;
}

export async function apiClient<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  try {
    const method = options.method?.toUpperCase() ?? "GET";
    const hasFormDataBody = isFormData(options.body);

    await ensureCsrfCookie(method);

    const xsrfToken = getCookie("XSRF-TOKEN");
    let requestBody: BodyInit | null | undefined;

    if (options.body !== undefined) {
      requestBody = hasFormDataBody
        ? (options.body as FormData)
        : JSON.stringify(options.body);
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      method,
      credentials: "include",
      headers: {
        Accept: "application/json",

        ...(options.body !== undefined &&
          !hasFormDataBody && {
            "Content-Type": "application/json",
          }),

        ...(xsrfToken &&
          requiresCsrfHeader(method) && {
            "X-XSRF-TOKEN": xsrfToken,
          }),

        ...options.headers,
      },

      body: requestBody,
    });

    if (!response.ok) {
      const error = await ApiError.fromResponse(response);

      if (error.status === 423 && typeof window !== "undefined") {
        window.dispatchEvent(new Event(PASSWORD_CHANGE_REQUIRED_EVENT));
      }

      throw error;
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  } catch (error) {
    // Laravel maintenance mode (`artisan down --retry=60`) and generic server
    // crashes surface as a 500/503 ApiError; a completely unreachable backend
    // (process down, network drop) surfaces as a raw fetch failure instead —
    // treat both as "the server is unavailable" and let the maintenance page
    // take over. Any other ApiError (401/403/404/422/…) passes through as-is.
    const isServerUnavailable =
      error instanceof ApiError
        ? error.status === 500 || error.status === 503
        : true;

    if (isServerUnavailable) {
      dispatchServerUnavailable(
        error instanceof ApiError ? error.retryAfterSeconds : undefined,
      );
    }

    throw error;
  }
}
