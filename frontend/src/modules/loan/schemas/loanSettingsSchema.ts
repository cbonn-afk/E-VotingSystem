import { z } from "zod";

import type { LoanSettings } from "../types";

/** 192.168.1.10, 192.168.1.0/24, 2001:db8::/32 */
export const isValidNetwork = (value: string): boolean => {
  const [ip, mask, ...rest] = value.trim().split("/");

  if (rest.length > 0 || !ip) return false;

  const isV4 = /^(\d{1,3})(\.\d{1,3}){3}$/.test(ip) && ip.split(".").every((part) => Number(part) <= 255);
  const isV6 = ip.includes(":") && /^[0-9a-fA-F:.]+$/.test(ip);

  if (!isV4 && !isV6) return false;
  if (mask === undefined) return true;

  return /^\d{1,3}$/.test(mask) && Number(mask) <= (isV4 ? 32 : 128);
};

export const parseNetworks = (text: string): string[] =>
  Array.from(new Set(text.split(/[\n,]+/).map((line) => line.trim()).filter(Boolean)));

export const loanSettingsSchema = z
  .object({
    portal_access_mode: z.enum(["network_only", "online"]),
    networksText: z.string(),
    session_idle_minutes: z.string().regex(/^\d+$/, "Enter a whole number of minutes."),
    signature_required: z.boolean(),
  })
  .superRefine((values, context) => {
    const minutes = Number(values.session_idle_minutes);

    if (minutes < 5 || minutes > 120) {
      context.addIssue({
        code: "custom",
        path: ["session_idle_minutes"],
        message: "Use between 5 and 120 minutes.",
      });
    }

    const invalid = parseNetworks(values.networksText).filter((entry) => !isValidNetwork(entry));

    if (invalid.length > 0) {
      context.addIssue({
        code: "custom",
        path: ["networksText"],
        message: `Not a valid IP address or range: ${invalid.join(", ")}`,
      });
    }
  });

export type LoanSettingsFormValues = z.infer<typeof loanSettingsSchema>;

export const toFormValues = (settings: LoanSettings): LoanSettingsFormValues => ({
  portal_access_mode: settings.portal_access_mode,
  networksText: settings.allowed_networks.join("\n"),
  session_idle_minutes: String(settings.session_idle_minutes),
  signature_required: settings.signature_required,
});

export const toRequest = (values: LoanSettingsFormValues): LoanSettings => ({
  portal_access_mode: values.portal_access_mode,
  allowed_networks: parseNetworks(values.networksText),
  session_idle_minutes: Number(values.session_idle_minutes),
  signature_required: values.signature_required,
});
