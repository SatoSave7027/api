"use client";

import { useRef, useState } from "react";

import { ApiError, api } from "@/lib/api";
import { useToast } from "./Toast";
import { Button } from "./ui";

type Props = {
  url: string | null;
  storagePath: string | null;
  onChange: (next: { url: string | null; storagePath: string | null }) => void;
  fallback?: React.ReactNode;
};

export function AvatarUpload({ url, storagePath, onChange, fallback }: Props) {
  const { notify } = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleChoose() {
    inputRef.current?.click();
  }

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await api.uploads.upload(file);
      onChange({ url: uploaded.url, storagePath: uploaded.storage_path });
      notify("Image uploaded.", "success");
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Upload failed.";
      notify(message, "error");
    } finally {
      setUploading(false);
    }
  }

  function handleRemove() {
    onChange({ url: null, storagePath: null });
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-ink-600 bg-ink-800">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt="Avatar"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/40">
            {fallback ?? "?"}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={handleChoose}
          loading={uploading}
        >
          {url ? "Change image" : "Upload image"}
        </Button>
        {url && (
          <Button type="button" variant="danger" onClick={handleRemove}>
            Remove
          </Button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
        <span className="text-xs text-white/40">
          PNG / JPG / WEBP, up to 5 MB.
        </span>
      </div>
    </div>
  );
}
