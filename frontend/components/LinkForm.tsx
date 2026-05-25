"use client";

import { useState } from "react";

import { AvatarUpload } from "./AvatarUpload";
import { Button, Input, Textarea } from "./ui";

export type LinkFormValues = {
  title: string;
  url: string;
  description: string;
  image_url: string | null;
  image_path: string | null;
};

export function LinkForm({
  initial,
  submitLabel,
  onCancel,
  onSubmit,
  submitting,
}: {
  initial: LinkFormValues;
  submitLabel: string;
  onCancel?: () => void;
  onSubmit: (values: LinkFormValues) => Promise<void> | void;
  submitting: boolean;
}) {
  const [values, setValues] = useState<LinkFormValues>(initial);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof LinkFormValues>(
    key: K,
    value: LinkFormValues[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!values.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!values.url.trim()) {
      setError("URL is required.");
      return;
    }
    await onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <AvatarUpload
        url={values.image_url}
        storagePath={values.image_path}
        fallback="🔗"
        onChange={({ url, storagePath }) => {
          update("image_url", url);
          update("image_path", storagePath);
        }}
      />
      <Input
        label="Title"
        value={values.title}
        onChange={(event) => update("title", event.target.value)}
        required
        maxLength={200}
      />
      <Input
        label="URL"
        value={values.url}
        onChange={(event) => update("url", event.target.value)}
        required
        type="url"
        placeholder="https://example.com"
        maxLength={2048}
      />
      <Textarea
        label="Description"
        value={values.description}
        onChange={(event) => update("description", event.target.value)}
        rows={4}
        placeholder="Why is this link worth keeping?"
        maxLength={2000}
      />
      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error}
        </div>
      )}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
