"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import Link from "@components/Link";
import { filterAuthorizedItems } from "@/modules/auth/authorization/authorization";
import { useAuthorization } from "@/modules/auth/hooks/useAuthorization";

import type { StatementType } from "../../api/types";
import InquiryPageHeader from "../../components/shared/InquiryPageHeader";
import { inquiryNavigation } from "../../data/inquiryNavigation";
import { useInquirySummary } from "../../hooks/useInquiryApi";
import { formatDate, formatDateTime, formatMoney, getInquiryErrorMessage } from "../../utils/inquiryFormat";

const importLabels: Record<StatementType, string> = {
  balances: "Account balances",
  transactions: "Savings transactions",
  loans: "Loan balances",
};

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="h5">{value}</Typography>
        {hint && <Typography variant="body2" color="text.secondary">{hint}</Typography>}
      </CardContent>
    </Card>
  );
}

export default function InquiryDashboardView() {
  const authorization = useAuthorization();
  const canView = authorization.can("inquiry.statements.view");
  const query = useInquirySummary();
  const summary = query.data?.data;
  const links = filterAuthorizedItems(
    authorization.user,
    inquiryNavigation.flatMap((group) => group.items).filter((item) => item.href !== "/inquiry"),
  );

  return (
    <Stack spacing={5}>
      <InquiryPageHeader title="Member Inquiry" description="Balances, savings activity and loans for the inquiry station." />

      {canView && query.isError && (
        <Alert severity="error">{getInquiryErrorMessage(query.error, "The summary could not be loaded.")}</Alert>
      )}

      {canView && summary && (
        <>
          <Box sx={{ display: "grid", gap: 4, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" } }}>
            <Stat label="Members with balances" value={String(summary.balances.members)} hint={`As of ${formatDate(summary.balances.as_of_date)}`} />
            <Stat label="Total share capital" value={formatMoney(summary.balances.share_capital)} />
            <Stat label="Total savings" value={formatMoney(summary.balances.savings)} hint="Regular, bonus and time deposit" />
            <Stat label="Loan principal outstanding" value={formatMoney(summary.loans.principal_balance)} hint={`${summary.loans.count} loans · ${summary.loans.borrowers} borrowers`} />
          </Box>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Last imports</Typography>
              <Stack spacing={1.5}>
                {(Object.keys(importLabels) as StatementType[]).map((type) => {
                  const last = summary.last_imports[type];

                  return (
                    <Stack key={type} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                      <Typography fontWeight={600}>{importLabels[type]}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {last
                          ? `${last.row_count} rows · ${last.file_name} · ${formatDateTime(last.imported_at)}${last.imported_by ? ` · ${last.imported_by}` : ""}`
                          : "Not imported yet"}
                      </Typography>
                    </Stack>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>
        </>
      )}

      <Box sx={{ display: "grid", gap: 4, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" } }}>
        {links.map((item) => (
          <Card key={item.href}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={2}>
                  <i className={item.icon} style={{ fontSize: 24 }} />
                  <Typography variant="h6">{item.label}</Typography>
                </Stack>
                <Button component={Link} href={item.href} size="small">Open</Button>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Stack>
  );
}
