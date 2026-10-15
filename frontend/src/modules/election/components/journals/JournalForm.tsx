"use client";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableFooter from "@mui/material/TableFooter";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";

import CustomDialog from "@components/app/CustomDialog";
import CustomPageHeader from "@components/app/CustomPageHeader";
import CustomTextField from "@core/components/mui/TextField";
import Link from "@components/Link";
import { useAuthorization } from "@/modules/auth/hooks/useAuthorization";
import FundSourceFormDrawer from "../fund-sources/FundSourceFormDrawer";
import AccountingDatePicker from "../shared/AccountingDatePicker";
import JournalItemRow from "./JournalItemRow";

import {
  useAccounts,
  useCreateFundSource,
  useCreateJournal,
  useFundSources,
  useJournal,
  usePostJournal,
  useTaxes,
  useTransactionSeries,
  useUpdateJournal,
} from "../../hooks/useAccountingApi";
import type { FundSourcePayload, JournalEntryPayload } from "../../api/types";
import {
  journalLineDefault,
  journalSchema,
  type JournalFormValues,
} from "../../schemas/accountingSchemas";
import {
  applyApiErrorsToForm,
  formatPeso,
  getAccountingErrorMessage,
} from "../../utils/accountingFormat";

type JournalFormProps = {
  mode: "create" | "edit";
  entryId?: string;
};

const today = new Date().toISOString().slice(0, 10);

