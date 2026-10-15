"use client";

import { useEffect, useState, type FormEvent } from "react";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";

import CustomDialog from "@components/app/CustomDialog";
import CustomTextField from "@core/components/mui/TextField";
import type { BranchPayload, BranchResource } from "../../api/types";

type BranchFormDialogProps = {
  open: boolean;
  branch: BranchResource | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (payload: BranchPayload) => void;
};

const FORM_ID = "branch-form";

const BranchFormDialog = ({
  open,
  branch,
  isSaving,
  onClose,
  onSubmit,
}: BranchFormDialogProps) => {
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [nameError, setNameError] = useState("");
  const hasAssignments = (branch?.employeesCount ?? 0) > 0;

  useEffect(() => {
    if (!open) return;

    setName(branch?.name ?? "");
    setIsActive(branch?.isActive ?? true);
    setNameError("");
  }, [branch, open]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanName = name.trim();

    if (!cleanName) {
      setNameError("Branch name is required.");
      return;
    }

    onSubmit({ name: cleanName, is_active: isActive });
  };

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      closeAfterTransition
      width="520px"
      title={branch ? "Edit Branch" : "Add Branch"}
      description="Maintain the operating locations available in employee records."
      icon={<i className="bx bx-buildings" />}
      actions={
        <>
          <Button
            variant="text"
            color="secondary"
            disabled={isSaving}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            variant="contained"
            disabled={isSaving}
            startIcon={<i className={branch ? "bx bx-save" : "bx bx-plus"} />}
          >
            {isSaving ? "Saving..." : branch ? "Save Changes" : "Add Branch"}
          </Button>
        </>
      }
    >
      <Stack
        component="form"
        id={FORM_ID}
        spacing={3}
        sx={{ pt: 3 }}
        onSubmit={submit}
      >
        <CustomTextField
          autoFocus
          fullWidth
          label="Branch Name"
          placeholder="e.g. Baguio Central"
          value={name}
          disabled={isSaving}
          error={Boolean(nameError)}
          helperText={nameError || "Use the location name employees recognize."}
          onChange={(event) => {
            setName(event.target.value);
            if (nameError) setNameError("");
          }}
        />

        <Stack spacing={0.5}>
          <FormControlLabel
            control={
              <Switch
                checked={isActive}
                disabled={isSaving || (hasAssignments && isActive)}
                onChange={(_event, checked) => setIsActive(checked)}
              />
            }
            label="Active branch"
          />
          <Typography variant="caption" color="text.secondary">
            Active branches are available when creating or editing employees.
          </Typography>
        </Stack>

        {hasAssignments && (
          <Alert severity="info" variant="outlined">
            Reassign all employees before deactivating or deleting this branch.
          </Alert>
        )}
      </Stack>
    </CustomDialog>
  );
};

export default BranchFormDialog;
