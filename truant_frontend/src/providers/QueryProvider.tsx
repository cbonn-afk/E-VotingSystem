"use client";

import { useState, type ReactNode } from "react";
import {
  MutationCache,
  QueryClient,
  QueryCache,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ApiError } from "@/libs/api/apiError";
import PasswordChangeRequiredListener from "@/modules/auth/components/PasswordChangeRequiredListener";
import { authQueryKeys } from "@/modules/auth/queryKeys";
import ServerAvailabilityListener from "@/modules/misc/components/ServerAvailabilityListener";
import { clearNotificationSession } from "@/modules/notifications/utils/notificationSession";

type QueryProviderProps = {
  children: ReactNode;
};

const QueryProvider = ({ children }: QueryProviderProps) => {
  const [queryClient] = useState(() => {
    let client: QueryClient;
    const refreshAuthorization = (error: unknown) => {
      if (!(error instanceof ApiError)) return;

      if (error.status === 401) {
        void clearNotificationSession(client);
        client.setQueryData(authQueryKeys.currentUser(), null);
      } else if (error.status === 403) {
        void client.invalidateQueries({
          queryKey: authQueryKeys.currentUser(),
        });
      }
    };

    client = new QueryClient({
      queryCache: new QueryCache({
        onError: refreshAuthorization,
      }),
      mutationCache: new MutationCache({
        onError: refreshAuthorization,
      }),
      defaultOptions: {
        queries: {
          staleTime: 30_000,
          retry: (failureCount, error) => {
            if (
              error instanceof ApiError &&
              [401, 403, 404, 422].includes(error.status)
            ) {
              return false;
            }

            return failureCount < 1;
          },
          refetchOnWindowFocus: true,
        },
        mutations: {
          retry: false,
        },
      },
    });

    return client;
  });

  return (
    <QueryClientProvider client={queryClient}>
      <PasswordChangeRequiredListener />
      <ServerAvailabilityListener />
      {children}
    </QueryClientProvider>
  );
};

export default QueryProvider;
