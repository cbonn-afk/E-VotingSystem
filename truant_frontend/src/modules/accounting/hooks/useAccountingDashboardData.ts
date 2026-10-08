"use client";

import { useMemo } from "react";

import { useTheme } from "@mui/material/styles";
import type { ApexOptions } from "apexcharts";

import {
  aggregateJournalBuckets,
  buildPostingActivityOptions,
  buildStatusFlowOptions,
  buildStatusMixOptions,
  formatCompactPeso,
  lastMonthsBuckets,
} from "../components/dashboard/helpers";
import type {
  AttentionCardData,
  FocusMetricData,
  KpiCardData,
  LegendItemData,
} from "../components/dashboard/types";
import {
  useAccountStats,
  useBalanceSheet,
  useIncomeStatement,
  useJournals,
  usePeriods,
  useTrialBalance,
} from "./useAccountingApi";
import { formatPeso } from "../utils/accountingFormat";

const ICONS = {
  draft: "bx bx-edit",
  reversed: "bx bx-undo",
  period: "bx bx-calendar",
  balance: "bx bx-check-shield",
} as const;

const sum = (values: number[]): number =>
  values.reduce((total, value) => total + value, 0);

const todayIso = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export type AccountingDashboardData = {
  isLoading: boolean;
  focusMetrics: FocusMetricData[];
  kpis: KpiCardData[];
  attentionCards: AttentionCardData[];
  postingActivitySeries: { name: string; data: number[] }[];
  postingActivityLegend: LegendItemData[];
  postingActivityOptions: ApexOptions;
  statusMixSeries: number[];
  statusMixLegend: LegendItemData[];
  statusMixOptions: ApexOptions;
  statusFlowSeries: { name: string; data: number[] }[];
  statusFlowLegend: LegendItemData[];
  statusFlowOptions: ApexOptions;
};

