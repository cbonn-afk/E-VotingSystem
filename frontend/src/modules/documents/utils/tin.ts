// Philippine Tax Identification Number (TIN): 9-digit base + 3-5 digit branch
// code, displayed as 123-456-789-000.
const TIN_PATTERN = /^\d{3}-\d{3}-\d{3}-\d{3,5}$/;

export const formatTin = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 14);

  return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9), digits.slice(9, 14)]
    .filter((group) => group.length > 0)
    .join("-");
};

/** Blank is allowed (optional); otherwise it must match the PH format. */
export const isValidTin = (value: string): boolean =>
  value.trim() === "" || TIN_PATTERN.test(value.trim());
