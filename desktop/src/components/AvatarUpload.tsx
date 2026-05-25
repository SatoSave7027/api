import { useRef, useState } from "react";

import { ApiError, api } from "../lib/api";
import { useToast } from "./Toast";
import { Button } from "./ui";

type Props = {
  url: string | null;
  storagePath: string | null;
  fallback?: React.ReactNode;
  onChange: (next: { url: string | null; storagePath: string | null }) => void;
};

export function AvatarUpload({ url, storagePath: _path, onChange, fallback }: Props) {
  const { notify } = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  return (
    <div className="flex items-center gap-4">
      <div className="h-20 w-20 overflow-hidden rounded-2xl border border-ink-600 bg-ink-800">
        {url ? (
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/40">
            {fallback}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="ghost"
          loading={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {url ? "Change image" : "Upload image"}
        </Button>
        {url && (
          <Button
            type="button"
            variant="danger"
            onClick={() => onChange({ url: null, storagePath: null })}
          >
            Remove
          </Button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (event) => {
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
          }}
        />
        <span className="text-xs text-white/40">PNG / JPG / WEBP up to 5 MB.</span>
      </div>
    </div>
  );
}
