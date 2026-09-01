"use client";

import { useRef, useState } from "react";
import { File as FileIcon, Image as ImageIcon, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatFileSize } from "@/lib/format";
import { UPLOAD_CONSTRAINTS, validateUpload, type UploadKind } from "@/lib/upload-constraints";

export type UploadedFile = { fileUrl: string; fileName: string; fileSize: number };

export function FileUpload({
  kind,
  value,
  onChange,
}: {
  kind: UploadKind;
  value: UploadedFile | null;
  onChange: (file: UploadedFile | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const constraint = UPLOAD_CONSTRAINTS[kind];

  function upload(file: File) {
    setError(null);

    const validation = validateUpload(kind, file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    if (kind === "image") {
      setPreviewUrl(URL.createObjectURL(file));
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", kind);

    setProgress(0);
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    });

    xhr.addEventListener("load", () => {
      setProgress(null);
      let json: { success: boolean; data?: UploadedFile; error?: string } | null = null;
      try {
        json = JSON.parse(xhr.responseText);
      } catch {
        // fall through to the generic error below
      }
      if (xhr.status >= 200 && xhr.status < 300 && json?.success && json.data) {
        onChange(json.data);
      } else {
        setError(json?.error ?? "Upload failed");
      }
    });

    xhr.addEventListener("error", () => {
      setProgress(null);
      setError("Upload failed");
    });

    xhr.open("POST", "/api/upload");
    xhr.send(formData);
  }

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) upload(file);
  }

  function handleRemove() {
    onChange(null);
    setPreviewUrl(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const displayPreview = kind === "image" ? (value?.fileUrl ?? previewUrl) : null;

  return (
    <div className="space-y-2">
      {value ? (
        <div className="flex items-center gap-3 rounded-md border p-3">
          {displayPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayPreview}
              alt={value.fileName}
              className="size-12 shrink-0 rounded object-cover"
            />
          ) : (
            <FileIcon className="size-8 shrink-0 text-muted-foreground" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{value.fileName}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(value.fileSize)}</p>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Remove file" onClick={handleRemove}>
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <div
          className={`flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-6 text-center transition-colors ${
            isDragging ? "border-primary bg-accent" : "border-muted-foreground/25"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
        >
          {kind === "image" ? (
            <ImageIcon className="size-6 text-muted-foreground" />
          ) : (
            <UploadCloud className="size-6 text-muted-foreground" />
          )}

          {progress !== null ? (
            <div className="w-full max-w-48 space-y-1">
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground">Uploading… {progress}%</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Drag and drop, or{" "}
                <button
                  type="button"
                  className="text-primary underline underline-offset-2"
                  onClick={() => inputRef.current?.click()}
                >
                  browse
                </button>
              </p>
              <p className="text-xs text-muted-foreground">
                {constraint.extensions.join(", ")} · up to {formatFileSize(constraint.maxSize)}
              </p>
            </>
          )}

          <input
            ref={inputRef}
            type="file"
            accept={constraint.extensions.join(",")}
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
