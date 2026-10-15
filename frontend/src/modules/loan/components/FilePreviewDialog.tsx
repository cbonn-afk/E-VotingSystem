"use client";

import { useEffect, useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";

import { downloadFile, fetchFileBlob, fileKind } from "../utils/downloadFile";

export type PreviewTarget = { path: string; filename: string };

type Props = { target: PreviewTarget | null; onClose: () => void };

/** Shows an uploaded image or PDF on the page, without leaving it. */
export default function FilePreviewDialog({ target, onClose }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!target) return;

    let objectUrl: string | null = null;
    let cancelled = false;

    setUrl(null);
    setError(null);

    fetchFileBlob(target.path)
      .then((blob) => {
        if (cancelled) return;

        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch((e: Error) => !cancelled && setError(e.message));

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [target]);

  const kind = target ? fileKind(target.filename) : "other";

  return (
    <Dialog open={target !== null} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle>{target?.filename}</DialogTitle>
      <DialogContent dividers sx={{ minHeight: 240, display: "grid", placeItems: "center" }}>
        {error && <Alert severity="error">{error}</Alert>}
        {!error && !url && <CircularProgress size={32} />}
        {url && kind === "image" && (
          <Box component="img" src={url} alt={target?.filename} sx={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain" }} />
        )}
        {url && kind === "pdf" && (
          <Box component="iframe" src={url} title={target?.filename} sx={{ width: "100%", height: "70vh", border: 0 }} />
        )}
        {url && kind === "other" && <Alert severity="info">This file type cannot be previewed. Use Download.</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => target && downloadFile(target.path, target.filename)}>Download</Button>
        <Button variant="contained" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
