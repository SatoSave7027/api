import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useToast } from "../components/Toast";
import { Button, Card, Input, PageTitle, Spinner, Textarea } from "../components/ui";
import { ApiError, api } from "../lib/api";
import type { Note } from "../lib/types";

type Props = { mode: "create" | "edit" };

export function NoteEditorScreen({ mode }: Props) {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const { notify } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode !== "edit" || !params.id) return;
    (async () => {
      try {
        const data = await api.notes.get(params.id!);
        setNote(data);
        setTitle(data.title);
        setContent(data.content);
      } catch (error) {
        notify(
          error instanceof ApiError ? error.message : "Failed to load.",
          "error"
        );
        navigate("/dashboard/notes", { replace: true });
      } finally {
        setLoading(false);
      }
    })();
  }, [mode, params.id, notify, navigate]);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      notify("Title required.", "error");
      return;
    }
    setSaving(true);
    try {
      if (mode === "create") {
        const created = await api.notes.create({
          title: title.trim(),
          content,
        });
        notify("Note saved.", "success");
        navigate(`/dashboard/notes/${created.id}`, { replace: true });
      } else if (params.id) {
        const updated = await api.notes.update(params.id, {
          title: title.trim(),
          content,
        });
        setNote(updated);
        notify("Note updated.", "success");
      }
    } catch (error) {
      notify(
        error instanceof ApiError ? error.message : "Failed to save.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!params.id) return;
    if (!window.confirm("Delete this note?")) return;
    try {
      await api.notes.delete(params.id);
      notify("Note deleted.", "success");
      navigate("/dashboard/notes", { replace: true });
    } catch (error) {
      notify(
        error instanceof ApiError ? error.message : "Failed to delete.",
        "error"
      );
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div>
      <PageTitle
        title={mode === "create" ? "New note" : note?.title ?? "Note"}
        subtitle={
          mode === "edit" && note
            ? `Updated ${new Date(note.updated_at).toLocaleString()}`
            : undefined
        }
        action={
          <div className="flex gap-2">
            <Link to="/dashboard/notes">
              <Button variant="ghost">← Back</Button>
            </Link>
            {mode === "edit" && (
              <Button variant="danger" onClick={handleDelete}>
                Delete
              </Button>
            )}
          </div>
        }
      />
      <Card>
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
          <div className="flex justify-end">
            <Button type="submit" loading={saving}>
              {mode === "create" ? "Save note" : "Save changes"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
