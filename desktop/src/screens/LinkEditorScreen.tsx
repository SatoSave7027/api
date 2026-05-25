import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { AvatarUpload } from "../components/AvatarUpload";
import { useToast } from "../components/Toast";
import { Button, Card, Input, PageTitle, Spinner, Textarea } from "../components/ui";
import { ApiError, api } from "../lib/api";

type Props = { mode: "create" | "edit" };

function storagePathFromUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).pathname.replace(/^\//, "");
  } catch {
    return null;
  }
}

export function LinkEditorScreen({ mode }: Props) {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const { notify } = useToast();
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "edit" || !params.id) return;
    (async () => {
      try {
        const data = await api.links.get(params.id!);
        setTitle(data.title);
        setUrl(data.url);
        setDescription(data.description ?? "");
        setImageUrl(data.image_url);
        setImagePath(storagePathFromUrl(data.image_url));
      } catch (error) {
        notify(
          error instanceof ApiError ? error.message : "Failed to load.",
          "error"
        );
        navigate("/dashboard/links", { replace: true });
      } finally {
        setLoading(false);
      }
    })();
  }, [mode, params.id, notify, navigate]);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!url.trim()) {
      setError("URL is required.");
      return;
    }
    const payload = {
      title: title.trim(),
      url: url.trim(),
      description: description.trim() || null,
      image_path: imagePath,
    };
    setSaving(true);
    try {
      if (mode === "create") {
        const created = await api.links.create(payload);
        notify("Link saved.", "success");
        navigate(`/dashboard/links/${created.id}`, { replace: true });
      } else if (params.id) {
        await api.links.update(params.id, payload);
        notify("Link updated.", "success");
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
    if (!window.confirm("Delete this link?")) return;
    try {
      await api.links.delete(params.id);
      notify("Link deleted.", "success");
      navigate("/dashboard/links", { replace: true });
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
        title={mode === "create" ? "New link" : `Editing ${title || "link"}`}
        action={
          <div className="flex gap-2">
            <Link to="/dashboard/links">
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
        <form onSubmit={handleSave} className="space-y-5">
          <AvatarUpload
            url={imageUrl}
            storagePath={imagePath}
            fallback="🔗"
            onChange={({ url, storagePath }) => {
              setImageUrl(url);
              setImagePath(storagePath);
            }}
          />
          <Input
            label="Title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            maxLength={200}
          />
          <Input
            label="URL"
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            required
            maxLength={2048}
            placeholder="https://example.com"
          />
          <Textarea
            label="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            maxLength={2000}
          />
          {error && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {error}
            </div>
          )}
          <div className="flex justify-end">
            <Button type="submit" loading={saving}>
              {mode === "create" ? "Save link" : "Save changes"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
