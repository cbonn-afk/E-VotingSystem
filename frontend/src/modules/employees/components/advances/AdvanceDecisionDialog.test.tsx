import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { AdvanceResource } from "../../api/types";
import AdvanceDecisionDialog from "./AdvanceDecisionDialog";

const advance: AdvanceResource = {
  id: "advance-1",
  employeeId: "employee-1",
  employeeName: "Juan Dela Cruz",
  amount: 10000,
  approvedAmount: null,
  requestedAt: "2026-07-29",
  paymentDate: null,
  reason: "School enrollment expenses",
  status: "Pending",
  resolutionNotes: null,
  approvedBy: null,
  createdAt: "2026-07-29T08:00:00Z",
  updatedAt: "2026-07-29T08:00:00Z",
};

describe("AdvanceDecisionDialog", () => {
  it("submits the requested amount without requiring a reason", async () => {
    const onConfirm = vi.fn();

    render(
      <AdvanceDecisionDialog
        open
        advance={advance}
        status="Approved"
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    const approvedAmount = screen.getByLabelText(/approved amount/i);

    await waitFor(() => expect(approvedAmount).toHaveValue(10000));
    fireEvent.click(screen.getByRole("button", { name: "Approve Advance" }));

    expect(onConfirm).toHaveBeenCalledWith({
      approvedAmount: 10000,
      resolutionNotes: "",
    });
  });

  it("requires a reason when approving less than requested", async () => {
    const onConfirm = vi.fn();

    render(
      <AdvanceDecisionDialog
        open
        advance={advance}
        status="Approved"
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    const approvedAmount = screen.getByLabelText(/approved amount/i);

    await waitFor(() => expect(approvedAmount).toHaveValue(10000));
    fireEvent.change(approvedAmount, { target: { value: "3000" } });
    fireEvent.click(screen.getByRole("button", { name: "Approve Advance" }));

    expect(
      screen.getByText(
        "Explain why the approved amount differs from the request.",
      ),
    ).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/decision reason/i), {
      target: { value: "Reduced to the amount the employee can repay." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Approve Advance" }));

    expect(onConfirm).toHaveBeenCalledWith({
      approvedAmount: 3000,
      resolutionNotes: "Reduced to the amount the employee can repay.",
    });
  });

  it("does not allow approval above the requested amount", async () => {
    const onConfirm = vi.fn();

    render(
      <AdvanceDecisionDialog
        open
        advance={advance}
        status="Approved"
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    const approvedAmount = screen.getByLabelText(/approved amount/i);

    await waitFor(() => expect(approvedAmount).toHaveValue(10000));
    fireEvent.change(approvedAmount, { target: { value: "12000" } });
    fireEvent.click(screen.getByRole("button", { name: "Approve Advance" }));

    expect(
      screen.getByText("Approved amount cannot exceed the requested amount."),
    ).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("requires a reason when rejecting an advance", () => {
    const onConfirm = vi.fn();

    render(
      <AdvanceDecisionDialog
        open
        advance={advance}
        status="Rejected"
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Reject Advance" }));

    expect(
      screen.getByText("Decision reason is required."),
    ).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
