"use client";

import { useEffect, useState } from "react";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { toast } from "react-toastify";

import AccountingPageHeader from "@/modules/accounting/components/shared/AccountingPageHeader";

import {
  useAccountingDefaults,
  useAccounts,
  useFundSources,
  useTransactionSeries,
  useUpdateAccountingDefaults,
} from "@/modules/accounting/hooks/useAccountingApi";
import type { AccountingDefaultsPayload } from "@/modules/accounting/api/types";
import { getAccountingErrorMessage } from "@/modules/accounting/utils/accountingFormat";

type Form = {
  accounts_receivable_account_id: string;
  trade_receivables_account_id: string;
  sales_revenue_account_id: string;
  cash_sales_revenue_account_id: string;
  charge_sales_revenue_account_id: string;
  sales_discount_account_id: string;
  cash_account_id: string;
  cash_on_hand_account_id: string;
  bank_account_id: string;
  ewallet_account_id: string;
  card_clearing_account_id: string;
  checks_receivable_account_id: string;
  sales_tax_payable_account_id: string;
  inventory_asset_account_id: string;
  inventory_restock_clearing_account_id: string;
  cogs_account_id: string;
  inventory_adjustment_expense_account_id: string;
  partner_share_expense_account_id: string;
  partner_payable_account_id: string;
  default_transaction_series_id: string;
  default_fund_source_id: string;
};

const emptyForm: Form = {
  accounts_receivable_account_id: "",
  trade_receivables_account_id: "",
  sales_revenue_account_id: "",
  cash_sales_revenue_account_id: "",
  charge_sales_revenue_account_id: "",
  sales_discount_account_id: "",
  cash_account_id: "",
  cash_on_hand_account_id: "",
  bank_account_id: "",
  ewallet_account_id: "",
  card_clearing_account_id: "",
  checks_receivable_account_id: "",
  sales_tax_payable_account_id: "",
  inventory_asset_account_id: "",
  inventory_restock_clearing_account_id: "",
  cogs_account_id: "",
  inventory_adjustment_expense_account_id: "",
  partner_share_expense_account_id: "",
  partner_payable_account_id: "",
  default_transaction_series_id: "",
  default_fund_source_id: "",
};

