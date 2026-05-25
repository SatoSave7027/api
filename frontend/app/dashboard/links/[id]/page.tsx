"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { LinkForm } from "@/components/LinkForm";
import { Button, Card, PageTitle, Spinner } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { ApiError, api } from "@/lib/api";
import type { Link as LinkItem } from "@/lib/types";

function storagePathFromUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.pathname.replace(/^\//, "");
  } catch {
    return null;
  }
}

export default function LinkDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [link, setLink] = useState<LinkItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.links.get(params.id);
        setLink(data);
      } catch (error) {
        const message =
          error instanceof ApiError ? error.message : "Failed to load.";
        notify(message, "error");
        router.replace("/dashboard/links");
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id, notify, router]);

  async function handleDelete() {
    if (!window.confirm("Delete this link?")) return;
    try {
      await api.links.delete(params.id);
      notify("Link deleted.", "success");
      router.replace("/dashboard/links");
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
  if (!link) return null;

  if (editing) {
    return (
      <div>
        <PageTitle
          title={`Editing ${link.title}`}
          action={
            <Button variant="ghost" onClick={() => setEditing(false)}>
              ← Back
            </Button>
          }
        />
        <Card>
          <LinkForm
            initial={{
              title: link.title,
              url: link.url,
              description: link.description ?? "",
              image_url: link.image_url,
              image_path: storagePathFromUrl(link.image_url),
            }}
            submitLabel="Save changes"
            submitting={saving}
            onCancel={() => setEditing(false)}
            onSubmit={async (values) => {
              setSaving(true);
              try {
                const updated = await api.links.update(params.id, {
                  title: values.title.trim(),
                  url: values.url.trim(),
                  description: values.description.trim() || null,
                  image_path: values.image_path,
                });
                setLink(updated);
                setEditing(false);
                notify("Link updated.", "success");
              } catch (error) {
                const message =
                  error instanceof ApiError
                    ? error.message
                    : "Failed to update.";
                notify(message, "error");
              } finally {
                setSaving(false);
              }
            }}
          />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageTitle
        title={link.title}
        subtitle={new URL(link.url).hostname}
        action={
          <div className="flex gap-2">
            <Link href="/dashboard/links">
              <Button variant="ghost">← All links</Button>
            </Link>
            <Button variant="ghost" onClick={() => setEditing(true)}>
              Edit
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        }
      />
      <Card>
        {link.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={link.image_url}
            alt={link.title}
            className="mb-5 h-48 w-full rounded-2xl object-cover"
          />
        )}
        <div className="space-y-4 text-sm">
          <div>
            <div className="text-xs uppercase tracking-wider text-neon-400/80">
              URL
            </div>
            <a
              href={link.url}
              target="_blank"
              rel="noreferrer noopener"
              className="break-all text-aqua-400 hover:text-aqua-300"
            >
              {link.url}
            </a>
          </div>
          {link.description && (
            <div>
              <div className="text-xs uppercase tracking-wider text-neon-400/80">
                Description
              </div>
              <p className="whitespace-pre-wrap text-white/85">
                {link.description}
              </p>
            </div>
          )}
          <div className="text-xs text-white/40">
            Updated {new Date(link.updated_at).toLocaleString()}
          </div>
        </div>
      </Card>
    </div>
  );
}
