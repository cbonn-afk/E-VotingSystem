const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const prefix = `${name}=`;
  const cookie = document.cookie
    .split("; ")
    .find((value) => value.startsWith(prefix));

  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : undefined;
}

/**
 * Streams an authenticated report export to a file download. Uses the same
 * credentialed-fetch + XSRF cookie approach as the shared apiClient, then
 * triggers a browser download from the returned blob.
 */
export async function downloadReport(
  path: string,
  filename: string,
): Promise<void> {
  const xsrfToken = getCookie("XSRF-TOKEN");
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: {
      Accept: "application/octet-stream",
      ...(xsrfToken && { "X-XSRF-TOKEN": xsrfToken }),
    },
  });

  if (!response.ok) {
    throw new Error(
      response.status === 403
        ? "You do not have permission to export this report."
        : `Export failed (${response.status}).`,
    );
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}
