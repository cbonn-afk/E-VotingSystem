"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

type PromptUserCardProps = {
  icon: string;
  mainText: string;
  subText: string;
  buttonText?: string;
  buttonAction?: () => void;
};

/**
 * Empty-state prompt card (mirrors the partner-accounting PromptUserCard) used
 * to nudge the user toward the primary action when a register is empty.
 */
const PromptUserCard = ({
  icon,
  mainText,
  subText,
  buttonText,
  buttonAction,
}: PromptUserCardProps) => (
  <Paper sx={{ py: 10 }}>
    <Stack spacing={2.5} alignItems="center">
      <Box
        sx={{
          width: 64,
          height: 64,
          display: "grid",
          placeItems: "center",
          borderRadius: 3,
          color: "primary.main",
          bgcolor: "action.hover",
        }}
      >
        <i className={icon} style={{ fontSize: 30 }} />
      </Box>

      <Stack spacing={1} alignItems="center">
        <Typography variant="h5">{mainText}</Typography>
        <Typography variant="body2" color="text.secondary">
          {subText}
        </Typography>
      </Stack>

      {buttonText && buttonAction && (
        <Button variant="contained" onClick={buttonAction}>
          {buttonText}
        </Button>
      )}
    </Stack>
  </Paper>
);

export default PromptUserCard;
