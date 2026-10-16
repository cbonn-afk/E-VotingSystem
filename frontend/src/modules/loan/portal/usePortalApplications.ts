import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApplicationDetailsPayload, LoanApplication } from "../types";
import { portalApplicationsApi as api } from "./portalApplicationsApi";

const root = ["loan-portal", "applications"] as const;

export const usePortalProducts = () =>
  useQuery({ queryKey: ["loan-portal", "products"], queryFn: api.products, retry: false });

export const usePortalApplicationList = () => useQuery({ queryKey: root, queryFn: api.list, retry: false });

export const usePortalApplication = (id: number, enabled = true) =>
  useQuery({ queryKey: [...root, id], queryFn: () => api.get(id), retry: false, enabled });

/** Every change returns the whole application, so the cache is refreshed in one place. */
export const usePortalApplicationActions = (id?: number) => {
  const queryClient = useQueryClient();

  const accept = (response: { data: LoanApplication }) => {
    queryClient.setQueryData([...root, response.data.id], response);
    queryClient.invalidateQueries({ queryKey: root, exact: true });
  };

  return {
    create: useMutation({
      mutationFn: ({ productId, body }: { productId: number; body: ApplicationDetailsPayload }) =>
        api.create(productId, body),
      onSuccess: accept,
    }),
    update: useMutation({ mutationFn: (body: ApplicationDetailsPayload) => api.update(id as number, body), onSuccess: accept }),
    upload: useMutation({
      mutationFn: ({ requirement, file }: { requirement: string; file: File }) =>
        api.uploadDocument(id as number, requirement, file),
      onSuccess: accept,
    }),
    removeDocument: useMutation({ mutationFn: (documentId: number) => api.deleteDocument(id as number, documentId), onSuccess: accept }),
    guarantors: useMutation({ mutationFn: (codes: string[]) => api.setGuarantors(id as number, codes), onSuccess: accept }),
    signature: useMutation({ mutationFn: (dataUrl: string) => api.saveSignature(id as number, dataUrl), onSuccess: accept }),
    acceptAgreement: useMutation({ mutationFn: (signature: string | null) => api.signAgreement(id as number, signature), onSuccess: accept }),
    submit: useMutation({ mutationFn: () => api.submit(id as number), onSuccess: accept }),
    cancel: useMutation({
      mutationFn: () => api.cancel(id as number),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: root }),
    }),
  };
};
