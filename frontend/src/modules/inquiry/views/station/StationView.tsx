"use client";

import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import Link from "@components/Link";
import CustomTextField from "@core/components/mui/TextField";

import type { MemberStatement } from "../../api/types";
import StatementPanel from "../../components/station/StatementPanel";
import { useAnnouncements, useStationLookup } from "../../hooks/useInquiryApi";
import { getInquiryErrorMessage } from "../../utils/inquiryFormat";

/** Full-screen member inquiry: scan or type a badge number, read the statement, it clears itself. */
export default function StationView() {
  const lookup = useStationLookup();
  const announcements = useAnnouncements().data?.data ?? [];
  const [code, setCode] = useState("");
  const [statement, setStatement] = useState<MemberStatement | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setStatement(null);
    setCode("");
  };

  // Count down while a statement is on screen, then clear it for the next member.
  useEffect(() => {
    if (!statement) return;

    const timer = setInterval(() => setSecondsLeft((current) => current - 1), 1000);

    return () => clearInterval(timer);
  }, [statement]);

  useEffect(() => {
    if (statement && secondsLeft <= 0) reset();
  }, [statement, secondsLeft]);

  const submit = async () => {
    const value = code.trim();

    if (!value || lookup.isPending) return;
    setError(null);

    try {
      const response = await lookup.mutateAsync(value);

      setSecondsLeft(Math.max(5, response.data.idle_seconds));
      setStatement(response.data);
    } catch (caught) {
      setError(getInquiryErrorMessage(caught));
      setCode("");
    }
  };

  return (
    <Box sx={{ minBlockSize: "100dvh", bgcolor: "background.default" }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          blockSize: 64,
          px: 4,
          bgcolor: "primary.main",
          color: "primary.contrastText",
        }}
      >
        <Typography variant="h6" color="inherit">
          Member Balance Inquiry
        </Typography>
        {!statement && (
          <Button component={Link} href="/inquiry" color="inherit" size="small">
            Exit
          </Button>
        )}
      </Stack>

      {statement ? (
        <StatementPanel statement={statement} secondsLeft={secondsLeft} onExit={reset} />
      ) : (
        <Stack alignItems="center" spacing={5} sx={{ p: 4, pt: { xs: 6, md: 10 } }}>
          <Paper elevation={6} sx={{ inlineSize: "100%", maxInlineSize: 640, p: { xs: 4, md: 8 } }}>
            <Stack spacing={5} alignItems="center">
              <Stack spacing={1} alignItems="center">
                <Typography variant="h3" textAlign="center">
                  Check Your Balance
                </Typography>
                <Typography color="text.secondary" textAlign="center">
                  Scan your card or enter your member code.
                </Typography>
              </Stack>
              {error && (
                <Alert severity="warning" sx={{ inlineSize: "100%" }}>
                  {error}
                </Alert>
              )}
              <CustomTextField
                autoFocus
                fullWidth
                label="Member Code"
                value={code}
                disabled={lookup.isPending}
                onChange={(event) => setCode(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void submit();
                  }
                }}
                sx={{ "& input": { fontSize: "1.6rem", fontWeight: 700 } }}
              />
              <Button
                fullWidth
                size="large"
                variant="contained"
                disabled={!code.trim() || lookup.isPending}
                onClick={() => void submit()}
                startIcon={<i className="bx bx-check" />}
              >
                {lookup.isPending ? "Checking…" : "Continue"}
              </Button>
            </Stack>
          </Paper>

          {announcements.length > 0 && (
            <Stack spacing={3} sx={{ inlineSize: "100%", maxInlineSize: 760 }}>
              {announcements.map((item) => (
                <Card key={item.id}>
                  {item.image_url && (
                    <Box
                      component="img"
                      src={item.image_url}
                      alt=""
                      sx={{ inlineSize: "100%", maxBlockSize: 360, objectFit: "cover" }}
                    />
                  )}
                  <CardContent>
                    <Typography variant="h6">{item.title}</Typography>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mt: 1 }}>
                      {item.body}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Stack>
      )}
    </Box>
  );
}
