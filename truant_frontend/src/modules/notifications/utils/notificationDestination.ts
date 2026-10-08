const SUPPORTED_PATHS = [
  /^\/home$/,
  /^\/users$/,
  /^\/users\/roles$/,
  /^\/sales$/,
  /^\/settings$/,
  /^\/employees(?:\/(?:advances|approvals|attendance|list|overtimes|payrolls|settings))?$/,
  /^\/inventory$/,
  /^\/inventory\/(?:items|movements)$/,
  /^\/ordering$/,
  /^\/ordering\/(?:billing-statements|customers|invoices|settings|statements-of-account)$/,
  /^\/ordering\/billing-statements\/[^/]+\/print$/,
  /^\/ordering\/statements-of-account\/[^/]+\/print$/,
  /^\/ordering\/(?:bom|forms|invoices|payments)$/,
  /^\/ordering\/(?:bom|forms|invoices|payments)\/new$/,
  /^\/ordering\/(?:bom|forms|invoices|payments)\/(?!new(?:\/|$))[^/]+(?:\/(?:edit|print|preview))?$/,
  /^\/production(?:\/[^/]+)?$/,
  // Team boards deep-linked by production/QC notifications (TailorAssigned,
  // ProductionStageAdvanced, ProductionQualityGate).
  /^\/production\/(?:tailor|printing|production|qc|packaging)\/(?:dashboard|my-assignment|inspection|progress|reassignments)$/,
  // Staff self-service pages (EmployeeAdvanceStatusUpdated deep-links here).
  /^\/employee-portal(?:\/(?:advances|earnings|payslips))?$/,
] as const;

const isSupportedPathname = (pathname: string): boolean =>
  SUPPORTED_PATHS.some((pattern) => pattern.test(pathname));

export const getSafeNotificationDestination = (
  actionUrl: string | null | undefined,
): string => {
  if (
    !actionUrl ||
    !actionUrl.startsWith("/") ||
    actionUrl.startsWith("//") ||
    actionUrl.includes("\\") ||
    /[\u0000-\u001F\u007F]/.test(actionUrl)
  ) {
    return "/home";
  }

  try {
    const rawPathname = actionUrl.split(/[?#]/, 1)[0];
    const decodedRawPathname = decodeURIComponent(rawPathname);
    const parsed = new URL(actionUrl, "http://truant.internal");
    const decodedPathname = decodeURIComponent(parsed.pathname);
    const hasTraversalSegment = decodedRawPathname
      .split("/")
      .some((segment) => segment === "." || segment === "..");

    if (
      parsed.origin !== "http://truant.internal" ||
      hasTraversalSegment ||
      decodedPathname.includes("//") ||
      decodedPathname.includes("\\") ||
      !isSupportedPathname(parsed.pathname)
    ) {
      return "/home";
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/home";
  }
};
