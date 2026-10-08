import { electionApi } from "../api/electionApi";
import type { ListParams } from "../api/types";

/** Starts a file download from the API using the signed-in session cookie. */
export const downloadExport = (
  report: "members" | "attendance" | "tokens",
  params: ListParams = {},
) => {
  const link = document.createElement("a");

  link.href = `${process.env.NEXT_PUBLIC_API_URL ?? ""}${electionApi.exports.url(report, params)}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
};
