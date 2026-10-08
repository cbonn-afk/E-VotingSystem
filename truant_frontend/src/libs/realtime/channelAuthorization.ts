import type { ChannelAuthorizationHandler } from "pusher-js";

import { apiClient } from "@/libs/api/apiClient";
import { initializeCsrf } from "@/libs/api/csrf";

interface BroadcastAuthorizationResponse {
  auth: string;
  channel_data?: string;
  shared_secret?: string;
}

export const authorizePrivateChannel: ChannelAuthorizationHandler = (
  params,
  callback,
) => {
  void (async () => {
    try {
      await initializeCsrf();

      const authorization = await apiClient<BroadcastAuthorizationResponse>(
        "/broadcasting/auth",
        {
          method: "POST",
          body: {
            socket_id: params.socketId,
            channel_name: params.channelName,
          },
        },
      );

      callback(null, authorization);
    } catch (error) {
      callback(
        error instanceof Error
          ? error
          : new Error("Private channel authorization failed."),
        null,
      );
    }
  })();
};
