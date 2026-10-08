"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "react-toastify";

import CustomDialog from "@components/app/CustomDialog";
import CustomPageHeader from "@components/app/CustomPageHeader";
import Link from "@components/Link";
import CustomTextField from "@core/components/mui/TextField";
import { useAuthorization } from "@/modules/auth/hooks/useAuthorization";
import { useDebouncedValue } from "@/modules/users/hooks/useDebouncedValue";

import type { ExpenseResource, VendorResource } from "../../api/types";
import { billPaymentOptions } from "../../data/billOptions";
import {
  useCreateBill,
  useBillCategories,
  useBillPaymentAccounts,
  useUpdateBill,
  useUploadExpenseDocument,
} from "../../hooks/useBillEntryApi";
import { useVendorMutations, useVendors } from "../../hooks/useVendorsApi";
import {
  billFormSchema,
  type BillFormValues,
  type VendorFormValues,
} from "../../schemas/accountingSchemas";
import {
  applyApiErrorsToForm,
  formatPeso,
  getAccountingErrorMessage,
} from "../../utils/accountingFormat";
import { getExpenseCategoryPresentation } from "../../utils/expenseCategoryPresentation";
import AccountingDatePicker from "../shared/AccountingDatePicker";
import VendorFormDrawer from "../vendors/VendorFormDrawer";
import ExpenseDocumentsPicker, {
  type ExpenseDocumentPreview,
  type PendingExpenseDocument,
} from "../expenses/ExpenseDocumentsPicker";

const today = new Date().toISOString().slice(0, 10);
type CreateVendorOption = {
  id: "__create_vendor__";
  inputValue: string;
  name: string;
  vendorNo: "";
};
type VendorSelectOption = VendorResource | CreateVendorOption;
const filterVendorOptions = createFilterOptions<VendorSelectOption>();
const fieldMap = {
  expense_date: "expenseDate",
  expense_name: "expenseName",
  expense_category_id: "categoryId",
  total_amount: "totalAmount",
  vendor_id: "vendorId",
  "initial_payment.amount": "amountToPayNow",
  "initial_payment.paid_from_account_id": "paidFromAccountId",
} as const;

export type BillFormProps = {
  bill?: ExpenseResource;
  initialCategoryId?: string;
};

