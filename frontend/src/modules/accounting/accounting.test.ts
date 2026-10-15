import { describe, expect, it, vi } from "vitest";

import { ApiError } from "@/libs/api/apiError";
import { accountingQueryKeys } from "./queryKeys";
import { billPaymentOptions } from "./data/billOptions";
import {
  accountSchema,
  billFormSchema,
  journalSchema,
  paymentRecordingSchema,
  vendorSchema,
} from "./schemas/accountingSchemas";
import { applyApiErrorsToForm } from "./utils/accountingFormat";
import {
  canRecordBillPayment,
  getBillPayeeName,
  billListState,
  paymentAmountError,
} from "./utils/bills";

describe("accountingQueryKeys", () => {
  it("namespaces and parameterizes keys deterministically", () => {
    expect(accountingQueryKeys.all).toEqual(["accounting"]);
    expect(accountingQueryKeys.accounts.list({ page: 2 })).toEqual([
      "accounting",
      "accounts",
      "list",
      { page: 2 },
    ]);
    expect(accountingQueryKeys.journals.detail("abc")).toEqual([
      "accounting",
      "journals",
      "detail",
      "abc",
    ]);
    // Same params produce an equal (cache-stable) key.
    expect(
      accountingQueryKeys.reports.trialBalance({ date: "2026-01-01" }),
    ).toEqual(accountingQueryKeys.reports.trialBalance({ date: "2026-01-01" }));
  });
});

describe("accountSchema", () => {
  it("requires a code and name", () => {
    const result = accountSchema.safeParse({
      code: "",
      name: "",
      type: "asset",
      isPosting: true,
      isContra: false,
      status: "active",
    });

    expect(result.success).toBe(false);
  });

  it("accepts a valid account", () => {
    const result = accountSchema.safeParse({
      code: "1000",
      name: "Cash",
      type: "asset",
      isPosting: true,
      isContra: false,
      status: "active",
      description: "",
    });

    expect(result.success).toBe(true);
  });
});

describe("journalSchema", () => {
  const base = {
    entryDate: "2026-06-16",
    type: "general" as const,
    reference: "",
    memo: "",
    transactionSeriesId: "",
    fundSourceId: "",
  };

  it("rejects an unbalanced entry", () => {
    const result = journalSchema.safeParse({
      ...base,
      items: [
        { accountId: "a", description: "", debit: 100, credit: 0 },
        { accountId: "b", description: "", debit: 0, credit: 90 },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("accepts a balanced entry", () => {
    const result = journalSchema.safeParse({
      ...base,
      items: [
        { accountId: "a", description: "", debit: 100, credit: 0 },
        { accountId: "b", description: "", debit: 0, credit: 100 },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects a line with both debit and credit", () => {
    const result = journalSchema.safeParse({
      ...base,
      items: [
        { accountId: "a", description: "", debit: 50, credit: 50 },
        { accountId: "b", description: "", debit: 0, credit: 0 },
      ],
    });

    expect(result.success).toBe(false);
  });
});

describe("expense entry", () => {
  it("offers explicit payment choices without accepting a client status", () => {
    expect(billPaymentOptions.map((option) => option.value)).toEqual([
      "full",
      "partial",
      "unpaid",
    ]);
  });

  it("accepts a complete expense entry and rejects a zero amount", () => {
    const entry = {
      expenseDate: "2026-07-04",
      expenseName: "Office paper",
      categoryId: "category-id",
      totalAmount: 450,
      paymentOption: "full" as const,
      amountToPayNow: 450,
      paidFromAccountId: "cash-account",
      vendorId: "vendor-id",
      notes: "",
      receiptNumber: "OR-100",
    };

    expect(billFormSchema.safeParse(entry).success).toBe(true);
    expect(billFormSchema.safeParse({ ...entry, totalAmount: 0 }).success).toBe(
      false,
    );
    expect(
      billFormSchema.safeParse({
        ...entry,
        paymentOption: "unpaid",
        amountToPayNow: 0,
        paidFromAccountId: "",
      }).success,
    ).toBe(true);
    expect(
      billFormSchema.safeParse({
        ...entry,
        paymentOption: "partial",
        amountToPayNow: 100,
        paidFromAccountId: "",
      }).success,
    ).toBe(false);
  });
});

describe("applyApiErrorsToForm", () => {
  it("maps Laravel 422 errors to form fields with key translation", () => {
    const setError = vi.fn();
    const error = new ApiError(
      422,
      { is_posting: ["The posting flag is invalid."], name: ["Required."] },
      "Validation failed.",
    );

    const handled = applyApiErrorsToForm(error, setError, {
      is_posting: "isPosting",
    });

    expect(handled).toBe(true);
    expect(setError).toHaveBeenCalledWith("isPosting", {
      type: "server",
      message: "The posting flag is invalid.",
    });
    expect(setError).toHaveBeenCalledWith("name", {
      type: "server",
      message: "Required.",
    });
  });

  it("ignores non-422 errors", () => {
    const setError = vi.fn();
    const handled = applyApiErrorsToForm(
      new ApiError(500, {}, "Server error"),
      setError,
    );

    expect(handled).toBe(false);
    expect(setError).not.toHaveBeenCalled();
  });
});

describe("accounts payable UI rules", () => {
  it("validates payment inputs and protects the outstanding balance", () => {
    expect(
      paymentRecordingSchema.safeParse({
        paymentDate: "2026-07-04",
        amount: 250,
        paidFromAccountId: "cash",
        reference: "PAY-1",
        notes: "",
      }).success,
    ).toBe(true);
    expect(
      paymentRecordingSchema.safeParse({
        paymentDate: "",
        amount: 0,
        paidFromAccountId: "",
      }).success,
    ).toBe(false);
    expect(paymentAmountError(0, 500)).toContain("greater than zero");
    expect(paymentAmountError(501, 500)).toContain("outstanding");
    expect(paymentAmountError(500, 500)).toBeNull();
  });

  it("leaves category-specific vendor enforcement to the expense form and API", () => {
    expect(
      billFormSchema.safeParse({
        expenseDate: "2026-07-04",
        expenseName: "Paper bill",
        categoryId: "category-id",
        totalAmount: 100,
        paymentOption: "unpaid",
        amountToPayNow: 0,
        paidFromAccountId: "",
        vendorId: "",
        notes: "",
        receiptNumber: "",
      }).success,
    ).toBe(true);
    expect(
      vendorSchema.safeParse({
        name: "Paper House",
        legalName: "",
        tin: "",
        contactPerson: "",
        email: "",
        phone: "",
        address: "",
        defaultPayableAccountId: "",
        notes: "",
        status: "active",
      }).success,
    ).toBe(true);
  });

  it("shows linked vendors and permission-gates record-payment actions", () => {
    expect(getBillPayeeName({ vendor: null })).toBe("—");
    expect(
      getBillPayeeName({
        vendor: { name: "Linked Vendor" } as never,
      }),
    ).toBe("Linked Vendor");
    expect(
      canRecordBillPayment({ status: "posted", outstandingAmount: 100 }, true),
    ).toBe(true);
    expect(
      canRecordBillPayment({ status: "posted", outstandingAmount: 100 }, false),
    ).toBe(false);
    expect(
      canRecordBillPayment({ status: "draft", outstandingAmount: 100 }, true),
    ).toBe(false);
  });

  it("distinguishes loading, error, empty, and ready list states", () => {
    expect(billListState(true, false, 0)).toBe("loading");
    expect(billListState(false, true, 0)).toBe("error");
    expect(billListState(false, false, 0)).toBe("empty");
    expect(billListState(false, false, 2)).toBe("ready");
  });
});
