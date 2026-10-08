"use client";

import { useEffect, useState } from "react";

import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";

import CustomDialog from "@components/app/CustomDialog";
import BomCostingPreviewView from "@/modules/ordering/views/bom-costing/BomCostingPreviewView";
import InvoicePreviewView from "@/modules/ordering/views/invoices/InvoicePreviewView";

import type { IncomeExpenseIncomeRow } from "../../api/types";

type DocumentTab = "invoice" | "bom";

type IncomeDocumentsDialogProps = {
  row: IncomeExpenseIncomeRow | null;
  onClose: () => void;
};

const IncomeDocumentsDialog = ({
  row,
  onClose,
}: IncomeDocumentsDialogProps) => {
  const [tab, setTab] = useState<DocumentTab>("invoice");

  useEffect(() => {
    if (row) setTab("invoice");
  }, [row]);

  return (
    <CustomDialog
      open={Boolean(row)}
      onClose={onClose}
      closeAfterTransition
      width="1180px"
      icon={<i className="bx bx-receipt" />}
      title={row ? `Documents • ${row.reference}` : "Invoice documents"}
      description={
        row
          ? "Review the original printable invoice and its linked BOM costing."
          : undefined
      }
      actions={
        <Button
          onClick={onClose}
          variant="contained"
          startIcon={<i className="bx bx-x" />}
        >
          Close
        </Button>
      }
    >
      {row && (
        <Box sx={{ mt: 2 }}>
          <Tabs
            value={tab}
            onChange={(_, value: DocumentTab) => setTab(value)}
            aria-label="Invoice documents"
            sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}
          >
            <Tab
              value="invoice"
              label="Invoice"
              icon={<i className="bx bx-receipt" />}
              iconPosition="start"
            />
            <Tab
              value="bom"
              label="BOM Costing"
              icon={<i className="bx bx-calculator" />}
              iconPosition="start"
            />
          </Tabs>

          {tab === "invoice" ? (
            <InvoicePreviewView soaId={row.id} embedded />
          ) : (
            <BomCostingPreviewView orderId={row.order_id} embedded />
          )}
        </Box>
      )}
    </CustomDialog>
  );
};

export default IncomeDocumentsDialog;
