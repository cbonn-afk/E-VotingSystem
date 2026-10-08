"use client";

import { useEffect, useMemo, useState } from "react";

// Next Imports
import { useSearchParams } from "next/navigation";

// MUI Imports
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";

import { DEFAULT_RETRY_SECONDS } from "@/modules/misc/serverAvailability";

// Only accept an internal path for "from" — never an absolute/external URL.
const safeReturnPath = (value: string | null): string => {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";

  return value;
};

const MaintenanceView = () => {
  const theme = useTheme();
  const searchParams = useSearchParams();

  const returnTo = safeReturnPath(searchParams.get("from"));
  const initialRetry = useMemo(() => {
    const requested = Number(searchParams.get("retry"));

    return Number.isFinite(requested) && requested > 0
      ? requested
      : DEFAULT_RETRY_SECONDS;
  }, [searchParams]);

  const [secondsLeft, setSecondsLeft] = useState(initialRetry);

  useEffect(() => {
    setSecondsLeft(initialRetry);
  }, [initialRetry]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      window.location.href = returnTo;

      return;
    }

    const timeout = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);

    return () => clearTimeout(timeout);
  }, [secondsLeft, returnTo]);

  const logoSource =
    theme.palette.mode === "dark"
      ? "/images/truant-mark.png"
      : "/images/truant-mark-dark.png";

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        bgcolor: "background.default",
        p: 6,
      }}
    >
      <Stack spacing={5} sx={{ alignItems: "center", textAlign: "center", maxWidth: 460 }}>
        <Box
          component="img"
          src={logoSource}
          alt="Truant Enterprises logo"
          sx={{ inlineSize: 64, blockSize: "auto", objectFit: "contain" }}
        />

        <Box
          sx={{
            width: 96,
            height: 96,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            background: "linear-gradient(135deg,#f59e0b,#c2410c)",
            boxShadow: "0 8px 24px rgba(194,65,12,0.35)",
          }}
        >
          <i
            className="bx-wrench"
            style={{
              fontSize: 44,
              color: "#fff",
              display: "inline-block",
              animation: "wrenchTurn 2.2s ease-in-out infinite",
            }}
          />
        </Box>

        <Stack spacing={1.5}>
          <Typography variant="h4" fontWeight={800}>
            We&apos;ll be right back
          </Typography>
          <Typography color="text.secondary">
            Truant Enterprises is undergoing scheduled maintenance. We&apos;re
            working to get everything back up and running — please check
            back shortly.
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Retrying automatically in {secondsLeft}s…
          </Typography>
        </Stack>

        <Button
          variant="outlined"
          startIcon={<i className="bx-refresh" />}
          onClick={() => {
            window.location.href = returnTo;
          }}
        >
          Try again
        </Button>
      </Stack>

      <style>{`
        @keyframes wrenchTurn {
          0%, 100% { transform: rotate(-18deg); }
          50% { transform: rotate(18deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          i.bx-wrench { animation: none !important; }
        }
      `}</style>
    </Box>
  );
};

export default MaintenanceView;
