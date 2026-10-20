"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import Link from "@components/Link";
import { useAuthorization } from "@/modules/auth/hooks/useAuthorization";

import CollectionSummaryCards from "../components/CollectionSummaryCards";
import { useCollectionSummary } from "../hooks/useCollections";
import { useLoanSettings } from "../hooks/useLoanSettings";

type Tile = { title: string; description: string; icon: string; href: string; visible: boolean };

export default function LoanOverviewView() {
  const authorization = useAuthorization();
  const canSeeSettings = authorization.can("loan.settings.manage");
  const settings = useLoanSettings(canSeeSettings).data?.data;
  const canSeeLoans = authorization.can("loan.payments.view");
  const collections = useCollectionSummary(canSeeLoans).data?.data;

  const tiles: Tile[] = [
    {
      title: "Members",
      description: "Add members, import them from Excel, and keep mobile numbers up to date.",
      icon: "bx-id-card",
      href: "/members",
      visible: authorization.can("members.view"),
    },
    {
      title: "Applications",
      description: "Review submitted applications, then accept, return or reject them.",
      icon: "bx-file",
      href: "/loan/applications",
      visible: authorization.can("loan.applications.view"),
    },
    {
      title: "Collections",
      description: "See which loans are overdue, delinquent or in default, and who to follow up.",
      icon: "bx-bell",
      href: "/loan/collections",
      visible: canSeeLoans,
    },
    {
      title: "Loans and payments",
      description: "Look up a loan, record a payment, print a receipt, and see what is overdue.",
      icon: "bx-money",
      href: "/loan/loans",
      visible: authorization.can("loan.payments.view"),
    },
    {
      title: "Loan products",
      description: "Set amounts, interest, terms, fees, and penalties for each product.",
      icon: "bx-purchase-tag-alt",
      href: "/loan/products",
      visible: authorization.can("loan.products.manage"),
    },
    {
      title: "Approval levels",
      description: "Choose who approves loans and from which amount each level is required.",
      icon: "bx-git-merge",
      href: "/loan/approval-levels",
      visible: canSeeSettings,
    },
    {
      title: "Settings",
      description: "Choose who can reach the member portal and set the sign-out time.",
      icon: "bx-cog",
      href: "/loan/settings",
      visible: canSeeSettings,
    },
  ];

  return (
    <Stack spacing={5}>
      <Stack spacing={0.5}>
        <Typography variant="h4">Loan</Typography>
        <Typography variant="body2" color="text.secondary">
          Manage the cooperative&apos;s member portal and loan setup.
        </Typography>
      </Stack>

      {collections && <CollectionSummaryCards summary={collections} showAging={false} />}

      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
            <Stack spacing={0.5}>
              <Typography variant="h6">Member portal</Typography>
              <Typography variant="body2" color="text.secondary">
                Members sign in with their member code at <code>/loan-portal</code>.
              </Typography>
            </Stack>
            {settings && (
              <Chip
                variant="tonal"
                color={settings.portal_access_mode === "online" ? "warning" : "success"}
                label={
                  settings.portal_access_mode === "online"
                    ? "Open to the internet"
                    : `Network only (${settings.allowed_networks.length} address${settings.allowed_networks.length === 1 ? "" : "es"})`
                }
              />
            )}
          </Stack>
        </CardContent>
      </Card>

      <Box className="grid gap-5 sm:grid-cols-2">
        {tiles
          .filter((tile) => tile.visible)
          .map((tile) => (
            <Card key={tile.href} component={Link} href={tile.href} sx={{ textDecoration: "none" }}>
              <CardContent>
                <Stack direction="row" spacing={3} alignItems="center">
                  <Box sx={{ fontSize: 28, color: "primary.main", display: "grid", placeItems: "center" }}>
                    <i className={`bx ${tile.icon}`} />
                  </Box>
                  <Stack spacing={0.5}>
                    <Typography variant="h6">{tile.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {tile.description}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
      </Box>
    </Stack>
  );
}