export const useAccountingDashboardData = (): AccountingDashboardData => {
  const theme = useTheme();

  const today = useMemo(todayIso, []);
  const yearStart = useMemo(() => `${new Date().getFullYear()}-01-01`, []);

  const journalsQuery = useJournals({ per_page: 200 });
  const statsQuery = useAccountStats();
  const periodsQuery = usePeriods();
  const incomeQuery = useIncomeStatement({ from: yearStart, to: today });
  const balanceQuery = useBalanceSheet({ date: today });
  const trialQuery = useTrialBalance({ date: today });

  const isLoading =
    journalsQuery.isPending ||
    statsQuery.isPending ||
    periodsQuery.isPending ||
    incomeQuery.isPending ||
    balanceQuery.isPending ||
    trialQuery.isPending;

  const entries = useMemo(
    () => journalsQuery.data?.data ?? [],
    [journalsQuery.data],
  );
  const stats = statsQuery.data?.data;
  const periods = periodsQuery.data?.data ?? [];
  const income = incomeQuery.data?.data;
  const balance = balanceQuery.data?.data;
  const trial = trialQuery.data?.data;

  const buckets = useMemo(() => lastMonthsBuckets(6), []);
  const agg = useMemo(
    () => aggregateJournalBuckets(entries, buckets),
    [entries, buckets],
  );

  // ─── Status counts across the loaded entries (donut base) ────────────
  const postedCount = entries.filter((e) => e.status === "posted").length;
  const draftCount = entries.filter((e) => e.status === "draft").length;
  const reversedCount = entries.filter((e) => e.status === "reversed").length;
  const mixTotal = postedCount + draftCount + reversedCount;
  const pct = (part: number) => (mixTotal === 0 ? 0 : (part / mixTotal) * 100);
  const postedPct = pct(postedCount);
  const draftPct = pct(draftCount);
  const reversedPct = pct(reversedCount);

  const netIncome = Number(income?.net_income ?? 0);
  const totalAssets = Number(balance?.total_assets ?? 0);
  const openPeriods = periods.filter((p) => p.status === "open").length;
  const postedThisPeriod = sum(agg.postedAmount);

  // ─── Focus metrics ──────────────────────────────────────────────────
  const focusMetrics: FocusMetricData[] = [
    {
      title: "Net Income (Year to Date)",
      value: formatPeso(netIncome),
      tone: netIncome >= 0 ? "success" : "error",
      helper:
        "Revenue less expenses across posted entries for the current year. Drives how profitable the books look right now.",
      href: "/accounting/reports/income-statement",
      actionLabel: "Open income statement",
    },
    {
      title: "Total Assets",
      value: formatPeso(totalAssets),
      tone: "primary",
      helper:
        "What the business owns as of today, taken straight from the posted ledger balances.",
      href: "/accounting/reports/balance-sheet",
      actionLabel: "Open balance sheet",
    },
  ];

  // ─── KPIs ───────────────────────────────────────────────────────────
  const monthlyEntryCounts = agg.postedCount.map(
    (value, index) =>
      value + agg.draftCount[index] + agg.reversedCount[index],
  );

  const kpis: KpiCardData[] = [
    {
      title: "Chart of Accounts",
      value: String(stats?.total ?? 0),
      tone: "primary",
      caption: `${stats?.active ?? 0} active · ${stats?.posting ?? 0} posting accounts.`,
      trend: agg.postedCount,
    },
    {
      title: "Journal Entries",
      value: String(journalsQuery.data?.meta.total ?? 0),
      tone: "info",
      caption: `${postedCount} posted · ${draftCount} draft in the recent window.`,
      trend: monthlyEntryCounts,
    },
    {
      title: "Open Periods",
      value: String(openPeriods),
      tone: openPeriods === 0 ? "warning" : "success",
      caption:
        openPeriods === 0
          ? "No open period — posting is currently blocked."
          : "Accounting periods currently accepting entries.",
      trend: agg.postedCount,
    },
    {
      title: "Posted This Period",
      value: formatCompactPeso(postedThisPeriod),
      tone: "success",
      caption: "Total debit value posted across the last six months.",
      trend: agg.postedAmount,
    },
  ];

  // ─── Watchlist ──────────────────────────────────────────────────────
  const attentionCards: AttentionCardData[] = [
    {
      title: "Drafts Awaiting Posting",
      description:
        draftCount === 0
          ? "No drafts waiting — entries are being posted promptly."
          : `${draftCount} draft entr${draftCount === 1 ? "y" : "ies"} still to review and post.`,
      href: "/accounting/journals",
      icon: ICONS.draft,
      tone: draftCount === 0 ? "success" : "warning",
    },
    {
      title: "Reversed Entries",
      description:
        reversedCount === 0
          ? "No reversals in the recent window."
          : `${reversedCount} entr${reversedCount === 1 ? "y has" : "ies have"} been reversed — confirm the corrections landed.`,
      href: "/accounting/journals",
      icon: ICONS.reversed,
      tone: reversedCount === 0 ? "info" : "warning",
    },
    {
      title: "Open Periods",
      description:
        openPeriods === 0
          ? "No period is open. Open one before new entries can be posted."
          : `${openPeriods} period${openPeriods === 1 ? "" : "s"} open and accepting entries.`,
      href: "/accounting/periods",
      icon: ICONS.period,
      tone: openPeriods === 0 ? "error" : "success",
    },
    {
      title: "Trial Balance",
      description:
        trial?.balanced === false
          ? "Debits and credits are out of balance — review the ledger."
          : "Debits and credits are in balance as of today.",
      href: "/accounting/reports/trial-balance",
      icon: ICONS.balance,
      tone: trial?.balanced === false ? "error" : "success",
    },
  ];

  // ─── Posting activity (area) ────────────────────────────────────────
  const postingActivitySeries = [
    { name: "Posted", data: agg.postedAmount },
    { name: "Draft", data: agg.draftAmount },
  ];
  const latestPosted = agg.postedAmount.at(-1) ?? 0;
  const latestDraft = agg.draftAmount.at(-1) ?? 0;
  const postingActivityLegend: LegendItemData[] = [
    {
      label: "Posted",
      value: `${formatCompactPeso(latestPosted)} latest month`,
      tone: "success",
    },
    {
      label: "Draft",
      value: `${formatCompactPeso(latestDraft)} latest month`,
      tone: "warning",
    },
    {
      label: "Net Movement",
      value: `${formatCompactPeso(sum(agg.postedAmount))} posted`,
      tone: "primary",
    },
  ];

  // ─── Status mix (donut) ─────────────────────────────────────────────
  const statusMixSeries = [
    Number(postedPct.toFixed(1)),
    Number(draftPct.toFixed(1)),
    Number(reversedPct.toFixed(1)),
  ];
  const statusMixLegend: LegendItemData[] = [
    { label: "Posted", value: `${postedPct.toFixed(0)}%`, tone: "success" },
    { label: "Draft", value: `${draftPct.toFixed(0)}%`, tone: "warning" },
    { label: "Reversed", value: `${reversedPct.toFixed(0)}%`, tone: "error" },
  ];

  // ─── Status flow (bar) ──────────────────────────────────────────────
  const statusFlowSeries = [
    { name: "Posted", data: agg.postedCount },
    { name: "Draft", data: agg.draftCount },
    { name: "Reversed", data: agg.reversedCount },
  ];
  const statusFlowLegend: LegendItemData[] = [
    {
      label: "Posted",
      value: `${agg.postedCount.at(-1) ?? 0} latest month`,
      tone: "success",
    },
    {
      label: "Draft",
      value: `${agg.draftCount.at(-1) ?? 0} latest month`,
      tone: "warning",
    },
    {
      label: "Reversed",
      value: `${agg.reversedCount.at(-1) ?? 0} latest month`,
      tone: "error",
    },
  ];

  const categories = agg.labels;

  const postingActivityOptions = useMemo(
    () => buildPostingActivityOptions({ theme, categories }),
    [theme, categories],
  );
  const statusMixOptions = useMemo(
    () => buildStatusMixOptions(theme, postedPct),
    [theme, postedPct],
  );
  const statusFlowOptions = useMemo(
    () => buildStatusFlowOptions({ theme, categories }),
    [theme, categories],
  );

  return {
    isLoading,
    focusMetrics,
    kpis,
    attentionCards,
    postingActivitySeries,
    postingActivityLegend,
    postingActivityOptions,
    statusMixSeries,
    statusMixLegend,
    statusMixOptions,
    statusFlowSeries,
    statusFlowLegend,
    statusFlowOptions,
  };
};
