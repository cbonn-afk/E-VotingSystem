"use client";

import { useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Paper from "@mui/material/Paper";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";

import CustomTextField from "@core/components/mui/TextField";
import { ApiError } from "@/libs/api/apiError";

import { useLoanSettings, useLoanSettingsMutation } from "../hooks/useLoanSettings";
import {
  loanSettingsSchema,
  parseNetworks,
  toFormValues,
  toRequest,
  type LoanSettingsFormValues,
} from "../schemas/loanSettingsSchema";

const defaults: LoanSettingsFormValues = {
  portal_access_mode: "network_only",
  networksText: "",
  session_idle_minutes: "20",
  signature_required: false,
};

export default function LoanSettingsView() {
  const query = useLoanSettings();
  const mutation = useLoanSettingsMutation();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<LoanSettingsFormValues>({
    resolver: zodResolver(loanSettingsSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    if (query.data) reset(toFormValues(query.data.data));
  }, [query.data, reset]);

  const mode = watch("portal_access_mode");
  const networkCount = parseNetworks(watch("networksText")).length;

  const save = handleSubmit(async (values) => {
    try {
      const response = await mutation.mutateAsync(toRequest(values));

      reset(toFormValues(response.data));
      toast.success("Loan settings saved.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "The settings could not be saved.");
    }
  });

  return (
    <Stack spacing={5}>
      <Stack spacing={0.5}>
        <Typography variant="h4">Loan settings</Typography>
        <Typography variant="body2" color="text.secondary">
          Control who can reach the member portal and how long a member stays signed in.
        </Typography>
      </Stack>

      {query.isError && <Alert severity="error">The settings could not be loaded.</Alert>}

      <Paper className="p-6" component="form" noValidate onSubmit={save}>
        <Stack spacing={5}>
          <Controller
            name="portal_access_mode"
            control={control}
            render={({ field }) => (
              <Stack spacing={1}>
                <Typography variant="h6">Member portal access</Typography>
                <RadioGroup {...field}>
                  <FormControlLabel
                    value="network_only"
                    control={<Radio />}
                    label="Cooperative network only: the portal answers only to the addresses listed below"
                  />
                  <FormControlLabel
                    value="online"
                    control={<Radio />}
                    label="Online: members can sign in from anywhere (wrong-code lockout still applies)"
                  />
                </RadioGroup>
              </Stack>
            )}
          />

          {mode === "online" && (
            <Alert severity="warning">
              Members sign in with their member code only. Online, anyone on the internet who knows or guesses a code
              can see that member&apos;s information. Keep &quot;Cooperative network only&quot; unless members must
              use the portal away from the office.
            </Alert>
          )}

          {mode === "network_only" && networkCount === 0 && (
            <Alert severity="warning">
              No address is listed, so nobody can reach the portal. Add the cooperative&apos;s IP address or range.
            </Alert>
          )}

          <Controller
            name="networksText"
            control={control}
            render={({ field }) => (
              <CustomTextField
                {...field}
                multiline
                minRows={4}
                fullWidth
                disabled={mode === "online"}
                label="Allowed addresses"
                placeholder={"192.168.1.0/24\n203.0.113.25"}
                error={Boolean(errors.networksText)}
                helperText={errors.networksText?.message ?? "One IP address or range per line, e.g. 192.168.1.0/24."}
              />
            )}
          />

          <Controller
            name="session_idle_minutes"
            control={control}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label="Sign out after inactivity (minutes)"
                error={Boolean(errors.session_idle_minutes)}
                helperText={errors.session_idle_minutes?.message ?? "Between 5 and 120."}
              />
            )}
          />

          <Controller
            name="signature_required"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                label="Require an e-signature on loan applications"
                control={<Switch checked={field.value} onChange={(event) => field.onChange(event.target.checked)} />}
              />
            )}
          />

          <Stack direction="row" justifyContent="flex-end">
            <Button type="submit" variant="contained" disabled={!isDirty || mutation.isPending || query.isLoading}>
              Save settings
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Alert severity="info">
        Behind a load balancer, the server must be set up to trust it. Otherwise it sees the balancer&apos;s address
        instead of the member&apos;s and the address list will not match.
      </Alert>
    </Stack>
  );
}
