export type ReverbScheme = "http" | "https";

export interface ReverbConfig {
  apiUrl: string;
  appKey: string;
  host: string;
  port: number;
  scheme: ReverbScheme;
  forceTLS: boolean;
}

const requireValue = (
  value: string | undefined,
  variableName: string,
): string => {
  if (!value) {
    throw new Error(`${variableName} is not configured.`);
  }

  return value;
};

export const getReverbConfig = (): ReverbConfig => {
  const apiUrl = requireValue(
    process.env.NEXT_PUBLIC_API_URL,
    "NEXT_PUBLIC_API_URL",
  );

  const appKey = requireValue(
    process.env.NEXT_PUBLIC_REVERB_APP_KEY,
    "NEXT_PUBLIC_REVERB_APP_KEY",
  );

  const host = requireValue(
    process.env.NEXT_PUBLIC_REVERB_HOST,
    "NEXT_PUBLIC_REVERB_HOST",
  );

  const portValue = requireValue(
    process.env.NEXT_PUBLIC_REVERB_PORT,
    "NEXT_PUBLIC_REVERB_PORT",
  );

  const schemeValue = requireValue(
    process.env.NEXT_PUBLIC_REVERB_SCHEME,
    "NEXT_PUBLIC_REVERB_SCHEME",
  );

  const port = Number(portValue);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("NEXT_PUBLIC_REVERB_PORT must be a valid port.");
  }

  if (schemeValue !== "http" && schemeValue !== "https") {
    throw new Error(
      'NEXT_PUBLIC_REVERB_SCHEME must be either "http" or "https".',
    );
  }

  return {
    apiUrl,
    appKey,
    host,
    port,
    scheme: schemeValue,
    forceTLS: schemeValue === "https",
  };
};
