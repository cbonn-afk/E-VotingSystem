"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { toast } from "react-toastify";

import CustomDialog from "@components/app/CustomDialog";

import type { AnnouncementPayload } from "../../api/inquiryApi";
import type { AnnouncementResource } from "../../api/types";
import AnnouncementFormDrawer from "../../components/announcements/AnnouncementFormDrawer";
import InquiryPageHeader from "../../components/shared/InquiryPageHeader";
import { useAnnouncementMutations, useAnnouncements } from "../../hooks/useInquiryApi";
import { formatDateTime, getInquiryErrorMessage } from "../../utils/inquiryFormat";

export default function AnnouncementsView() {
  const query = useAnnouncements();
  const mutations = useAnnouncementMutations();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<AnnouncementResource | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AnnouncementResource | null>(null);
  const items = query.data?.data ?? [];

  const save = async (payload: AnnouncementPayload) => {
    try {
      if (editing) await mutations.update.mutateAsync({ id: editing.id, payload });
      else await mutations.create.mutateAsync(payload);
      toast.success(editing ? "Announcement updated." : "Announcement posted.");
      setDrawerOpen(false);
      setEditing(null);
    } catch (error) {
      toast.error(getInquiryErrorMessage(error, "The announcement could not be saved."));
    }
  };

  return (
    <Stack spacing={5}>
      <InquiryPageHeader title="Announcements" description="Notices shown on the inquiry station while no member is signed in.">
        <Button
          variant="contained"
          startIcon={<i className="bx bx-plus" />}
          onClick={() => {
            setEditing(null);
            setDrawerOpen(true);
          }}
        >
          New Announcement
        </Button>
      </InquiryPageHeader>

      {query.isError && (
        <Alert severity="error" action={<Button color="inherit" onClick={() => void query.refetch()}>Retry</Button>}>
          {getInquiryErrorMessage(query.error, "Announcements could not be loaded.")}
        </Alert>
      )}

      {!query.isLoading && !query.isError && items.length === 0 && (
        <Alert severity="info">No announcements yet.</Alert>
      )}

      <Box sx={{ display: "grid", gap: 4, gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", xl: "repeat(3, 1fr)" } }}>
        {items.map((item) => (
          <Card key={item.id}>
            {item.image_url && (
              <Box component="img" src={item.image_url} alt="" sx={{ inlineSize: "100%", blockSize: 180, objectFit: "cover" }} />
            )}
            <CardContent>
              <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">{item.title}</Typography>
                  <Chip size="small" variant="tonal" color={item.is_published ? "success" : "secondary"} label={item.is_published ? "Published" : "Hidden"} />
                </Stack>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{item.body}</Typography>
                <Typography variant="caption" color="text.secondary">Posted {formatDateTime(item.created_at)}</Typography>
                <Stack direction="row" spacing={1}>
                  <Button size="small" startIcon={<i className="bx bx-edit" />} onClick={() => { setEditing(item); setDrawerOpen(true); }}>
                    Edit
                  </Button>
                  <Button size="small" color="error" startIcon={<i className="bx bx-trash" />} onClick={() => setDeleteTarget(item)}>
                    Delete
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>

      <AnnouncementFormDrawer
        open={drawerOpen}
        announcement={editing}
        saving={mutations.create.isPending || mutations.update.isPending}
        onClose={() => {
          setDrawerOpen(false);
          setEditing(null);
        }}
        onSubmit={save}
      />

      <CustomDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        closeAfterTransition
        title="Delete Announcement"
        description={deleteTarget ? `Permanently remove “${deleteTarget.title}”?` : undefined}
        actions={
          <>
            <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              color="error"
              variant="contained"
              disabled={mutations.remove.isPending}
              onClick={() => {
                if (!deleteTarget) return;
                void mutations.remove
                  .mutateAsync(deleteTarget.id)
                  .then(() => {
                    toast.success("Announcement deleted.");
                    setDeleteTarget(null);
                  })
                  .catch((error) => toast.error(getInquiryErrorMessage(error)));
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        {null}
      </CustomDialog>
    </Stack>
  );
}
