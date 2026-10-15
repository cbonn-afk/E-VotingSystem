"use client";

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
  // The Aiur gold mark reads well on both white and navy surfaces,
  // so one asset serves light mode, dark mode and the navy sidebar.
  const source = collapsed
    ? "/images/aiur-mark.png"
    : "/images/logos/aiur-logo.png";

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
          inlineSize: collapsed ? 48 : 150,
          blockSize: collapsed ? 48 : 70,
        }}
      />
    </div>
  );
};

export default Logo;
