"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button, Card, Input, PageTitle, Spinner, Textarea } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { ApiError, api } from "@/lib/api";
import type { Note } from "@/lib/types";

export default function NoteDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await api.notes.get(params.id);
        setNote(data);
        setTitle(data.title);
        setContent(data.content);
      } catch (error) {
        const message =
          error instanceof ApiError ? error.message : "Failed to load note.";
        notify(message, "error");
        router.replace("/dashboard/notes");
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id, notify, router]);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      notify("Title is required.", "error");
      return;
    }
    setSaving(true);
    try {
      const updated = await api.notes.update(params.id, {
        title: title.trim(),
        content,
      });
      setNote(updated);
      setEditing(false);
      notify("Note updated.", "success");
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Failed to update note.";
      notify(message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this note? This cannot be undone.")) return;
    try {
      await api.notes.delete(params.id);
      notify("Note deleted.", "success");
      router.replace("/dashboard/notes");
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Failed to delete.";
      notify(message, "error");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size={28} />
      </div>
    );
  }

  if (!note) return null;

  return (
    <div>
      <PageTitle
        title={editing ? "Editing note" : note.title}
        subtitle={`Last updated ${new Date(note.updated_at).toLocaleString()}`}
        action={
          <div className="flex gap-2">
            <Link href="/dashboard/notes">
              <Button variant="ghost">← All notes</Button>
            </Link>
            {!editing && (
              <Button variant="ghost" onClick={() => setEditing(true)}>
                Edit
              </Button>
            )}
            {!editing && (
              <Button variant="danger" onClick={handleDelete}>
                Delete
              </Button>
            )}
          </div>
        }
      />

      <Card>
        {editing ? (
          <form onSubmit={handleSave} className="space-y-4">
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
              rows={12}
            />
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setTitle(note.title);
                  setContent(note.content);
                  setEditing(false);
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={saving}>
                Save changes
              </Button>
            </div>
          </form>
        ) : (
          <article className="whitespace-pre-wrap text-base leading-relaxed text-white/85">
            {note.content || (
              <span className="italic text-white/40">(empty note)</span>
            )}
          </article>
        )}
      </Card>
    </div>
  );
}
