"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { toast } from "react-toastify";

import CustomDialog from "@components/app/CustomDialog";
import CustomTextField from "@core/components/mui/TextField";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import { ApiError } from "@/libs/api/apiError";

import DocumentPreviewSamples, { previewTabs, type PreviewKind } from "../components/DocumentPreviewSamples";
import { defaultDocumentSettings, toDocumentSettingsPayload } from "../defaults";
import {
  useDocumentSettingsQuery,
  useUpdateDocumentSettings,
  useUploadDocumentLogo,
} from "../hooks/useDocumentSettings";
import type { DocumentSettings, DocumentTemplate } from "../types";
import { isHexColor } from "../utils/printStyles";
import { formatTin, isValidTin } from "../utils/tin";

const presets: { value: DocumentTemplate; label: string; description: string; icon: string; patch: Partial<DocumentSettings> }[] = [
  {
    value: "classic",
    label: "Classic",
    description: "Balanced header, clear tables, signature-ready.",
    icon: "bx-layout",
    patch: { template: "classic", density: "comfortable", headerAlignment: "split", borderStyle: "accent", marginMm: 12 },
  },
  {
    value: "compact",
    label: "Compact",
    description: "Dense layout for long tables and quick printing.",
    icon: "bx-collapse-vertical",
    patch: { template: "compact", density: "compact", headerAlignment: "split", borderStyle: "clean", marginMm: 10 },
  },
  {
    value: "executive",
    label: "Executive",
    description: "Polished, member-facing document with stronger branding.",
    icon: "bx-diamond",
    patch: { template: "executive", density: "comfortable", headerAlignment: "left", borderStyle: "accent", marginMm: 14 },
  },
];

const maxLogoBytes = 2 * 1024 * 1024;
const allowedLogoTypes = ["image/png", "image/jpeg", "image/webp"];

