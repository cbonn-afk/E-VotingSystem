/** Fetches a file from an authenticated endpoint (the session cookie is sent with the request). */
export async function fetchFileBlob(path: string): Promise<Blob> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ""}${path}`, { credentials: "include" });

  if (!response.ok) throw new Error("The file could not be loaded.");

  // Keep the type the server sent so images and PDFs render instead of downloading.
  return new Blob([await response.blob()], { type: response.headers.get("content-type") ?? "" });
}

export type FileKind = "image" | "pdf" | "other";

/** What the preview can show, judged from the file name. */
export const fileKind = (filename: string): FileKind => {
  const extension = filename.split(".").pop()?.toLowerCase() ?? "";

  if (["png", "jpg", "jpeg"].includes(extension)) return "image";

  return extension === "pdf" ? "pdf" : "other";
};

/** Downloads a file from an authenticated endpoint. */
export async function downloadFile(path: string, filename: string): Promise<void> {
  const url = URL.createObjectURL(await fetchFileBlob(path));
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export const formatFileSize = (bytes: number): string =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
