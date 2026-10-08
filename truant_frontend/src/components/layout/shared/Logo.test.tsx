import { render, screen } from "@testing-library/react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { describe, expect, it } from "vitest";

import Logo from "./Logo";

describe("Logo", () => {
  it("uses the dark-lettered logo in light mode", () => {
    render(
      <ThemeProvider theme={createTheme({ palette: { mode: "light" } })}>
        <Logo />
      </ThemeProvider>,
    );

    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "/images/logos/truant-logo-dark.png",
    );
  });

  it("uses the light-lettered logo in dark mode", () => {
    render(
      <ThemeProvider theme={createTheme({ palette: { mode: "dark" } })}>
        <Logo />
      </ThemeProvider>,
    );

    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "/images/logos/truant-logo.png",
    );
  });

  it("uses the dark-lettered mark for collapsed sidebars in light mode", () => {
    render(
      <ThemeProvider theme={createTheme({ palette: { mode: "light" } })}>
        <Logo collapsed />
      </ThemeProvider>,
    );

    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "/images/truant-mark-dark.png",
    );
    expect(screen.getByRole("img")).toHaveStyle({
      inlineSize: "60px",
      blockSize: "68px",
    });
  });

  it("uses the white-lettered mark for collapsed sidebars in dark mode", () => {
    render(
      <ThemeProvider theme={createTheme({ palette: { mode: "dark" } })}>
        <Logo collapsed />
      </ThemeProvider>,
    );

    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "/images/truant-mark.png",
    );
  });
});
