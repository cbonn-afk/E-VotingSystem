import { render, screen } from "@testing-library/react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { describe, expect, it } from "vitest";

import Logo from "./Logo";

describe("Logo", () => {
  it("uses the Aiur logo in light mode", () => {
    render(
      <ThemeProvider theme={createTheme({ palette: { mode: "light" } })}>
        <Logo />
      </ThemeProvider>,
    );

    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "/images/logos/aiur-logo.png",
    );
  });

  it("uses the same Aiur logo in dark mode", () => {
    render(
      <ThemeProvider theme={createTheme({ palette: { mode: "dark" } })}>
        <Logo />
      </ThemeProvider>,
    );

    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "/images/logos/aiur-logo.png",
    );
  });

  it("uses the Aiur mark for collapsed sidebars in light mode", () => {
    render(
      <ThemeProvider theme={createTheme({ palette: { mode: "light" } })}>
        <Logo collapsed />
      </ThemeProvider>,
    );

    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "/images/aiur-mark.png",
    );
    expect(screen.getByRole("img")).toHaveStyle({
      inlineSize: "48px",
      blockSize: "48px",
    });
  });

  it("uses the same Aiur mark for collapsed sidebars in dark mode", () => {
    render(
      <ThemeProvider theme={createTheme({ palette: { mode: "dark" } })}>
        <Logo collapsed />
      </ThemeProvider>,
    );

    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "/images/aiur-mark.png",
    );
  });
});
