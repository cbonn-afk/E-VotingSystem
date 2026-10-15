import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import type { ApplicationEvent } from "../types";
import { applicationStatusLabel, formatDateTime } from "../utils/applicationStatus";

/** Newest first, in plain language: who did what and when. */
export default function ApplicationTimeline({ events }: { events: ApplicationEvent[] }) {
  return (
    <Stack spacing={2}>
      {[...events].reverse().map((event, index) => (
        <Stack key={`${event.created_at}-${index}`} spacing={0.25}>
          <Typography variant="body2" fontWeight={600}>
            {applicationStatusLabel[event.to_status]}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {event.actor_type === "staff" ? "Cooperative staff" : "You"}
            {event.actor_name && event.actor_type === "staff" ? ` (${event.actor_name})` : ""} · {formatDateTime(event.created_at)}
          </Typography>
          {event.remarks && <Typography variant="body2">{event.remarks}</Typography>}
        </Stack>
      ))}
    </Stack>
  );
}
