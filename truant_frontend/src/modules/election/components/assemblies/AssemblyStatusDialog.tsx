"use client";

import { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import CustomDialog from "@components/app/CustomDialog";
import CustomTextField from "@core/components/mui/TextField";

import type { AssemblyResource, AssemblyStatus } from "../../api/types";
import {
  assemblyStatusLabels,
  assemblyTransitionHints,
  assemblyTransitions,
} from "../../data/electionOptions";

type Props = {
  assembly: AssemblyResource | null;
  saving: boolean;
  onClose: () => void;
  onConfirm: (status: AssemblyStatus) => void;
};

export default function AssemblyStatusDialog({
  assembly,
  saving,
  onClose,
  onConfirm,
}: Props) {
  const options = assembly ? assemblyTransitions[assembly.status] : [];
  const [target, setTarget] = useState<AssemblyStatus | "">("");

  useEffect(() => {
    setTarget(options[0] ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assembly?.id, assembly?.status]);

  return (
    <CustomDialog
      open={Boolean(assembly)}
      onClose={onClose}
      closeAfterTransition
      title="Change Assembly Status"
      description={
        assembly
          ? `${assembly.name} is currently ${assemblyStatusLabels[assembly.status].toLowerCase()}.`
          : undefined
      }
      actions={
        <>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!target || saving}
            onClick={() => target && onConfirm(target)}
          >
            Confirm
          </Button>
        </>
      }
    >
      <Stack spacing={3} sx={{ mt: 2 }}>
        <CustomTextField
          select
          label="Move to"
          value={target}
          onChange={(event) => setTarget(event.target.value as AssemblyStatus)}
        >
          {options.map((status) => (
            <MenuItem key={status} value={status}>
              {assemblyStatusLabels[status]}
            </MenuItem>
          ))}
        </CustomTextField>
        {target && (
          <Typography variant="body2" color="text.secondary">
            {assemblyTransitionHints[target]}
          </Typography>
        )}
      </Stack>
    </CustomDialog>
  );
}
