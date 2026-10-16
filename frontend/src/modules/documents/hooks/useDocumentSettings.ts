import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { documentSettingsApi } from "../api/documentSettingsApi";
import { defaultDocumentSettings } from "../defaults";
import type { DocumentSettings } from "../types";

export const documentSettingsKey = ["documents", "settings"] as const;

export const useDocumentSettingsQuery = () =>
  useQuery({
    queryKey: documentSettingsKey,
    queryFn: documentSettingsApi.get,
    staleTime: 5 * 60 * 1000,
  });

/**
 * The settings every printable renders with. Falls back to the defaults while
 * loading or if the request fails, so a document can always be printed.
 */
export const useDocumentSettings = (): DocumentSettings => {
  const { data } = useDocumentSettingsQuery();

  return data?.data ?? defaultDocumentSettings;
};

export const useUpdateDocumentSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: documentSettingsApi.update,
    onSuccess: (response) =>
      queryClient.setQueryData(documentSettingsKey, response),
  });
};

export const useUploadDocumentLogo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: documentSettingsApi.uploadLogo,
    onSuccess: (response) =>
      queryClient.setQueryData(documentSettingsKey, response),
  });
};
