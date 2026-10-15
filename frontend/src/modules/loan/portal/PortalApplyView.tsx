"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { toast } from "react-toastify";

import { ApiError } from "@/libs/api/apiError";

import ApplicationDetailsForm from "../components/ApplicationDetailsForm";
import type { LoanProduct } from "../types";
import { formatPeso } from "../utils/applicationStatus";
import { usePortalApplicationActions, usePortalProducts } from "./usePortalApplications";
import { portalErrorStatus, usePortalMember } from "./usePortalMember";

const frequency = { weekly: "weekly", semi_monthly: "twice a month", monthly: "monthly" } as const;

export default function PortalApplyView() {
  const router = useRouter();
  const member = usePortalMember();
  const products = usePortalProducts();
  const actions = usePortalApplicationActions();
  const [selected, setSelected] = useState<LoanProduct | null>(null);

  if (portalErrorStatus(member.error) === 401) {
    router.replace("/loan-portal");

    return null;
  }

  if (products.isPending) {
    return (
      <Box className="flex min-bs-[100dvh] items-center justify-center">
        <CircularProgress size={32} />
      </Box>
    );
  }

  const list = products.data?.data ?? [];

  return (
    <Box className="mx-auto is-full max-is-[720px] p-6">
      <Stack spacing={4}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" fontWeight="bold">
            Apply for a loan
          </Typography>
          <Button color="secondary" onClick={() => router.push("/loan-portal/dashboard")}>
            Back
          </Button>
        </Stack>

        {products.isError && <Alert severity="error">The loan products could not be loaded.</Alert>}
        {!products.isError && list.length === 0 && (
          <Alert severity="info">No loans are open for application right now. Please check again later.</Alert>
        )}

        <Stack spacing={2}>
          <Typography variant="subtitle1">1. Choose a loan</Typography>
          {list.map((product) => (
            <Card key={product.id} variant="outlined" sx={{ borderColor: selected?.id === product.id ? "primary.main" : undefined, borderWidth: selected?.id === product.id ? 2 : 1 }}>
              <CardActionArea onClick={() => setSelected(product)}>
                <CardContent>
                  <Typography variant="h6">{product.name}</Typography>
                  {product.description && (
                    <Typography variant="body2" color="text.secondary">
                      {product.description}
                    </Typography>
                  )}
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {formatPeso(product.min_amount)} to {formatPeso(product.max_amount)} · {Number(product.interest_rate)}% a year (
                    {product.interest_method === "flat" ? "flat" : "diminishing"}) · {product.term_min_months} to{" "}
                    {product.term_max_months} months · paid {frequency[product.payment_frequency]}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Stack>

        {selected && (
          <Paper className="p-6">
            <Stack spacing={3}>
              <Typography variant="subtitle1">2. Tell us about the loan</Typography>
              {(selected.requires_guarantor || selected.documents.length > 0) && (
                <Alert severity="info">
                  Next you will upload {selected.documents.length > 0 ? "your documents" : "nothing"}
                  {selected.requires_guarantor ? ` and add ${selected.guarantor_count} guarantor(s)` : ""}, then submit.
                </Alert>
              )}
              <ApplicationDetailsForm
                key={selected.id}
                product={selected}
                submitLabel="Save and continue"
                pending={actions.create.isPending}
                onSubmit={(body) =>
                  actions.create.mutate(
                    { productId: selected.id, body },
                    {
                      onSuccess: (response) => router.push(`/loan-portal/applications/${response.data.id}`),
                      onError: (e) => toast.error(e instanceof ApiError ? e.message : "The application could not be saved."),
                    },
                  )
                }
              />
            </Stack>
          </Paper>
        )}
      </Stack>
    </Box>
  );
}
