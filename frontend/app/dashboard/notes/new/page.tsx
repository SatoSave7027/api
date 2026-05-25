"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, Card, Input, PageTitle, Textarea } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { ApiError, api } from "@/lib/api";

export default function NewNotePage() {
  const router = useRouter();
  const { notify } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      notify("Title is required.", "error");
      return;
    }
    setSaving(true);
    try {
      const created = await api.notes.create({
        title: title.trim(),
        content,
      });
      notify("Note saved.", "success");
      router.replace(`/dashboard/notes/${created.id}`);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Failed to save note.";
      notify(message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageTitle title="New note" subtitle="Title is encrypted too." />
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            maxLength={255}
          />
          <Textarea
            label="Content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={10}
            placeholder="Anything you want to remember…"
          />
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              Save note
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
