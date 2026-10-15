import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Typography from "@mui/material/Typography";

import type { CandidateResource } from "../../api/types";

type Props = {
  candidate: CandidateResource;
  selected: boolean;
  onToggle: () => void;
};

export default function CandidatePickCard({ candidate, selected, onToggle }: Props) {
  return (
    <Card
      elevation={selected ? 8 : 3}
      sx={{
        outline: selected ? "4px solid" : "4px solid transparent",
        outlineColor: selected ? "success.main" : "transparent",
        transition: "outline-color .15s, box-shadow .15s",
      }}
    >
      <CardActionArea onClick={onToggle} aria-pressed={selected}>
        <Box
          sx={{
            position: "relative",
            blockSize: 320,
            bgcolor: "action.hover",
            display: "grid",
            placeItems: "center",
            fontSize: 96,
            color: "text.disabled",
          }}
        >
          {candidate.photo_url ? (
            <Box
              component="img"
              src={candidate.photo_url}
              alt={candidate.name}
              sx={{ inlineSize: "100%", blockSize: "100%", objectFit: "cover" }}
            />
          ) : (
            <i className="bx bx-user" />
          )}
          {selected && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                bgcolor: "rgba(25, 32, 72, 0.55)",
                color: "success.main",
                fontSize: 110,
              }}
            >
              <i className="bx bx-check-circle" />
            </Box>
          )}
        </Box>
        <Typography
          variant="h5"
          textAlign="center"
          sx={{ p: 3, whiteSpace: "pre-wrap", fontWeight: 700 }}
        >
          {candidate.name}
        </Typography>
      </CardActionArea>
    </Card>
  );
}