const AccountingSettingsView = () => {
  const defaultsQuery = useAccountingDefaults();
  const accountsQuery = useAccounts({
    per_page: 200,
    status: "active",
    is_posting: 1,
  });
  const seriesQuery = useTransactionSeries({ status: "active" });
  const fundSourcesQuery = useFundSources({ status: "active" });
  const updateDefaults = useUpdateAccountingDefaults();

  const [form, setForm] = useState<Form>(emptyForm);

  useEffect(() => {
    const data = defaultsQuery.data?.data;
    if (!data) return;
    setForm({
      accounts_receivable_account_id: data.accountsReceivableAccountId ?? "",
      trade_receivables_account_id: data.tradeReceivablesAccountId ?? "",
      sales_revenue_account_id: data.salesRevenueAccountId ?? "",
      cash_sales_revenue_account_id: data.cashSalesRevenueAccountId ?? "",
      charge_sales_revenue_account_id: data.chargeSalesRevenueAccountId ?? "",
      sales_discount_account_id: data.salesDiscountAccountId ?? "",
      cash_account_id: data.cashAccountId ?? "",
      cash_on_hand_account_id: data.cashOnHandAccountId ?? "",
      bank_account_id: data.bankAccountId ?? "",
      ewallet_account_id: data.ewalletAccountId ?? "",
      card_clearing_account_id: data.cardClearingAccountId ?? "",
      checks_receivable_account_id: data.checksReceivableAccountId ?? "",
      sales_tax_payable_account_id: data.salesTaxPayableAccountId ?? "",
      inventory_asset_account_id: data.inventoryAssetAccountId ?? "",
      inventory_restock_clearing_account_id:
        data.inventoryRestockClearingAccountId ?? "",
      cogs_account_id: data.cogsAccountId ?? "",
      inventory_adjustment_expense_account_id:
        data.inventoryAdjustmentExpenseAccountId ?? "",
      partner_share_expense_account_id: data.partnerShareExpenseAccountId ?? "",
      partner_payable_account_id: data.partnerPayableAccountId ?? "",
      default_transaction_series_id: data.defaultTransactionSeriesId ?? "",
      default_fund_source_id: data.defaultFundSourceId ?? "",
    });
  }, [defaultsQuery.data]);

  const accounts = accountsQuery.data?.data ?? [];
  const assetAccounts = accounts.filter((account) => account.type === "asset");
  const liabilityAccounts = accounts.filter(
    (account) => account.type === "liability",
  );
  const expenseAccounts = accounts.filter(
    (account) => account.type === "expense",
  );
  const revenueAccounts = accounts.filter(
    (account) => account.type === "revenue",
  );
  const series = seriesQuery.data?.data ?? [];
  const fundSources = fundSourcesQuery.data?.data ?? [];

  const update = (key: keyof Form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const save = async () => {
    const payload: AccountingDefaultsPayload = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, value || null]),
    );

    try {
      await updateDefaults.mutateAsync(payload);
      toast.success("Accounting defaults saved.");
    } catch (error) {
      toast.error(
        getAccountingErrorMessage(error, "Defaults could not be saved."),
      );
    }
  };

  const accountSelect = (
    label: string,
    key: keyof Form,
    options = accounts,
    helper?: string,
  ) => (
    <Stack spacing={0.75}>
      <FormControl size="small" fullWidth>
        <InputLabel>{label}</InputLabel>
        <Select
          label={label}
          value={form[key]}
          onChange={(e) => update(key, e.target.value)}
        >
          <MenuItem value="">Not set</MenuItem>
          {options.map((account) => (
            <MenuItem key={account.id} value={account.id}>
              {account.code} — {account.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {helper && (
        <Typography variant="caption" color="text.secondary">
          {helper}
        </Typography>
      )}
    </Stack>
  );

  return (
    <Stack spacing={5}>
      <AccountingPageHeader
        title="Accounting Settings"
        description="Default posting accounts and numbering used by automated workflows."
      />

      <Alert severity="info">
        These defaults drive the journals generated automatically from Ordering
        and Inventory workflows. Configure them before relying on automated
        posting.
      </Alert>

      <Paper className="p-6">
        <Stack spacing={4}>
          <Typography variant="h6">Sales & Payment Accounts</Typography>
          <Typography variant="body2" color="text.secondary">
            Sales type selects the revenue account. Payment method selects the
            cash or clearing account and never records revenue a second time.
          </Typography>
          {accountSelect(
            "Legacy Accounts Receivable",
            "accounts_receivable_account_id",
            assetAccounts,
          )}
          {accountSelect(
            "Trade Receivables",
            "trade_receivables_account_id",
            assetAccounts,
          )}
          {accountSelect(
            "Legacy Sales Revenue",
            "sales_revenue_account_id",
            revenueAccounts,
          )}
          {accountSelect(
            "Cash Sales Revenue",
            "cash_sales_revenue_account_id",
            revenueAccounts,
          )}
          {accountSelect(
            "Charge Sales Revenue",
            "charge_sales_revenue_account_id",
            revenueAccounts,
          )}
          {accountSelect(
            "Sales Discount",
            "sales_discount_account_id",
            revenueAccounts,
          )}
          {accountSelect(
            "Legacy Cash / Bank",
            "cash_account_id",
            assetAccounts,
          )}
          {accountSelect(
            "Cash on Hand",
            "cash_on_hand_account_id",
            assetAccounts,
          )}
          {accountSelect("Cash in Bank", "bank_account_id", assetAccounts)}
          {accountSelect("E-wallet", "ewallet_account_id", assetAccounts)}
          {accountSelect(
            "Card Clearing",
            "card_clearing_account_id",
            assetAccounts,
          )}
          {accountSelect(
            "Checks Receivable",
            "checks_receivable_account_id",
            assetAccounts,
          )}
          {accountSelect("Sales Tax Payable", "sales_tax_payable_account_id")}

          <Divider />

          <Stack spacing={1}>
            <Typography variant="h6">Inventory Posting Accounts</Typography>
            <Typography variant="body2" color="text.secondary">
              Restocking increases inventory asset value. It should normally
              credit a payable or clearing account, not an operating expense.
              Adjustments and COGS use expense accounts when stock is corrected
              or consumed.
            </Typography>
          </Stack>
          {accountSelect(
            "Inventory Asset",
            "inventory_asset_account_id",
            assetAccounts,
            "Debited when stock is received or inventory value increases.",
          )}
          {accountSelect(
            "Restock Clearing / Payable",
            "inventory_restock_clearing_account_id",
            liabilityAccounts,
            "Credited when stock is received before supplier payment is fully matched.",
          )}
          {accountSelect(
            "Cost of Goods Sold",
            "cogs_account_id",
            expenseAccounts,
            "Debited when inventory cost leaves stock because of sales or production consumption.",
          )}
          {accountSelect(
            "Inventory Adjustment Expense",
            "inventory_adjustment_expense_account_id",
            expenseAccounts,
            "Used for shrinkage, damaged goods, count corrections, and write-offs.",
          )}

          <Divider />

          <Stack spacing={1}>
            <Typography variant="h6">Partners Posting Accounts</Typography>
            <Typography variant="body2" color="text.secondary">
              Drive the journal entries generated when a partner's revenue share
              is earned and later paid out.
            </Typography>
          </Stack>
          {accountSelect(
            "Partner Share Expense",
            "partner_share_expense_account_id",
            expenseAccounts,
            "Debited when a partner's revenue share is recognized from a customer collection.",
          )}
          {accountSelect(
            "Partner Payable",
            "partner_payable_account_id",
            liabilityAccounts,
            "Credited when earned; debited when the partner is actually paid out.",
          )}

          <Divider />

          <Typography variant="h6" sx={{ mt: 2 }}>
            Defaults
          </Typography>
          <FormControl size="small" fullWidth>
            <InputLabel>Default Transaction Series</InputLabel>
            <Select
              label="Default Transaction Series"
              value={form.default_transaction_series_id}
              onChange={(e) =>
                update("default_transaction_series_id", e.target.value)
              }
            >
              <MenuItem value="">Not set</MenuItem>
              {series.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  {option.name} ({option.prefix})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel>Default Fund Source</InputLabel>
            <Select
              label="Default Fund Source"
              value={form.default_fund_source_id}
              onChange={(e) => update("default_fund_source_id", e.target.value)}
            >
              <MenuItem value="">Not set</MenuItem>
              {fundSources.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  {option.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Stack direction="row" className="justify-end">
            <Button
              variant="contained"
              disabled={updateDefaults.isPending}
              onClick={() => void save()}
            >
              {updateDefaults.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
};

export default AccountingSettingsView;
