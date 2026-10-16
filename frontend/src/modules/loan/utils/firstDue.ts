import type { PaymentFrequency } from "../types";

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const lastDay = (year: number, monthIndex: number) => new Date(year, monthIndex + 1, 0).getDate();

/** Same rule as the server: one period after release; twice-a-month loans fall on the 15th or the last day. */
export const suggestFirstDue = (frequency: PaymentFrequency, from: Date): string => {
  if (frequency === "weekly") return iso(new Date(from.getFullYear(), from.getMonth(), from.getDate() + 7));

  if (frequency === "semi_monthly") {
    const start = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 7);
    const day = start.getDate() <= 15 ? 15 : lastDay(start.getFullYear(), start.getMonth());

    return iso(new Date(start.getFullYear(), start.getMonth(), day));
  }

  const target = new Date(from.getFullYear(), from.getMonth() + 1, 1);

  return iso(new Date(target.getFullYear(), target.getMonth(), Math.min(from.getDate(), lastDay(target.getFullYear(), target.getMonth()))));
};

export const isSemiMonthlyDate = (isoDate: string): boolean => {
  const [year, month, day] = isoDate.split("-").map(Number);

  return day === 15 || day === lastDay(year, month - 1);
};

/** Why a first due date cannot be used, or null when it is fine. */
export const firstDueProblem = (isoDate: string, frequency: PaymentFrequency, today: Date): string | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return "Choose a date.";
  if (isoDate <= iso(today)) return "The first due date must be in the future.";
  if (frequency === "semi_monthly" && !isSemiMonthlyDate(isoDate)) return "Twice-a-month loans must start on the 15th or the last day of a month.";

  return null;
};
