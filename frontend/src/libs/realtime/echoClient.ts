import type Echo from "laravel-echo";

import { authorizePrivateChannel } from "./channelAuthorization";
import { getReverbConfig } from "./reverbConfig";

export type ReverbEcho = Echo<"reverb">;

declare global {
  var __aiurEchoPromise: Promise<ReverbEcho> | undefined;
  var __aiurEchoRefCount: number | undefined;
}

const createEchoClient = async (): Promise<ReverbEcho> => {
  const [{ default: EchoClient }, { default: Pusher }] = await Promise.all([
    import("laravel-echo"),
    import("pusher-js"),
  ]);

  const config = getReverbConfig();

  return new EchoClient<"reverb">({
    broadcaster: "reverb",
    key: config.appKey,
    wsHost: config.host,
    wsPort: config.port,
    wssPort: config.port,
    forceTLS: config.forceTLS,
    enabledTransports: ["ws", "wss"],
    Pusher,
    channelAuthorization: {
      customHandler: authorizePrivateChannel,
    },
  });
};

// getEchoClient/disconnectEchoClient are reference-counted: several
// independent subscribers (header bell, per-page realtime hooks, ...) share
// one underlying connection, and any one of them can mount/unmount at any
// time without tearing down the connection the others still need.
export const getEchoClient = (): Promise<ReverbEcho> => {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("Echo can only be initialized in the browser."),
    );
  }

  globalThis.__aiurEchoRefCount = (globalThis.__aiurEchoRefCount ?? 0) + 1;

  globalThis.__aiurEchoPromise ??= createEchoClient().catch((error) => {
    globalThis.__aiurEchoPromise = undefined;

    throw error;
  });

  return globalThis.__aiurEchoPromise;
};

export const disconnectEchoClient = async (): Promise<void> => {
  const refCount = (globalThis.__aiurEchoRefCount ?? 0) - 1;

  globalThis.__aiurEchoRefCount = Math.max(refCount, 0);

  if (refCount > 0) return;

  await resetEchoClient();
};

/** Forcibly tears down the shared connection regardless of subscriber count — used on login/logout. */
export const resetEchoClient = async (): Promise<void> => {
  const echoPromise = globalThis.__aiurEchoPromise;

  globalThis.__aiurEchoPromise = undefined;
  globalThis.__aiurEchoRefCount = 0;

  if (!echoPromise) return;

  const echo = await echoPromise.catch(() => null);

  echo?.disconnect();
};
