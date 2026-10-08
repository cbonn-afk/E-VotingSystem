"use client";

// MUI Imports
import { useTheme } from "@mui/material/styles";

// Config Imports
import themeConfig from "@configs/themeConfig";

type LogoProps = {
  text?: string;
  collapsed?: boolean;
};

const Logo = ({
  text = themeConfig.templateName,
  collapsed = false,
}: LogoProps) => {
  const theme = useTheme();

  const isDarkMode = theme.palette.mode === "dark";
  const source = collapsed
    ? isDarkMode
      ? "/images/truant-mark.png"
      : "/images/truant-mark-dark.png"
    : isDarkMode
      ? "/images/logos/truant-logo.png"
      : "/images/logos/truant-logo-dark.png";

  return (
    <div
      className={
        collapsed
          ? "flex items-center justify-center is-full"
          : "flex items-center gap-2 min-is-0"
      }
    >
      <img
        src={source}
        alt={text}
        className="max-is-full object-contain shrink-0"
        style={{
          inlineSize: collapsed ? 60 : 196,
          blockSize: collapsed ? 68 : 43,
        }}
      />
    </div>
  );
};

export default Logo;
