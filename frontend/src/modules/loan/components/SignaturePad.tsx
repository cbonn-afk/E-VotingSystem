"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

type Props = { disabled?: boolean; pending?: boolean; onSave: (pngDataUrl: string) => void };

/** Draw with a finger, stylus or mouse. Saved as a small PNG image. */
export default function SignaturePad({ disabled, pending, onSave }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    const context = canvasRef.current?.getContext("2d");

    if (!context) return;

    context.lineWidth = 2.5;
    context.lineCap = "round";
    context.strokeStyle = "#111111";
  }, []);

  const point = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();

    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const start = (event: PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;

    const context = event.currentTarget.getContext("2d");
    const { x, y } = point(event);

    drawing.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    context?.beginPath();
    context?.moveTo(x, y);
  };

  const move = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;

    const context = event.currentTarget.getContext("2d");
    const { x, y } = point(event);

    context?.lineTo(x, y);
    context?.stroke();
    setHasInk(true);
  };

  const clear = () => {
    const canvas = canvasRef.current;

    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
  };

  return (
    <Stack spacing={2}>
      <Box
        sx={{ border: 1, borderColor: "divider", borderRadius: 1, bgcolor: "common.white", maxWidth: 480, touchAction: "none" }}
      >
        <canvas
          ref={canvasRef}
          width={480}
          height={160}
          style={{ width: "100%", height: "auto", display: "block", cursor: disabled ? "not-allowed" : "crosshair" }}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={() => (drawing.current = false)}
          onPointerLeave={() => (drawing.current = false)}
          aria-label="Signature area"
        />
      </Box>
      <Stack direction="row" spacing={2}>
        <Button variant="outlined" color="secondary" onClick={clear} disabled={disabled || !hasInk}>
          Clear
        </Button>
        <Button
          variant="contained"
          disabled={disabled || pending || !hasInk}
          onClick={() => canvasRef.current && onSave(canvasRef.current.toDataURL("image/png"))}
        >
          Save signature
        </Button>
      </Stack>
    </Stack>
  );
}
