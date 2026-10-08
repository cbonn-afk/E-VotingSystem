export type DashboardTone = "primary" | "success" | "warning" | "error" | "info";

export type KpiCardData = {
  title: string;
  value: string;
  tone: DashboardTone;
  caption: string;
  trend: number[];
};

export type AttentionCardData = {
  title: string;
  description: string;
  href: string;
  icon: string;
  tone: DashboardTone;
};

export type LegendItemData = {
  label: string;
  value: string;
  tone: DashboardTone;
};

export type FocusMetricData = {
  title: string;
  value: string;
  tone: DashboardTone;
  helper: string;
  href: string;
  actionLabel: string;
};

export const toneToColor = (tone: DashboardTone): string => {
  switch (tone) {
    case "primary":
      return "primary.main";
    case "success":
      return "success.main";
    case "warning":
      return "warning.main";
    case "error":
      return "error.main";
    case "info":
      return "info.main";
  }
};
