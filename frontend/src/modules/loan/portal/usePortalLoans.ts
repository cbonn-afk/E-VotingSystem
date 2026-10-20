import { useQuery } from "@tanstack/react-query";

import { portalLoansApi } from "./portalLoansApi";

export const usePortalLoans = () => useQuery({ queryKey: ["loan-portal", "loans"], queryFn: portalLoansApi.list, retry: false });

export const usePortalLoan = (id: number) =>
  useQuery({ queryKey: ["loan-portal", "loans", id], queryFn: () => portalLoansApi.get(id), retry: false });
