import type { PaginatedResponse } from "../api/types";

/** Loads every page of a paginated list (used by the PDF exports). */
export const fetchAllPages = async <T>(
  fetchPage: (page: number) => Promise<PaginatedResponse<T>>,
): Promise<T[]> => {
  const first = await fetchPage(1);
  const rows = [...first.data];

  for (let page = 2; page <= first.meta.last_page; page += 1) {
    rows.push(...(await fetchPage(page)).data);
  }

  return rows;
};
