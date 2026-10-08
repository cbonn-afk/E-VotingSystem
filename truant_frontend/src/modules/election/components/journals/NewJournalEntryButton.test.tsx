import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import NewJournalEntryButton from "./NewJournalEntryButton";

describe("NewJournalEntryButton", () => {
  it("keeps the journal screen focused on manual journal entries", () => {
    render(<NewJournalEntryButton />);

    expect(
      screen.getByRole("link", { name: "New Journal Entry" }),
    ).toHaveAttribute("href", "/accounting/journals/new");
    expect(screen.queryByText(/expense entry/i)).not.toBeInTheDocument();
  });
});
