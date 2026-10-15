"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import Link from "@components/Link";
import { loadOrderingSettings } from "@/modules/ordering/data/orderingSettings";
import PayslipDocument from "@/modules/production/components/payslip/PayslipDocument";
import { employeesApi } from "../../api/employeesApi";
import type { PayslipResource } from "../../api/types";

type Props = { payrollId: string; itemId: string };

const PayrollPayslipPrintView = ({ payrollId, itemId }: Props) => {
  const searchParams = useSearchParams();
  const [settings] = useState(() => loadOrderingSettings());
  const [payslip, setPayslip] = useState<PayslipResource | null>(null);
  const [error, setError] = useState("");
  const returnTo = searchParams.get("returnTo");
  const backToPayroll =
    returnTo?.startsWith("/employees/payrolls") === true
      ? returnTo
      : `/employees/payrolls/${payrollId}/edit`;

  useEffect(() => {
    let active = true;

    employeesApi.payrolls
      .payslip(payrollId, itemId)
      .then(({ data }) => {
        if (active) setPayslip(data);
      })
      .catch((reason) => {
        if (active)
          setError(
            reason instanceof Error
              ? reason.message
              : "Payslip could not be loaded.",
          );
      });

    return () => {
      active = false;
    };
  }, [itemId, payrollId]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1100, mx: "auto" }}>
      <Stack
        className="order-print-hide"
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ sm: "center" }}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={800}>
            Employee Payslip
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review the generated payroll document before printing.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button
            component={Link}
            href={backToPayroll}
            color="secondary"
            variant="outlined"
            startIcon={<i className="bx bx-arrow-back" />}
          >
            Payroll
          </Button>
          <Button
            variant="contained"
            disabled={!payslip}
            startIcon={<i className="bx bx-printer" />}
            onClick={() => window.print()}
          >
            Print
          </Button>
        </Stack>
      </Stack>

      {!payslip && !error && (
        <Stack alignItems="center" sx={{ py: 12 }}>
          <CircularProgress />
        </Stack>
      )}
      {error && (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography fontWeight={700}>Payslip unavailable</Typography>
          <Typography color="text.secondary">{error}</Typography>
        </Paper>
      )}
      {payslip && (
        <Box
          className="ordering-print-viewport"
          sx={{
            overflow: "auto",
            p: { xs: 1, md: 3 },
            bgcolor: "background.default",
          }}
        >
          <PayslipDocument payslip={payslip} settings={settings} />
        </Box>
      )}
    </Box>
  );
};

export default PayrollPayslipPrintView;
