import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import type { CandidateResource } from "../../api/types";

type Props = {
  candidate: CandidateResource;
  canManage: boolean;
  onEdit: (candidate: CandidateResource) => void;
  onDelete: (candidate: CandidateResource) => void;
};

const CandidateCard = ({ candidate, canManage, onEdit, onDelete }: Props) => (
  <Card variant="outlined">
    <Box
      sx={{
        blockSize: 200,
        bgcolor: "action.hover",
        display: "grid",
        placeItems: "center",
        fontSize: 56,
        color: "text.disabled",
        overflow: "hidden",
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
    </Box>
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{ p: 2 }}
    >
      <Typography fontWeight={600} noWrap>
        {candidate.name}
      </Typography>
      {canManage && (
        <Stack direction="row">
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => onEdit(candidate)}>
              <i className="bx bx-edit" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={() => onDelete(candidate)}
            >
              <i className="bx bx-trash" />
            </IconButton>
          </Tooltip>
        </Stack>
      )}
    </Stack>
  </Card>
);

export default CandidateCard;
