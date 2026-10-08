import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";

type NotificationFeedbackStateProps = {
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
};

const NotificationFeedbackState = ({
  isLoading,
  isError,
  onRetry,
}: NotificationFeedbackStateProps) => {
  if (isLoading) {
    return (
      <Box
        role="status"
        aria-label="Loading notifications"
        sx={{ display: "flex", justifyContent: "center", py: 8 }}
      >
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (!isError) return null;

  return (
    <Alert
      severity="error"
      action={
        onRetry ? (
          <Button color="inherit" size="small" onClick={onRetry}>
            Retry
          </Button>
        ) : undefined
      }
    >
      Notifications could not be loaded.
    </Alert>
  );
};

export default NotificationFeedbackState;