const JournalForm = ({ mode, entryId }: JournalFormProps) => {
  const router = useRouter();
  const authorization = useAuthorization();
  const isEdit = mode === "edit";

  const accountsQuery = useAccounts({
    per_page: 200,
    status: "active",
    is_posting: 1,
  });
  const seriesQuery = useTransactionSeries({ status: "active" });
  const fundSourcesQuery = useFundSources({ status: "active" });
  const taxesQuery = useTaxes({ per_page: 100 });
  const journalQuery = useJournal(isEdit && entryId ? entryId : "");

  const createJournal = useCreateJournal();
  const updateJournal = useUpdateJournal();
  const postJournal = usePostJournal();
  const createFundSource = useCreateFundSource();
  const isSubmitting =
    createJournal.isPending ||
    updateJournal.isPending ||
    postJournal.isPending ||
    createFundSource.isPending;
  const canManageFundSources = authorization.can("accounting.settings.manage");

  // Accounts sorted by type so the Autocomplete groups cleanly.
  const accounts = useMemo(
    () =>
      [...(accountsQuery.data?.data ?? [])].sort(
        (a, b) => a.type.localeCompare(b.type) || a.code.localeCompare(b.code),
      ),
    [accountsQuery.data],
  );
  const series = seriesQuery.data?.data ?? [];
  const fundSources = fundSourcesQuery.data?.data ?? [];
  const taxes = useMemo(
    () =>
      (taxesQuery.data?.data ?? []).filter((tax) => tax.status === "active"),
    [taxesQuery.data],
  );

  const form = useForm<JournalFormValues>({
    resolver: zodResolver(journalSchema),
    defaultValues: {
      entryDate: today,
      type: "general",
      reference: "",
      memo: "",
      transactionSeriesId: "",
      fundSourceId: "",
      items: [journalLineDefault, journalLineDefault],
    },
  });

  const { control, handleSubmit, reset, formState } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const [cancelOpen, setCancelOpen] = useState(false);
  const [fundSourceSearch, setFundSourceSearch] = useState("");
  const [fundSourceDrawerOpen, setFundSourceDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isEdit) return;

    const entry = journalQuery.data?.data;

    if (!entry) return;

    reset({
      entryDate: entry.entryDate?.slice(0, 10) ?? today,
      type: entry.type === "reversal" ? "general" : entry.type,
      reference: entry.reference ?? "",
      memo: entry.memo ?? "",
      transactionSeriesId: entry.transactionSeriesId ?? "",
      fundSourceId: entry.fundSourceId ?? "",
      items: (entry.items ?? []).map((item) => ({
        accountId: item.accountId,
        taxId: item.taxId ?? "",
        description: item.description ?? "",
        debit: item.debit ?? 0,
        credit: item.credit ?? 0,
      })),
    });
  }, [isEdit, journalQuery.data, reset]);

  const watchedItems = useWatch({ control, name: "items" });
  const totals = useMemo(() => {
    let debit = 0;
    let credit = 0;

    watchedItems?.forEach((line) => {
      debit += Number(line.debit) || 0;
      credit += Number(line.credit) || 0;
    });

    return {
      debit: Math.round(debit * 100) / 100,
      credit: Math.round(credit * 100) / 100,
    };
  }, [watchedItems]);

  const balanced = totals.debit === totals.credit && totals.debit > 0;
  const difference = Math.abs(totals.debit - totals.credit);

  const addRow = () => append(journalLineDefault);

  const searchedFundSource = fundSourceSearch.trim();
  const hasFundSourceMatch = fundSources.some((option) => {
    const search = searchedFundSource.toLowerCase();

    return (
      option.name.toLowerCase().includes(search) ||
      (option.code ?? "").toLowerCase().includes(search)
    );
  });
  const canQuickCreateFundSource =
    canManageFundSources &&
    searchedFundSource.length > 0 &&
    !hasFundSourceMatch;
  const initialFundSourceValues = useMemo(
    () => ({
      name: searchedFundSource,
      status: "active" as const,
    }),
    [searchedFundSource],
  );

  const openFundSourceCreate = () => {
    if (!canQuickCreateFundSource) return;

    setFundSourceDrawerOpen(true);
  };

  const buildPayload = (values: JournalFormValues): JournalEntryPayload => ({
    entry_date: values.entryDate,
    type: values.type,
    reference: values.reference || null,
    memo: values.memo || null,
    transaction_series_id: values.transactionSeriesId || null,
    fund_source_id: values.fundSourceId || null,
    items: values.items.map((line) => ({
      account_id: line.accountId,
      tax_id: line.taxId || null,
      description: line.description || null,
      debit: Number(line.debit) || 0,
      credit: Number(line.credit) || 0,
    })),
  });

  const persist = (target: "draft" | "posted") =>
    handleSubmit(async (values) => {
      const payload = buildPayload(values);

      try {
        let id = entryId;

        if (isEdit && entryId) {
          await updateJournal.mutateAsync({ id: entryId, payload });
        } else {
          const response = await createJournal.mutateAsync(payload);

          id = response.data.id;
        }

        if (target === "posted" && id) {
          await postJournal.mutateAsync(id);
          toast.success("Journal entry posted.");
        } else {
          toast.success(isEdit ? "Draft updated." : "Draft saved.");
        }

        if (id) router.push(`/accounting/journals/${id}`);
      } catch (error) {
        if (!applyApiErrorsToForm(error, form.setError)) {
          toast.error(
            getAccountingErrorMessage(error, "The entry could not be saved."),
          );
        }
      }
    })();

  const handleDiscard = () => {
    if (formState.isDirty) {
      setCancelOpen(true);

      return;
    }

    router.push("/accounting/journals");
  };

  const handleCreateFundSource = async (payload: FundSourcePayload) => {
    const response = await createFundSource.mutateAsync(payload);

    form.setValue("fundSourceId", response.data.id, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setFundSourceSearch("");
  };

  return (
    <Stack spacing={5}>
      <CustomPageHeader
        title={isEdit ? "Edit Journal Entry" : "New Journal Entry"}
        description="Record a balanced double-entry transaction."
      >
        <Button
          component={Link}
          href="/accounting/journals"
          variant="outlined"
          color="secondary"
          startIcon={<i className="bx-arrow-back" />}
        >
          Back
        </Button>
      </CustomPageHeader>

      {/* Entry details */}
      <Paper sx={{ p: 5 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={6}>
          <Stack spacing={4} sx={{ flex: 2 }}>
            <Controller
              control={control}
              name="transactionSeriesId"
              render={({ field }) => (
                <Autocomplete
                  openOnFocus
                  size="small"
                  options={series}
                  getOptionLabel={(option) =>
                    `${option.prefix} (${option.name})`
                  }
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  value={
                    series.find((option) => option.id === field.value) ?? null
                  }
                  onChange={(_, option) =>
                    field.onChange(option ? option.id : "")
                  }
                  renderInput={(params) => (
                    <CustomTextField
                      {...params}
                      label="Journal #"
                      placeholder="Select series"
                    />
                  )}
                />
              )}
            />
            <Controller
              control={control}
              name="entryDate"
              render={({ field, fieldState }) => (
                <AccountingDatePicker
                  label="Entry Date"
                  value={field.value}
                  onChange={field.onChange}
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  select
                  fullWidth
                  label="Journal Type"
                >
                  <MenuItem value="general">General</MenuItem>
                  <MenuItem value="adjusting">Adjusting</MenuItem>
                  <MenuItem value="closing">Closing</MenuItem>
                </CustomTextField>
              )}
            />
            <Controller
              control={control}
              name="fundSourceId"
              render={({ field }) => (
                <Autocomplete
                  openOnFocus
                  size="small"
                  options={fundSources}
                  onInputChange={(_, value, reason) => {
                    if (reason !== "reset") {
                      setFundSourceSearch(value);
                    }
                  }}
                  getOptionLabel={(option) => option.name}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  value={
                    fundSources.find((option) => option.id === field.value) ??
                    null
                  }
                  onChange={(_, option) => {
                    field.onChange(option ? option.id : "");
                    setFundSourceSearch("");
                  }}
                  noOptionsText={
                    canQuickCreateFundSource ? (
                      <Button
                        fullWidth
                        size="small"
                        variant="text"
                        color="primary"
                        startIcon={<i className="bx bx-plus" />}
                        sx={{ justifyContent: "flex-start" }}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={openFundSourceCreate}
                      >
                        Create fund source &quot;{searchedFundSource}&quot;
                      </Button>
                    ) : (
                      "No fund sources found"
                    )
                  }
                  renderInput={(params) => (
                    <CustomTextField
                      {...params}
                      label="Fund Source"
                      placeholder="Search or select fund source"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {canQuickCreateFundSource && (
                              <InputAdornment position="end">
                                <Button
                                  size="small"
                                  variant="tonal"
                                  startIcon={<i className="bx bx-plus" />}
                                  disabled={createFundSource.isPending}
                                  onMouseDown={(event) =>
                                    event.preventDefault()
                                  }
                                  onClick={openFundSourceCreate}
                                >
                                  Create
                                </Button>
                              </InputAdornment>
                            )}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              )}
            />
            <Controller
              control={control}
              name="reference"
              render={({ field }) => (
                <CustomTextField {...field} fullWidth label="Reference #" />
              )}
            />
          </Stack>

          <Stack spacing={2} sx={{ flex: 3 }}>
            <Controller
              control={control}
              name="memo"
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  multiline
                  label="Note"
                  placeholder="Max. 500 characters"
                  minRows={12}
                  sx={{
                    height: "100%",
                    "& .MuiInputBase-root": {
                      height: "100%",
                      alignItems: "flex-start",
                    },
                  }}
                />
              )}
            />
          </Stack>
        </Stack>
      </Paper>

      {formState.errors.items?.message && (
        <Typography variant="body2" color="error">
          {formState.errors.items.message as string}
        </Typography>
      )}

      <Box>
        <Button
          onClick={addRow}
          disabled={isSubmitting}
          startIcon={<i className="bx-plus" />}
        >
          Add New Row
        </Button>
      </Box>

      {/* Items table */}
      <Paper sx={{ p: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>ACCOUNT</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>DESCRIPTION</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>TAX</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                DEBIT
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                CREDIT
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">
                REMOVE
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fields.map((field, index) => (
              <JournalItemRow
                key={field.id}
                index={index}
                control={control}
                isLastRow={index === fields.length - 1}
                isSubmitting={isSubmitting}
                onAppend={addRow}
                isDeleteDisabled={fields.length <= 2}
                onRemove={() => remove(index)}
                accounts={accounts}
                taxes={taxes}
                shouldAutoFocus
              />
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3} align="right">
                <Typography variant="subtitle2" fontWeight={700}>
                  TOTAL
                  {!balanced && totals.debit + totals.credit > 0 && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ display: "block" }}
                    >
                      Out of balance by {formatPeso(difference)}
                    </Typography>
                  )}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="subtitle2" fontWeight={700}>
                  {formatPeso(totals.debit)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="subtitle2" fontWeight={700}>
                  {formatPeso(totals.credit)}
                </Typography>
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </Paper>

      {/* Actions */}
      <Stack direction="row" spacing={2}>
        <Button
          variant="contained"
          disabled={!balanced || isSubmitting}
          onClick={() => void persist("posted")}
        >
          Post Entry
        </Button>
        <Button
          variant="outlined"
          disabled={!balanced || isSubmitting}
          onClick={() => void persist("draft")}
        >
          {isEdit ? "Save Changes" : "Save as Draft"}
        </Button>
        <Button
          color={formState.isDirty ? "error" : "secondary"}
          disabled={isSubmitting}
          onClick={handleDiscard}
        >
          {formState.isDirty ? "Discard" : "Cancel"}
        </Button>
      </Stack>

      <CustomDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        closeAfterTransition
        width="440px"
        title="Discard Changes"
        icon={<i className="bx bx-error-circle text-error" />}
        description="Are you sure you want to discard your changes?"
        actions={
          <>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => setCancelOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => router.push("/accounting/journals")}
            >
              Discard
            </Button>
          </>
        }
      >
        <span />
      </CustomDialog>

      <FundSourceFormDrawer
        open={fundSourceDrawerOpen}
        onClose={() => {
          if (createFundSource.isPending) return;

          setFundSourceDrawerOpen(false);
        }}
        editing={null}
        initialValues={initialFundSourceValues}
        isSubmitting={createFundSource.isPending}
        onSubmit={async (payload) => {
          await handleCreateFundSource(payload);
          setFundSourceDrawerOpen(false);
        }}
      />
    </Stack>
  );
};

export default JournalForm;
