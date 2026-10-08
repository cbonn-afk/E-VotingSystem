import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ReportPrintMenu from "./ReportPrintMenu";

const mocks = vi.hoisted(() => ({
  isAuthorized: vi.fn(),
}));

vi.mock("@/modules/auth/hooks/useAuthorization", () => ({
  useAuthorization: () => ({ isAuthorized: mocks.isAuthorized }),
}));

const openMenu = () =>
  fireEvent.click(screen.getByRole("button", { name: /print/i }));

describe("ReportPrintMenu", () => {
  beforeEach(() => {
    mocks.isAuthorized.mockReturnValue(true);
  });

  it("prints and exports every supported format when authorized", () => {
    const onPrint = vi.fn();
    const onExport = vi.fn();

    render(
      <ReportPrintMenu
        onPrint={onPrint}
        onExport={onExport}
        exportFormats={["pdf", "xlsx", "csv"]}
      />,
    );

    openMenu();

    expect(
      screen.getByRole("menuitem", { name: /^print$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /download pdf/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /download excel/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /download csv/i }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("menuitem", { name: /download excel/i }));
    expect(onExport).toHaveBeenCalledWith("xlsx");

    openMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: /^print$/i }));
    expect(onPrint).toHaveBeenCalledTimes(1);
  });

  it("hides export options without the export permission but keeps Print", () => {
    mocks.isAuthorized.mockReturnValue(false);

    render(<ReportPrintMenu onPrint={vi.fn()} onExport={vi.fn()} />);

    openMenu();

    expect(
      screen.getByRole("menuitem", { name: /^print$/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: /download/i }),
    ).not.toBeInTheDocument();
  });

  it("omits formats a report does not support (e.g. PDF for the general ledger)", () => {
    render(
      <ReportPrintMenu
        onPrint={vi.fn()}
        onExport={vi.fn()}
        exportFormats={["xlsx", "csv"]}
      />,
    );

    openMenu();

    expect(
      screen.queryByRole("menuitem", { name: /download pdf/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /download excel/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /download csv/i }),
    ).toBeInTheDocument();
  });
});