const BillForm = ({ bill, initialCategoryId }: BillFormProps) => {
  const isEditMode = Boolean(bill);
  const router = useRouter();
  const authorization = useAuthorization();
  const documentPreviewUrls = useRef(new Set<string>());
  const categoriesQuery = useBillCategories();
  const paymentAccountsQuery = useBillPaymentAccounts();
  const [vendorSearch, setVendorSearch] = useState("");
  const debouncedVendorSearch = useDebouncedValue(vendorSearch.trim(), 350);
  const vendorsQuery = useVendors({
    status: "active",
    search: debouncedVendorSearch || undefined,
    per_page: 25,
  });
  const vendorMutations = useVendorMutations();
  const createBill = useCreateBill();
  const updateBill = useUpdateBill();
  const uploadDocument = useUploadExpenseDocument();
  const [pendingDocuments, setPendingDocuments] = useState<
    PendingExpenseDocument[]
  >([]);
  const [previewDocument, setPreviewDocument] =
    useState<ExpenseDocumentPreview | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [vendorDrawerOpen, setVendorDrawerOpen] = useState(false);
  const [newVendorName, setNewVendorName] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<VendorResource | null>(
    bill?.vendor ?? null,
  );
  const cancelDestination = bill
    ? `/accounting/expenses/${bill.id}`
    : "/accounting/expenses";

  const form = useForm<BillFormValues>({
    resolver: zodResolver(billFormSchema),
    defaultValues: bill
      ? {
          expenseDate: bill.expenseDate,
          expenseName: bill.expenseName,
          categoryId: bill.category.id,
          totalAmount: bill.totalAmount,
          // Editing a draft never touches the initial-payment fields (the
          // update endpoint doesn't accept them) — kept at values that
          // trivially satisfy billFormSchema's cross-field checks since
          // those fields are hidden in edit mode.
          paymentOption: "unpaid",
          amountToPayNow: 0,
          paidFromAccountId: "",
          vendorId: bill.vendorId ?? "",
          notes: bill.notes ?? "",
        }
      : {
          expenseDate: today,
          expenseName: "",
          categoryId: initialCategoryId ?? "",
          totalAmount: 0,
          paymentOption: "full",
          amountToPayNow: 0,
          paidFromAccountId: "",
          vendorId: "",
          notes: "",
        },
  });
  const { control, formState, handleSubmit, setError, setValue } = form;
  const categoryId = useWatch({ control, name: "categoryId" });
  const totalAmount = useWatch({ control, name: "totalAmount" });
  const paymentOption = useWatch({ control, name: "paymentOption" });
  const amountToPayNow = useWatch({ control, name: "amountToPayNow" });
  const paidFromAccountId = useWatch({ control, name: "paidFromAccountId" });
  const categories = categoriesQuery.data?.data ?? [];
  const paymentAccounts = paymentAccountsQuery.data?.data ?? [];
  const vendors = vendorsQuery.data?.data ?? [];
  const vendorOptions =
    selectedVendor && !vendors.some((vendor) => vendor.id === selectedVendor.id)
      ? [selectedVendor, ...vendors]
      : vendors;
  const selectedCategory =
    categories.find((category) => category.id === categoryId) ?? null;
  const selectedCategoryPresentation = selectedCategory
    ? getExpenseCategoryPresentation(selectedCategory.slug)
    : null;
  const selectedPaymentAccount =
    paymentAccounts.find((account) => account.id === paidFromAccountId) ?? null;
  const isSubmitting =
    createBill.isPending || updateBill.isPending || uploadDocument.isPending;
  const outstandingAmount = Math.max(
    0,
    Number(totalAmount || 0) - Number(amountToPayNow || 0),
  );
  const validationErrors = Object.values(formState.errors)
    .map((error) => error?.message)
    .filter((message): message is string => typeof message === "string");

  const validateVendorRequirement = (values: BillFormValues): boolean => {
    if (selectedCategory?.requiresVendor && !values.vendorId) {
      setError("vendorId", {
        type: "required",
        message: `Select a vendor for ${selectedCategory.label} expenses.`,
      });

      return false;
    }

    return true;
  };

  useEffect(() => {
    if (paymentOption === "full")
      setValue("amountToPayNow", Number(totalAmount || 0), {
        shouldValidate: true,
      });
    if (paymentOption === "unpaid")
      setValue("amountToPayNow", 0, { shouldValidate: true });
  }, [paymentOption, setValue, totalAmount]);

  useEffect(() => {
    if (isEditMode) return;
    if (!form.getValues("paidFromAccountId") && paymentAccounts[0])
      setValue("paidFromAccountId", paymentAccounts[0].id);
  }, [form, isEditMode, paymentAccounts, setValue]);

  useEffect(
    () => () => {
      documentPreviewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );

  const addDocuments = (files: File[]) => {
    const remaining = Math.max(
      0,
      10 - (bill?.documents?.length ?? 0) - pendingDocuments.length,
    );
    const accepted = files
      .filter((file) => {
        const supported = ["image/jpeg", "image/png", "image/webp"].includes(
          file.type,
        );
        if (!supported)
          toast.error(`${file.name} must be a JPEG, PNG, or WebP image.`);
        if (file.size > 2 * 1024 * 1024)
          toast.error(`${file.name} must not exceed 2 MB.`);

        return supported && file.size <= 2 * 1024 * 1024;
      })
      .slice(0, remaining)
      .map((file) => {
        const previewUrl = URL.createObjectURL(file);
        documentPreviewUrls.current.add(previewUrl);

        return { id: crypto.randomUUID(), file, previewUrl };
      });

    if (files.length > accepted.length && remaining === 0)
      toast.info("An expense can include up to 10 photos.");

    setPendingDocuments((documents) => [...documents, ...accepted]);
  };

  const removePendingDocument = (documentId: string) => {
    setPendingDocuments((documents) => {
      const document = documents.find((item) => item.id === documentId);
      if (document) {
        URL.revokeObjectURL(document.previewUrl);
        documentPreviewUrls.current.delete(document.previewUrl);
      }

      return documents.filter((item) => item.id !== documentId);
    });
  };

  const uploadPendingDocuments = async (expenseId: string) => {
    for (const document of pendingDocuments) {
      await uploadDocument.mutateAsync({
        id: expenseId,
        document: document.file,
      });
    }
  };

  const persist = (target: "draft" | "posted") =>
    handleSubmit(async (values) => {
      if (!validateVendorRequirement(values)) return;

      try {
        const payingNow = target === "posted" && values.amountToPayNow > 0;
        const response = await createBill.mutateAsync({
          expense_date: values.expenseDate,
          expense_name: values.expenseName,
          expense_category_id: values.categoryId,
          total_amount: values.totalAmount,
          vendor_id: values.vendorId || null,
          notes: values.notes || null,
          post_now: target === "posted",
          initial_payment: payingNow
            ? {
                payment_date: values.expenseDate,
                amount: values.amountToPayNow,
                paid_from_account_id: values.paidFromAccountId ?? "",
                reference: null,
                post_now: true,
              }
            : null,
        });

        await uploadPendingDocuments(response.data.id);
        toast.success(
          target === "posted"
            ? "Expense saved and posted."
            : "Expense saved as draft.",
        );
        router.replace(`/accounting/expenses/${response.data.id}`);
      } catch (error) {
        if (!applyApiErrorsToForm(error, form.setError, fieldMap))
          toast.error(
            getAccountingErrorMessage(error, "The expense could not be saved."),
          );
      }
    })();

  // Editing a draft only ever updates fields — posting/payment stays a
  // separate, dedicated action (already available from the expenses list and
  // detail page), matching what the update endpoint actually accepts.
  const persistEdit = () =>
    handleSubmit(async (values) => {
      if (!bill) return;
      if (!validateVendorRequirement(values)) return;

      try {
        const response = await updateBill.mutateAsync({
          id: bill.id,
          payload: {
            expense_date: values.expenseDate,
            expense_name: values.expenseName,
            expense_category_id: values.categoryId,
            total_amount: values.totalAmount,
            vendor_id: values.vendorId || null,
            notes: values.notes || null,
          },
        });

        await uploadPendingDocuments(response.data.id);
        toast.success("Expense updated.");
        router.replace(`/accounting/expenses/${response.data.id}`);
      } catch (error) {
        if (!applyApiErrorsToForm(error, form.setError, fieldMap))
          toast.error(
            getAccountingErrorMessage(
              error,
              "The expense could not be updated.",
            ),
          );
      }
    })();

  const hasLoadError = categoriesQuery.isError || paymentAccountsQuery.isError;
  const hasVendorLoadError = vendorsQuery.isError;

  const createVendor = async (values: VendorFormValues) => {
    const response = await vendorMutations.create.mutateAsync({
      name: values.name,
      legal_name: values.legalName || null,
      tin: values.tin || null,
      contact_person: values.contactPerson || null,
      email: values.email || null,
      phone: values.phone || null,
      address: values.address || null,
      default_payable_account_id: values.defaultPayableAccountId || null,
      notes: values.notes || null,
      status: "active",
    });

    await vendorsQuery.refetch();
    setSelectedVendor(response.data);
    setValue("vendorId", response.data.id, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setVendorDrawerOpen(false);
    setNewVendorName("");
    toast.success("Vendor created and selected.");
  };

  return (
    <Stack spacing={5}>
      <CustomPageHeader
        title={isEditMode ? "Edit Draft Expense" : "New Expense"}
        description={
          isEditMode
            ? "Update this draft expense before posting."
            : "Record a supplier expense through the existing expense and journal workflow."
        }
      >
        <Button
          component={Link}
          href={cancelDestination}
          variant="outlined"
          color="secondary"
          startIcon={<i className="bx-arrow-back" />}
        >
          Back
        </Button>
      </CustomPageHeader>

      {(hasLoadError || hasVendorLoadError) && (
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                categoriesQuery.refetch();
                paymentAccountsQuery.refetch();
                vendorsQuery.refetch();
              }}
            >
              Retry
            </Button>
          }
        >
          Expense configuration could not be loaded.
        </Alert>
      )}

      {validationErrors.length > 0 && (
        <Alert severity="error">
          <AlertTitle>Please fix the following before saving</AlertTitle>
          <Box component="ul" sx={{ m: 0, pl: 5 }}>
            {validationErrors.map((message, index) => (
              <li key={index}>{message}</li>
            ))}
          </Box>
        </Alert>
      )}

      <Paper sx={{ p: { xs: 4, md: 5 } }}>
        <Stack spacing={3} sx={{ mb: 5 }}>
          <Controller
            control={control}
            name="categoryId"
            render={({ field, fieldState }) => (
              <Autocomplete
                openOnFocus
                size="small"
                loading={categoriesQuery.isPending}
                options={categories}
                getOptionLabel={(option) => option.label}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={
                  categories.find((category) => category.id === field.value) ??
                  null
                }
                onChange={(_, option) => field.onChange(option?.id ?? "")}
                renderOption={(props, option) => {
                  const presentation = getExpenseCategoryPresentation(
                    option.slug,
                  );

                  return (
                    <li {...props} key={option.id}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box
                          sx={{
                            display: "grid",
                            placeItems: "center",
                            width: 30,
                            height: 30,
                            borderRadius: 1,
                            color: "primary.main",
                            bgcolor: "primary.lighterOpacity",
                            fontSize: 18,
                          }}
                        >
                          <i className={presentation.icon} />
                        </Box>
                        <Stack>
                          <Typography variant="body2" fontWeight={600}>
                            {option.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.expenseAccount.name}
                          </Typography>
                        </Stack>
                      </Stack>
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <CustomTextField
                    {...params}
                    required
                    label="Expense Category"
                    error={Boolean(fieldState.error)}
                    helperText={
                      fieldState.error?.message ??
                      (selectedCategory
                        ? `Recorded under ${selectedCategory.expenseAccount.name}`
                        : "Choose the type of expense first.")
                    }
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: selectedCategoryPresentation ? (
                        <InputAdornment position="start">
                          <Box
                            sx={{
                              display: "grid",
                              placeItems: "center",
                              width: 28,
                              height: 28,
                              borderRadius: 1,
                              color: "primary.main",
                              bgcolor: "primary.lighterOpacity",
                              fontSize: 17,
                            }}
                          >
                            <i className={selectedCategoryPresentation.icon} />
                          </Box>
                        </InputAdornment>
                      ) : (
                        params.InputProps.startAdornment
                      ),
                    }}
                  />
                )}
              />
            )}
          />
          {selectedCategory && !selectedCategory.requiresVendor && (
            <Typography variant="body2" color="text.secondary">
              This internal expense uses its category payable account. A vendor
              is not required.
            </Typography>
          )}
          {selectedCategory?.requiresVendor && (
            <Controller
              control={control}
              name="vendorId"
              render={({ field, fieldState }) => (
                <Autocomplete<VendorSelectOption>
                  openOnFocus
                  fullWidth
                  size="small"
                  loading={vendorsQuery.isPending}
                  options={vendorOptions}
                  inputValue={vendorSearch}
                  onInputChange={(_, value) => setVendorSearch(value)}
                  filterOptions={(options, params) => {
                    const filtered = filterVendorOptions(options, params);
                    const name = params.inputValue.trim();
                    const exists = vendorOptions.some(
                      (vendor) =>
                        vendor.name.toLocaleLowerCase() ===
                        name.toLocaleLowerCase(),
                    );

                    if (
                      name &&
                      !exists &&
                      authorization.can("accounting.vendors.create")
                    ) {
                      filtered.push({
                        id: "__create_vendor__",
                        inputValue: name,
                        name,
                        vendorNo: "",
                      });
                    }

                    return filtered;
                  }}
                  getOptionLabel={(option) =>
                    "inputValue" in option
                      ? option.inputValue
                      : `${option.vendorNo} · ${option.name}`
                  }
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  value={
                    vendorOptions.find((vendor) => vendor.id === field.value) ??
                    null
                  }
                  onChange={(_, option) => {
                    if (option && "inputValue" in option) {
                      setNewVendorName(option.inputValue);
                      setVendorDrawerOpen(true);
                      return;
                    }
                    const vendor = option as VendorResource | null;
                    setSelectedVendor(vendor);
                    field.onChange(vendor?.id ?? "");
                  }}
                  renderOption={(props, option) => {
                    if ("inputValue" in option) {
                      return (
                        <li {...props} key={option.id}>
                          <Stack
                            direction="row"
                            spacing={1.5}
                            alignItems="center"
                          >
                            <i className="bx bx-plus" />
                            <Typography variant="body2" fontWeight={600}>
                              Add &quot;{option.inputValue}&quot; as a new
                              vendor
                            </Typography>
                          </Stack>
                        </li>
                      );
                    }

                    return (
                      <li {...props} key={option.id}>
                        <Stack>
                          <Typography variant="body2" fontWeight={600}>
                            {option.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.vendorNo}
                            {option.contactPerson
                              ? ` · ${option.contactPerson}`
                              : ""}
                          </Typography>
                        </Stack>
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <CustomTextField
                      {...params}
                      required={selectedCategory.requiresVendor}
                      label="Vendor"
                      placeholder="Search vendor name or number"
                      error={Boolean(fieldState.error)}
                      helperText={
                        fieldState.error?.message ??
                        "Select the supplier or payee for this expense."
                      }
                    />
                  )}
                />
              )}
            />
          )}
        </Stack>

        <Divider sx={{ mb: 5 }} />
        <Stack direction={{ xs: "column", lg: "row" }} spacing={6}>
          <Stack spacing={4} sx={{ flex: 1, minWidth: 0 }}>
            <Controller
              control={control}
              name="expenseDate"
              render={({ field, fieldState }) => (
                <AccountingDatePicker
                  label="Expense Date"
                  value={field.value}
                  onChange={field.onChange}
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="expenseName"
              render={({ field, fieldState }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  required
                  label="Expense Name"
                  placeholder="e.g. July electricity expense"
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="totalAmount"
              render={({ field, fieldState }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  required
                  type="number"
                  label="Total Expense Amount"
                  inputProps={{ min: 0, step: "0.01" }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">₱</InputAdornment>
                    ),
                  }}
                  onChange={(event) =>
                    field.onChange(
                      event.target.value === ""
                        ? 0
                        : Number(event.target.value),
                    )
                  }
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                />
              )}
            />
            {!isEditMode && (
              <>
                <Controller
                  control={control}
                  name="paymentOption"
                  render={({ field, fieldState }) => (
                    <CustomTextField
                      {...field}
                      select
                      fullWidth
                      required
                      label="Payment Option"
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message}
                    >
                      {billPaymentOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </CustomTextField>
                  )}
                />
                {paymentOption === "partial" && (
                  <Controller
                    control={control}
                    name="amountToPayNow"
                    render={({ field, fieldState }) => (
                      <CustomTextField
                        {...field}
                        fullWidth
                        required
                        type="number"
                        label="Amount to Pay Now"
                        inputProps={{ min: 0, step: "0.01" }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">₱</InputAdornment>
                          ),
                        }}
                        onChange={(event) =>
                          field.onChange(
                            event.target.value === ""
                              ? 0
                              : Number(event.target.value),
                          )
                        }
                        error={Boolean(fieldState.error)}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                )}
                {paymentOption !== "unpaid" && (
                  <Stack spacing={2}>
                    <Controller
                      control={control}
                      name="paidFromAccountId"
                      render={({ field, fieldState }) => (
                        <Autocomplete
                          openOnFocus
                          size="small"
                          loading={paymentAccountsQuery.isPending}
                          options={paymentAccounts}
                          getOptionLabel={(option) => option.name}
                          isOptionEqualToValue={(option, value) =>
                            option.id === value.id
                          }
                          value={
                            paymentAccounts.find(
                              (account) => account.id === field.value,
                            ) ?? null
                          }
                          onChange={(_, option) =>
                            field.onChange(option?.id ?? "")
                          }
                          renderOption={(props, option) => (
                            <li {...props} key={option.id}>
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                                sx={{ width: "100%" }}
                              >
                                <Typography variant="body2">
                                  {option.name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {formatPeso(option.currentBalance)}
                                </Typography>
                              </Stack>
                            </li>
                          )}
                          renderInput={(params) => (
                            <CustomTextField
                              {...params}
                              required
                              label="Paid From"
                              error={Boolean(fieldState.error)}
                              helperText={
                                fieldState.error?.message ??
                                "Where the payment is drawn from."
                              }
                            />
                          )}
                        />
                      )}
                    />
                    {selectedPaymentAccount && (
                      <Chip
                        size="small"
                        variant="tonal"
                        color={
                          selectedPaymentAccount.currentBalance < 0
                            ? "error"
                            : "success"
                        }
                        label={`Available balance · ${formatPeso(selectedPaymentAccount.currentBalance)}`}
                        sx={{ alignSelf: "flex-start", fontWeight: 600 }}
                      />
                    )}
                  </Stack>
                )}
                <CustomTextField
                  fullWidth
                  label="Outstanding Amount"
                  value={formatPeso(outstandingAmount)}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <i className="bx bx-lock-alt" />
                      </InputAdornment>
                    ),
                  }}
                  helperText="Calculated preview; Laravel calculates the authoritative balance."
                />
              </>
            )}
            <Controller
              control={control}
              name="notes"
              render={({ field, fieldState }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  multiline
                  minRows={3}
                  label="Notes"
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Stack>

          <Box sx={{ width: { xs: "100%", lg: 420 }, flexShrink: 0 }}>
            <ExpenseDocumentsPicker
              existingDocuments={bill?.documents ?? []}
              pendingDocuments={pendingDocuments}
              onAdd={addDocuments}
              onRemovePending={removePendingDocument}
              onPreview={setPreviewDocument}
            />
          </Box>
        </Stack>

        <Divider sx={{ my: 5 }} />
        <Stack
          direction={{ xs: "column-reverse", sm: "row" }}
          spacing={3}
          justifyContent="flex-end"
        >
          <Button
            variant="outlined"
            color="secondary"
            disabled={isSubmitting}
            onClick={() =>
              formState.isDirty || pendingDocuments.length > 0
                ? setCancelOpen(true)
                : router.push(cancelDestination)
            }
          >
            Cancel
          </Button>
          {isEditMode ? (
            <Button
              variant="contained"
              disabled={isSubmitting || categoriesQuery.isPending}
              onClick={() => void persistEdit()}
            >
              {isSubmitting ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                "Save Changes"
              )}
            </Button>
          ) : (
            <>
              <Button
                variant="tonal"
                disabled={isSubmitting || categoriesQuery.isPending}
                onClick={() => void persist("draft")}
              >
                {createBill.isPending ? "Saving..." : "Save as Draft"}
              </Button>
              <Button
                variant="contained"
                disabled={isSubmitting || categoriesQuery.isPending}
                onClick={() => void persist("posted")}
              >
                {isSubmitting ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  "Save"
                )}
              </Button>
            </>
          )}
        </Stack>
      </Paper>

      <Dialog
        open={Boolean(previewDocument)}
        onClose={() => setPreviewDocument(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {previewDocument?.originalName ?? "Document Preview"}
        </DialogTitle>
        <DialogContent dividers>
          {previewDocument && (
            <Box
              component="img"
              src={previewDocument.previewUrl}
              alt={previewDocument.originalName}
              sx={{ width: "100%", maxHeight: "70vh", objectFit: "contain" }}
            />
          )}
        </DialogContent>
      </Dialog>
      <CustomDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        closeAfterTransition
        width="480px"
        title={isEditMode ? "Discard Changes?" : "Discard New Expense?"}
        description="Your unsaved changes will be lost."
        actions={
          <>
            <Button variant="outlined" onClick={() => setCancelOpen(false)}>
              Keep Editing
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => router.push(cancelDestination)}
            >
              Discard
            </Button>
          </>
        }
      >
        <Box />
      </CustomDialog>
      <VendorFormDrawer
        open={vendorDrawerOpen}
        vendor={null}
        initialName={newVendorName}
        saving={vendorMutations.create.isPending}
        onClose={() => {
          setVendorDrawerOpen(false);
          setNewVendorName("");
        }}
        onSubmit={createVendor}
      />
    </Stack>
  );
};

export default BillForm;
