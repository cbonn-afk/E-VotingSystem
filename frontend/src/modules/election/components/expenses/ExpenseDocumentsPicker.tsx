"use client";

import { useRef, useState, type DragEvent, type KeyboardEvent } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import type { ExpenseDocumentResource } from "../../api/types";

export type PendingExpenseDocument = {
  id: string;
  file: File;
  previewUrl: string;
};

export type ExpenseDocumentPreview = {
  id: string;
  originalName: string;
  mimeType: string;
  previewUrl: string;
};

type ExpenseDocumentsPickerProps = {
  existingDocuments: ExpenseDocumentResource[];
  pendingDocuments: PendingExpenseDocument[];
  onAdd: (files: File[]) => void;
  onRemovePending: (documentId: string) => void;
  onPreview: (document: ExpenseDocumentPreview) => void;
};

const documentPreview = (
  document: ExpenseDocumentResource | PendingExpenseDocument,
): ExpenseDocumentPreview => ({
  id: document.id,
  originalName: "file" in document ? document.file.name : document.originalName,
  mimeType: "file" in document ? document.file.type : document.mimeType,
  previewUrl: document.previewUrl,
});

const ExpenseDocumentsPicker = ({
  existingDocuments,
  pendingDocuments,
  onAdd,
  onRemovePending,
  onPreview,
}: ExpenseDocumentsPickerProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const addFiles = (files: FileList | null) => {
    if (files?.length) onAdd(Array.from(files));
  };

  const allDocuments = [
    ...existingDocuments.map((document) => ({ document, pending: false })),
    ...pendingDocuments.map((document) => ({ document, pending: true })),
  ];

  return (
    <Stack spacing={2}>
      <Stack
        direction="row"
        spacing={1.25}
        alignItems="center"
        justifyContent="space-between"
      >
        <Stack direction="row" spacing={1.25} alignItems="center" minWidth={0}>
          <Box
            sx={{
              display: "grid",
              placeItems: "center",
              flex: "0 0 auto",
              width: 40,
              height: 40,
              borderRadius: 1,
              color: "primary.main",
              bgcolor: "primary.lighterOpacity",
              fontSize: 22,
            }}
          >
            <i className="bx bx-receipt" />
          </Box>
          <Stack spacing={0.125} minWidth={0}>
            <Typography variant="subtitle1" fontWeight={700}>
              Documents
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Receipt photos and supporting images
            </Typography>
          </Stack>
        </Stack>
        <Chip
          size="small"
          variant="tonal"
          color={allDocuments.length > 0 ? "primary" : "default"}
          icon={<i className="bx bx-images" />}
          label={`${allDocuments.length} / 10`}
          sx={{ flex: "0 0 auto", fontWeight: 600 }}
        />
      </Stack>

      <Box
        role="button"
        tabIndex={0}
        aria-label="Add expense document photos"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
          if (["Enter", " "].includes(event.key)) inputRef.current?.click();
        }}
        onDragEnter={(event: DragEvent<HTMLDivElement>) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          onAdd(Array.from(event.dataTransfer.files));
        }}
        sx={{
          border: 1,
          borderStyle: "dashed",
          borderColor: isDragging ? "primary.main" : "divider",
          borderRadius: 1,
          p: 2,
          cursor: "pointer",
          bgcolor: isDragging ? "action.selected" : "action.hover",
          transition: (theme) =>
            theme.transitions.create(["background-color", "border-color"]),
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "42px minmax(0, 1fr)",
              sm: "42px minmax(0, 1fr) auto",
            },
            gap: 1.5,
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              display: "grid",
              placeItems: "center",
              width: 40,
              height: 40,
              borderRadius: 1,
              color: "primary.main",
              bgcolor: "primary.lighterOpacity",
              fontSize: 21,
            }}
          >
            <i className="bx bx-cloud-upload" />
          </Box>
          <Stack spacing={0.25} minWidth={0}>
            <Typography variant="body2" fontWeight={600}>
              Add receipt photos
            </Typography>
            <Typography variant="caption" color="text.secondary">
              JPEG, PNG, or WebP. Up to 10 photos, 2 MB each.
            </Typography>
          </Stack>
          <Button
            variant="tonal"
            size="small"
            startIcon={<i className="bx bx-plus" />}
            onClick={(event) => {
              event.stopPropagation();
              inputRef.current?.click();
            }}
            sx={{
              gridColumn: { xs: "1 / -1", sm: "auto" },
              justifySelf: { xs: "start", sm: "end" },
              whiteSpace: "nowrap",
            }}
          >
            Browse photos
          </Button>
        </Box>
      </Box>
      <input
        ref={inputRef}
        hidden
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => {
          addFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {allDocuments.length > 0 && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 1.5,
          }}
        >
          {allDocuments.map(({ document, pending }) => {
            const preview = documentPreview(document);

            return (
              <Stack
                key={preview.id}
                spacing={1}
                sx={{
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1,
                  p: 1.25,
                  bgcolor: "background.paper",
                }}
              >
                <Box
                  component="img"
                  src={preview.previewUrl}
                  alt={preview.originalName}
                  sx={{
                    width: "100%",
                    aspectRatio: "4 / 3",
                    objectFit: "cover",
                    borderRadius: 0.75,
                  }}
                />
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Typography
                    variant="caption"
                    noWrap
                    title={preview.originalName}
                    sx={{ flex: 1, minWidth: 0 }}
                  >
                    {preview.originalName}
                  </Typography>
                  {pending ? (
                    <Chip size="small" label="New" color="primary" />
                  ) : (
                    <Chip size="small" label="Saved" color="success" />
                  )}
                </Stack>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Button
                    size="small"
                    variant="tonal"
                    startIcon={<i className="bx bx-show" />}
                    onClick={(event) => {
                      event.stopPropagation();
                      onPreview(preview);
                    }}
                    sx={{ flex: 1 }}
                  >
                    Preview
                  </Button>
                  {pending && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(event) => {
                        event.stopPropagation();
                        onRemovePending(preview.id);
                      }}
                      aria-label={`Remove ${preview.originalName}`}
                    >
                      <i className="bx bx-trash" />
                    </IconButton>
                  )}
                </Stack>
              </Stack>
            );
          })}
        </Box>
      )}
    </Stack>
  );
};

export default ExpenseDocumentsPicker;
