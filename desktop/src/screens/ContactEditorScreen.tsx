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

export function ContactEditorScreen({ mode }: Props) {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const { notify } = useToast();
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [telegram, setTelegram] = useState("");
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "edit" || !params.id) return;
    (async () => {
      try {
        const data = await api.contacts.get(params.id!);
        setName(data.name);
        setPhone(data.phone ?? "");
        setTelegram(data.telegram_username ?? "");
        setDescription(data.description ?? "");
        setAvatarUrl(data.avatar_url);
        setAvatarPath(storagePathFromUrl(data.avatar_url));
      } catch (error) {
        notify(
          error instanceof ApiError ? error.message : "Failed to load.",
          "error"
        );
        navigate("/dashboard/contacts", { replace: true });
      } finally {
        setLoading(false);
      }
    })();
  }, [mode, params.id, notify, navigate]);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!phone.trim() && !telegram.trim()) {
      setError("Provide a phone number or a Telegram username.");
      return;
    }
    const payload = {
      name: name.trim(),
      phone: phone.trim() || null,
      telegram_username: telegram.trim() || null,
      description: description.trim() || null,
      avatar_path: avatarPath,
    };
    setSaving(true);
    try {
      if (mode === "create") {
        const created = await api.contacts.create(payload);
        notify("Contact saved.", "success");
        navigate(`/dashboard/contacts/${created.id}`, { replace: true });
      } else if (params.id) {
        await api.contacts.update(params.id, payload);
        notify("Contact updated.", "success");
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
    if (!window.confirm("Delete this contact?")) return;
    try {
      await api.contacts.delete(params.id);
      notify("Contact deleted.", "success");
      navigate("/dashboard/contacts", { replace: true });
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
        title={mode === "create" ? "New contact" : `Editing ${name || "contact"}`}
        action={
          <div className="flex gap-2">
            <Link to="/dashboard/contacts">
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
            url={avatarUrl}
            storagePath={avatarPath}
            fallback={name.slice(0, 2).toUpperCase() || "?"}
            onChange={({ url, storagePath }) => {
              setAvatarUrl(url);
              setAvatarPath(storagePath);
            }}
          />
          <Input
            label="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            maxLength={120}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              maxLength={40}
              placeholder="+1 555 010 0123"
            />
            <Input
              label="Telegram username"
              value={telegram}
              onChange={(event) => setTelegram(event.target.value)}
              maxLength={64}
              placeholder="@username"
            />
          </div>
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
              {mode === "create" ? "Save contact" : "Save changes"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
