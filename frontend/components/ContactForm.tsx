"use client";

import { useState } from "react";

import { AvatarUpload } from "./AvatarUpload";
import { Button, Input, Textarea } from "./ui";

export type ContactFormValues = {
  name: string;
  phone: string;
  telegram_username: string;
  description: string;
  avatar_url: string | null;
  avatar_path: string | null;
};

export function ContactForm({
  initial,
  submitLabel,
  onCancel,
  onSubmit,
  submitting,
}: {
  initial: ContactFormValues;
  submitLabel: string;
  onCancel?: () => void;
  onSubmit: (values: ContactFormValues) => Promise<void> | void;
  submitting: boolean;
}) {
  const [values, setValues] = useState<ContactFormValues>(initial);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof ContactFormValues>(
    key: K,
    value: ContactFormValues[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!values.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!values.phone.trim() && !values.telegram_username.trim()) {
      setError("Provide either a phone number or a Telegram username.");
      return;
    }
    await onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <AvatarUpload
        url={values.avatar_url}
        storagePath={values.avatar_path}
        fallback={values.name.slice(0, 2).toUpperCase() || "?"}
        onChange={({ url, storagePath }) => {
          update("avatar_url", url);
          update("avatar_path", storagePath);
        }}
      />

      <Input
        label="Name"
        value={values.name}
        onChange={(event) => update("name", event.target.value)}
        required
        maxLength={120}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Phone"
          value={values.phone}
          onChange={(event) => update("phone", event.target.value)}
          placeholder="+1 555 010 0123"
          maxLength={40}
        />
        <Input
          label="Telegram username"
          value={values.telegram_username}
          onChange={(event) => update("telegram_username", event.target.value)}
          placeholder="@username"
          maxLength={64}
        />
      </div>

      <Textarea
        label="Description"
        value={values.description}
        onChange={(event) => update("description", event.target.value)}
        rows={4}
        placeholder="Where you met, why they matter, anything useful…"
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