const Section = ({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) => (
  <Stack spacing={2}>
    <Stack spacing={0.25}>
      <Typography variant="subtitle1" fontWeight={700}>
        {title}
      </Typography>
      {hint && (
        <Typography variant="body2" color="text.secondary">
          {hint}
        </Typography>
      )}
    </Stack>
    {children}
  </Stack>
);

export default function DocumentSettingsView() {
  const query = useDocumentSettingsQuery();
  const update = useUpdateDocumentSettings();
  const uploadLogo = useUploadDocumentLogo();
  const fileInput = useRef<HTMLInputElement>(null);

  const saved = query.data?.data;
  const [draft, setDraft] = useState<DocumentSettings | null>(null);
  const [preview, setPreview] = useState<PreviewKind>("agreement");

  useEffect(() => {
    if (saved && draft === null) setDraft(saved);
  }, [saved, draft]);

  const settings = draft ?? saved ?? defaultDocumentSettings;
  const isDirty = useMemo(
    () => !!saved && !!draft && JSON.stringify(toDocumentSettingsPayload(draft)) !== JSON.stringify(toDocumentSettingsPayload(saved)),
    [saved, draft],
  );
  const tinError = !isValidTin(settings.companyTin ?? "");
  const colorError = !isHexColor(settings.accentColor);
  const hasErrors = tinError || colorError || !settings.companyName.trim();
  const isSaving = update.isPending;
  const guard = useUnsavedChangesGuard({ enabled: isDirty });

  const set = <K extends keyof DocumentSettings>(key: K, value: DocumentSettings[K]) =>
    setDraft((current) => ({ ...(current ?? settings), [key]: value }));

  const save = async (): Promise<boolean> => {
    if (!draft || hasErrors) return false;

    try {
      const response = await update.mutateAsync(toDocumentSettingsPayload(draft));

      setDraft(response.data);
      toast.success("Document settings saved.");

      return true;
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "The settings could not be saved.");

      return false;
    }
  };

  const onLogoPicked = async (file?: File) => {
    if (!file) return;

    if (!allowedLogoTypes.includes(file.type)) return void toast.error("Upload a PNG, JPG, or WebP logo.");
    if (file.size > maxLogoBytes) return void toast.error("Logo must be 2 MB or smaller.");

    try {
      const response = await uploadLogo.mutateAsync(file);

      // The upload is saved immediately; keep the other unsaved edits.
      setDraft((current) => ({
        ...(current ?? response.data),
        logoMode: response.data.logoMode,
        uploadedLogoUrl: response.data.uploadedLogoUrl,
      }));
      toast.success("Logo uploaded.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "The logo could not be uploaded.");
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  if (query.isPending) return <CircularProgress size={32} />;
  if (query.isError) return <Alert severity="error">Document settings could not be loaded.</Alert>;

  return (
    <Stack spacing={5}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="h4">Document settings</Typography>
          <Typography variant="body2" color="text.secondary">
            One layout for every printable: loan agreements and receipts, election and accounting reports, and PDF exports.
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Button variant="outlined" color="secondary" disabled={!isDirty || isSaving} onClick={() => setDraft(saved ?? null)}>
            Reset
          </Button>
          <Button variant="contained" disabled={!isDirty || hasErrors || isSaving} onClick={() => void save()}>
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </Stack>
      </Stack>

      <Box sx={{ display: "grid", gap: 4, gridTemplateColumns: { xs: "1fr", xl: "minmax(360px, 440px) minmax(0, 1fr)" }, alignItems: "start" }}>
        <Paper sx={{ p: 4 }}>
          <Stack spacing={5}>
            <Section title="Template" hint="Start from a preset, then tune the details below. Applies to every printable.">
              <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "repeat(3, 1fr)" }}>
                {presets.map((preset) => {
                  const active = settings.template === preset.value;

                  return (
                    <Box
                      key={preset.value}
                      role="button"
                      tabIndex={0}
                      onClick={() => setDraft({ ...settings, ...preset.patch })}
                      onKeyDown={(event) => event.key === "Enter" && setDraft({ ...settings, ...preset.patch })}
                      sx={{
                        p: 2,
                        borderRadius: 1,
                        cursor: "pointer",
                        border: 1,
                        borderColor: active ? "primary.main" : "divider",
                        bgcolor: active ? "primary.lightOpacity" : "transparent",
                      }}
                    >
                      <i className={`bx ${preset.icon}`} style={{ fontSize: 22 }} />
                      <Typography fontWeight={700}>{preset.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {preset.description}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Section>

            <Section title="Page">
              <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: "1fr 1fr" }}>
                <CustomTextField select fullWidth label="Paper" value={settings.paperSize} onChange={(e) => set("paperSize", e.target.value as DocumentSettings["paperSize"])}>
                  <MenuItem value="A4">A4</MenuItem>
                  <MenuItem value="Letter">Letter</MenuItem>
                  <MenuItem value="Legal">Legal</MenuItem>
                </CustomTextField>
                <CustomTextField select fullWidth label="Orientation" value={settings.orientation} onChange={(e) => set("orientation", e.target.value as DocumentSettings["orientation"])}>
                  <MenuItem value="portrait">Portrait</MenuItem>
                  <MenuItem value="landscape">Landscape</MenuItem>
                </CustomTextField>
                <CustomTextField select fullWidth label="Density" value={settings.density} onChange={(e) => set("density", e.target.value as DocumentSettings["density"])}>
                  <MenuItem value="comfortable">Comfortable</MenuItem>
                  <MenuItem value="compact">Compact</MenuItem>
                </CustomTextField>
                <CustomTextField select fullWidth label="Header" value={settings.headerAlignment} onChange={(e) => set("headerAlignment", e.target.value as DocumentSettings["headerAlignment"])}>
                  <MenuItem value="split">Split</MenuItem>
                  <MenuItem value="left">Left</MenuItem>
                  <MenuItem value="center">Center</MenuItem>
                </CustomTextField>
                <CustomTextField select fullWidth label="Font" value={settings.fontFamily} onChange={(e) => set("fontFamily", e.target.value as DocumentSettings["fontFamily"])}>
                  <MenuItem value="Inter">Inter</MenuItem>
                  <MenuItem value="Arial">Arial</MenuItem>
                  <MenuItem value="Georgia">Georgia</MenuItem>
                </CustomTextField>
                <CustomTextField select fullWidth label="Border" value={settings.borderStyle} onChange={(e) => set("borderStyle", e.target.value as DocumentSettings["borderStyle"])}>
                  <MenuItem value="clean">Clean</MenuItem>
                  <MenuItem value="boxed">Boxed</MenuItem>
                  <MenuItem value="accent">Accent top</MenuItem>
                </CustomTextField>
              </Box>
              <Stack spacing={0.5}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Margin
                  </Typography>
                  <Typography variant="body2">{settings.marginMm} mm</Typography>
                </Stack>
                <Slider min={6} max={30} value={settings.marginMm} onChange={(_, value) => set("marginMm", value as number)} />
              </Stack>
              <FormControlLabel
                label="Use striped table rows"
                control={<Switch checked={settings.tableStriped} onChange={(e) => set("tableStriped", e.target.checked)} />}
              />
            </Section>

            <Section title="Organization" hint="Printed in the header of every document.">
              <CustomTextField fullWidth label="Name" value={settings.companyName} error={!settings.companyName.trim()} onChange={(e) => set("companyName", e.target.value)} />
              <CustomTextField fullWidth label="Address" value={settings.companyAddress ?? ""} onChange={(e) => set("companyAddress", e.target.value)} />
              <CustomTextField fullWidth label="Contact" value={settings.companyContact ?? ""} onChange={(e) => set("companyContact", e.target.value)} />
              <CustomTextField
                fullWidth
                label="TIN"
                placeholder="000-000-000-000"
                value={settings.companyTin ?? ""}
                error={tinError}
                helperText={tinError ? "Use the format 000-000-000-000." : undefined}
                onChange={(e) => set("companyTin", formatTin(e.target.value))}
              />
              <Stack direction="row" spacing={2} alignItems="flex-end">
                <CustomTextField
                  fullWidth
                  label="Accent color"
                  value={settings.accentColor}
                  error={colorError}
                  helperText={colorError ? "Use a hex color like #B8892E." : undefined}
                  onChange={(e) => set("accentColor", e.target.value)}
                />
                <input
                  type="color"
                  aria-label="Pick accent color"
                  value={isHexColor(settings.accentColor) ? settings.accentColor : "#B8892E"}
                  onChange={(e) => set("accentColor", e.target.value.toUpperCase())}
                  style={{ inlineSize: 44, blockSize: 38, border: 0, background: "none", cursor: "pointer" }}
                />
              </Stack>
            </Section>

            <Section title="Logo" hint="PNG, JPG or WebP, up to 2 MB. Uploads are saved right away.">
              <Stack direction="row" spacing={2} alignItems="center">
                {settings.logoMode === "upload" && settings.uploadedLogoUrl ? (
                  <Box component="img" src={settings.uploadedLogoUrl} alt="Current logo" sx={{ blockSize: 44, maxInlineSize: 140, objectFit: "contain", border: 1, borderColor: "divider", borderRadius: 1, p: 0.5 }} />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No logo
                  </Typography>
                )}
                <input ref={fileInput} hidden type="file" accept={allowedLogoTypes.join(",")} onChange={(e) => void onLogoPicked(e.target.files?.[0])} />
                <Button variant="outlined" disabled={uploadLogo.isPending} onClick={() => fileInput.current?.click()}>
                  {uploadLogo.isPending ? "Uploading..." : settings.uploadedLogoUrl ? "Replace" : "Upload"}
                </Button>
                {settings.logoMode === "upload" && (
                  <Button color="error" variant="tonal" onClick={() => setDraft({ ...settings, logoMode: "none", uploadedLogoUrl: null })}>
                    Remove
                  </Button>
                )}
              </Stack>
              {settings.logoMode === "upload" && (
                <Stack spacing={0.5}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Logo size
                    </Typography>
                    <Typography variant="body2">{settings.logoSize} px</Typography>
                  </Stack>
                  <Slider min={24} max={160} value={settings.logoSize} onChange={(_, value) => set("logoSize", value as number)} />
                </Stack>
              )}
            </Section>

            <Section title="Shared document blocks" hint="Optional blocks and footer copy applied to every printout.">
              <CustomTextField fullWidth label="Watermark" placeholder="e.g. DRAFT" value={settings.watermark ?? ""} onChange={(e) => set("watermark", e.target.value)} />
              <CustomTextField fullWidth multiline minRows={2} label="Footer note" value={settings.footerNote ?? ""} onChange={(e) => set("footerNote", e.target.value)} />
              <CustomTextField fullWidth label="Footer page label" helperText="Printed pages use automatic numbering, for example Page 1 of 3." value={settings.footerPageNumberLabel} onChange={(e) => set("footerPageNumberLabel", e.target.value)} />
              <CustomTextField fullWidth label="Terms section title" value={settings.termsTitle} onChange={(e) => set("termsTitle", e.target.value)} />
              <Stack direction="row" spacing={3} flexWrap="wrap">
                <FormControlLabel label="Show prepared by" control={<Switch checked={settings.showPreparedBy} onChange={(e) => set("showPreparedBy", e.target.checked)} />} />
                <FormControlLabel label="Show signature blocks" control={<Switch checked={settings.showSignatureBlocks} onChange={(e) => set("showSignatureBlocks", e.target.checked)} />} />
              </Stack>
            </Section>
          </Stack>
        </Paper>

        <Paper sx={{ p: 4, minWidth: 0 }}>
          <Stack spacing={3}>
            <Stack spacing={0.25}>
              <Typography variant="subtitle1" fontWeight={700}>
                Live preview
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sample documents. Changes show here before you save.
              </Typography>
            </Stack>
            <Tabs value={preview} onChange={(_, value: PreviewKind) => setPreview(value)} variant="scrollable" allowScrollButtonsMobile>
              {previewTabs.map((tab) => (
                <Tab key={tab.value} value={tab.value} label={tab.label} />
              ))}
            </Tabs>
            <Box sx={{ overflow: "auto", p: { xs: 1, md: 3 }, bgcolor: "action.hover", borderRadius: 1, maxBlockSize: "80vh" }}>
              <DocumentPreviewSamples kind={preview} settings={settings} />
            </Box>
          </Stack>
        </Paper>
      </Box>

      <CustomDialog
        open={guard.pendingHref !== null}
        onClose={guard.cancelNavigation}
        closeAfterTransition={false}
        icon={<i className="bx-error-circle" style={{ color: "#f59e0b" }} />}
        title="Unsaved changes"
        description="You have unsaved changes to the document settings. Save them before leaving, or discard to continue."
        actions={
          <>
            <Button color="secondary" variant="outlined" onClick={guard.cancelNavigation} disabled={isSaving}>
              Keep editing
            </Button>
            <Button color="error" variant="tonal" onClick={guard.confirmNavigation} disabled={isSaving}>
              Discard changes
            </Button>
            <Button
              variant="contained"
              disabled={isSaving || hasErrors}
              onClick={async () => {
                if (await save()) guard.confirmNavigation();
              }}
            >
              {isSaving ? "Saving..." : "Save & leave"}
            </Button>
          </>
        }
      >
        {null}
      </CustomDialog>
    </Stack>
  );
}
