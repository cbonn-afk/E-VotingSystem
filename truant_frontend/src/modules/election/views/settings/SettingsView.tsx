"use client";

import { useEffect } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, type Control } from "react-hook-form";
import { toast } from "react-toastify";

import CustomTextField from "@core/components/mui/TextField";

import ElectionPageHeader from "../../components/shared/ElectionPageHeader";
import {
  useElectionSettings,
  useElectionSettingsMutation,
} from "../../hooks/useElectionSettingsApi";
import {
  settingsSchema,
  type SettingsFormValues,
} from "../../schemas/electionSchemas";
import { getElectionErrorMessage } from "../../utils/electionFormat";

const defaults: SettingsFormValues = {
  companyTitle: "",
  documentTitle: "",
  documentSubTitle: "",
  registrationAutoSearch: false,
  registrationShowMemberInfo: true,
  voteAutoSearch: false,
  voteShowMemberInfo: true,
};

const Toggle = ({
  control,
  name,
  label,
  hint,
}: {
  control: Control<SettingsFormValues>;
  name: "registrationAutoSearch" | "registrationShowMemberInfo" | "voteAutoSearch" | "voteShowMemberInfo";
  label: string;
  hint: string;
}) => (
  <Controller
    control={control}
    name={name}
    render={({ field }) => (
      <Stack>
        <FormControlLabel
          label={label}
          control={
            <Switch
              checked={field.value}
              onChange={(event) => field.onChange(event.target.checked)}
            />
          }
        />
        <Typography variant="caption" color="text.secondary" sx={{ ml: 12 }}>
          {hint}
        </Typography>
      </Stack>
    )}
  />
);

export default function SettingsView() {
  const query = useElectionSettings();
  const mutation = useElectionSettingsMutation();
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: defaults,
  });
  const settings = query.data?.data;

  useEffect(() => {
    if (!settings) return;
    form.reset({
      companyTitle: settings.company_title ?? "",
      documentTitle: settings.document_title ?? "",
      documentSubTitle: settings.document_sub_title ?? "",
      registrationAutoSearch: settings.registration_auto_search,
      registrationShowMemberInfo: settings.registration_show_member_info,
      voteAutoSearch: settings.vote_auto_search,
      voteShowMemberInfo: settings.vote_show_member_info,
    });
  }, [settings, form]);

  const save = form.handleSubmit(async (values) => {
    try {
      await mutation.mutateAsync({
        company_title: values.companyTitle || null,
        document_title: values.documentTitle || null,
        document_sub_title: values.documentSubTitle || null,
        registration_auto_search: values.registrationAutoSearch,
        registration_show_member_info: values.registrationShowMemberInfo,
        vote_auto_search: values.voteAutoSearch,
        vote_show_member_info: values.voteShowMemberInfo,
      });
      toast.success("Settings saved.");
    } catch (error) {
      toast.error(getElectionErrorMessage(error, "Settings could not be saved."));
    }
  });

  const field = (name: "companyTitle" | "documentTitle" | "documentSubTitle", label: string) => (
    <Controller
      control={form.control}
      name={name}
      render={({ field: input, fieldState }) => (
        <CustomTextField
          {...input}
          label={label}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message}
        />
      )}
    />
  );

  return (
    <Stack spacing={5}>
      <ElectionPageHeader
        title="Election Settings"
        description="Titles used on printed reports, and how the registration desk and voting station behave."
      />

      {query.isError && (
        <Alert severity="error">
          {getElectionErrorMessage(query.error, "Settings could not be loaded.")}
        </Alert>
      )}

      <Stack component="form" spacing={5} onSubmit={save} sx={{ maxInlineSize: 720 }}>
        <Paper sx={{ p: 5 }}>
          <Stack spacing={3}>
            <Typography variant="h6">Report titles</Typography>
            {field("companyTitle", "Company Title")}
            {field("documentTitle", "Document Title")}
            {field("documentSubTitle", "Document Sub-title")}
          </Stack>
        </Paper>

        <Paper sx={{ p: 5 }}>
          <Stack spacing={2}>
            <Typography variant="h6">Registration desk</Typography>
            <Toggle
              control={form.control}
              name="registrationAutoSearch"
              label="Search members by name"
              hint="Shows a search box with suggestions instead of a plain code box."
            />
            <Toggle
              control={form.control}
              name="registrationShowMemberInfo"
              label="Confirm member before registering"
              hint="Shows the member's name and asks to confirm."
            />
          </Stack>
        </Paper>

        <Paper sx={{ p: 5 }}>
          <Stack spacing={2}>
            <Typography variant="h6">Voting station</Typography>
            <Toggle
              control={form.control}
              name="voteAutoSearch"
              label="Search members by name"
              hint="Lets the voter pick their name from a list instead of entering a badge code."
            />
            <Toggle
              control={form.control}
              name="voteShowMemberInfo"
              label="Confirm member before voting"
              hint="Shows the member's name and asks to confirm before the ballot opens."
            />
          </Stack>
        </Paper>

        <Stack direction="row" justifyContent="flex-end">
          <Button type="submit" variant="contained" disabled={mutation.isPending || query.isLoading}>
            Save Settings
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
}
