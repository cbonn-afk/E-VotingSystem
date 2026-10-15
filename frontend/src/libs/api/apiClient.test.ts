import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "./apiClient";
import { ApiError } from "./apiError";
import { SERVER_UNAVAILABLE_EVENT } from "@/modules/misc/serverAvailability";

const jsonResponse = (
  body: unknown,
  init: { status: number; headers?: Record<string, string> },
) =>
  new Response(JSON.stringify(body), {
    status: init.status,
    headers: { "Content-Type": "application/json", ...init.headers },
  });

describe("apiClient server-availability detection", () => {
  let listener: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    listener = vi.fn();
    window.addEventListener(SERVER_UNAVAILABLE_EVENT, listener as EventListener);
  });

  afterEach(() => {
    window.removeEventListener(
      SERVER_UNAVAILABLE_EVENT,
      listener as EventListener,
    );
    vi.unstubAllGlobals();
  });

  it("dispatches server-unavailable with the Retry-After hint on a 503 (artisan down)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          { message: "Service Unavailable" },
          { status: 503, headers: { "Retry-After": "60" } },
        ),
      ),
    );

    await expect(apiClient("/api/ping")).rejects.toBeInstanceOf(ApiError);

    expect(listener).toHaveBeenCalledTimes(1);
    const detail = listener.mock.calls[0][0].detail;

    expect(detail.retryAfterSeconds).toBe(60);
  });

  it("dispatches server-unavailable on a plain 500", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({}, { status: 500 })),
    );

    await expect(apiClient("/api/ping")).rejects.toBeInstanceOf(ApiError);

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("dispatches server-unavailable when the backend is unreachable (network failure)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );

    await expect(apiClient("/api/ping")).rejects.toBeInstanceOf(TypeError);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].detail.retryAfterSeconds).toBeUndefined();
  });

  it("does NOT dispatch server-unavailable for a normal 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({}, { status: 404 })),
    );

    await expect(apiClient("/api/ping")).rejects.toBeInstanceOf(ApiError);

    expect(listener).not.toHaveBeenCalled();
  });
});
