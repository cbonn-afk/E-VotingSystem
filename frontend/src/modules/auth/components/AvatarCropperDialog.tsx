"use client";

import { useCallback, useEffect, useState } from "react";

import Cropper, { type Area } from "react-easy-crop";
import { toast } from "react-toastify";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { getCroppedAvatarFile } from "@/modules/auth/utils/cropImage";

type AvatarCropperDialogProps = {
  open: boolean;
  /** Object URL of the image picked by the user. */
  imageSrc: string | null;
  onCancel: () => void;
  onCropped: (file: File) => void;
};

const AvatarCropperDialog = ({
  open,
  imageSrc,
  onCancel,
  onCropped,
}: AvatarCropperDialogProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  // Reset transform state each time a new image is opened.
  useEffect(() => {
    if (open) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setCroppedAreaPixels(null);
    }
  }, [open, imageSrc]);

  const handleCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setProcessing(true);

    try {
      const file = await getCroppedAvatarFile(
        imageSrc,
        croppedAreaPixels,
        rotation,
      );
      onCropped(file);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not process the image. Please try another file.",
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>Adjust your photo</DialogTitle>
      <DialogContent>
        <Stack spacing={4}>
          <Box
            sx={{
              position: "relative",
              width: "100%",
              height: 280,
              borderRadius: 1,
              overflow: "hidden",
              backgroundColor: "var(--mui-palette-action-hover)",
            }}
          >
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={handleCropComplete}
              />
            )}
          </Box>

          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary">
              Zoom
            </Typography>
            <Slider
              value={zoom}
              min={1}
              max={3}
              step={0.01}
              aria-label="Zoom"
              onChange={(_, value) => setZoom(value as number)}
            />
          </Stack>

          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary">
              Rotate
            </Typography>
            <Slider
              value={rotation}
              min={0}
              max={360}
              step={1}
              aria-label="Rotation"
              onChange={(_, value) => setRotation(value as number)}
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="secondary" onClick={onCancel} disabled={processing}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={processing || !croppedAreaPixels}
          startIcon={
            processing ? (
              <CircularProgress color="inherit" size={18} />
            ) : (
              <i className="bx-check" />
            )
          }
        >
          {processing ? "Processing..." : "Apply"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AvatarCropperDialog;
