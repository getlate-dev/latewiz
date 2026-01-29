"use client";

import { useCallback, useState } from "react";
import { useUploadMedia, type UploadedMedia, isValidMediaType } from "@/hooks";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, X, Image as ImageIcon, Video, Loader2 } from "lucide-react";

interface MediaUploaderProps {
  media: UploadedMedia[];
  onMediaChange: (media: UploadedMedia[]) => void;
  maxFiles?: number;
}

export function MediaUploader({
  media,
  onMediaChange,
  maxFiles = 10,
}: MediaUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const uploadMutation = useUploadMedia();

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);

      // Validate file count
      if (media.length + fileArray.length > maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed`);
        return;
      }

      // Validate file types
      const invalidFiles = fileArray.filter((f) => !isValidMediaType(f));
      if (invalidFiles.length > 0) {
        toast.error("Some files have invalid types");
        return;
      }

      // Upload files
      for (const file of fileArray) {
        try {
          const uploaded = await uploadMutation.mutateAsync(file);
          onMediaChange([...media, uploaded]);
        } catch {
          toast.error(`Failed to upload ${file.name}`);
        }
      }
    },
    [media, onMediaChange, maxFiles, uploadMutation]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles]
  );

  const removeMedia = (index: number) => {
    onMediaChange(media.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-muted-foreground"
        }`}
      >
        <input
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleInputChange}
          className="absolute inset-0 cursor-pointer opacity-0"
          disabled={uploadMutation.isPending}
        />
        <div className="flex flex-col items-center gap-2">
          {uploadMutation.isPending ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          ) : (
            <Upload className="h-8 w-8 text-muted-foreground" />
          )}
          <p className="text-sm text-muted-foreground">
            {uploadMutation.isPending
              ? "Uploading..."
              : "Drop files here or click to upload"}
          </p>
          <p className="text-xs text-muted-foreground">
            Images (JPG, PNG, GIF, WebP) or Videos (MP4, MOV, WebM)
          </p>
        </div>
      </div>

      {/* Media preview */}
      {media.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {media.map((item, index) => (
            <div
              key={index}
              className="group relative aspect-square overflow-hidden rounded-lg bg-muted"
            >
              {item.type === "video" ? (
                <video
                  src={item.url}
                  className="h-full w-full object-cover"
                />
              ) : (
                <img
                  src={item.url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => removeMedia(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="absolute bottom-1 left-1">
                {item.type === "video" ? (
                  <Video className="h-4 w-4 text-white drop-shadow" />
                ) : (
                  <ImageIcon className="h-4 w-4 text-white drop-shadow" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Media count */}
      {media.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {media.length} / {maxFiles} files
        </p>
      )}
    </div>
  );
}
