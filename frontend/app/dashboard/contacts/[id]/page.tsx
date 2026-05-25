"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ContactForm } from "@/components/ContactForm";
import { Button, Card, PageTitle, Spinner } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { ApiError, api } from "@/lib/api";
import type { Contact } from "@/lib/types";

function storagePathFromUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.pathname.replace(/^\//, "");
  } catch {
    return null;
  }
}

export default function ContactDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [contact, setContact] = useState<Contact | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.contacts.get(params.id);
        setContact(data);
      } catch (error) {
        const message =
          error instanceof ApiError ? error.message : "Failed to load.";
        notify(message, "error");
        router.replace("/dashboard/contacts");
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id, notify, router]);

  async function handleDelete() {
    if (!window.confirm("Delete this contact?")) return;
    try {
      await api.contacts.delete(params.id);
      notify("Contact deleted.", "success");
      router.replace("/dashboard/contacts");
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
  if (!contact) return null;

  if (editing) {
    return (
      <div>
        <PageTitle
          title={`Editing ${contact.name}`}
          action={
            <Button variant="ghost" onClick={() => setEditing(false)}>
              ← Back
            </Button>
          }
        />
        <Card>
          <ContactForm
            initial={{
              name: contact.name,
              phone: contact.phone ?? "",
              telegram_username: contact.telegram_username ?? "",
              description: contact.description ?? "",
              avatar_url: contact.avatar_url,
              avatar_path: storagePathFromUrl(contact.avatar_url),
            }}
            submitLabel="Save changes"
            submitting={saving}
            onCancel={() => setEditing(false)}
            onSubmit={async (values) => {
              setSaving(true);
              try {
                const updated = await api.contacts.update(params.id, {
                  name: values.name.trim(),
                  phone: values.phone.trim() || null,
                  telegram_username: values.telegram_username.trim() || null,
                  description: values.description.trim() || null,
                  avatar_path: values.avatar_path,
                });
                setContact(updated);
                setEditing(false);
                notify("Contact updated.", "success");
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
        title={contact.name}
        subtitle={`Saved ${new Date(contact.created_at).toLocaleDateString()}`}
        action={
          <div className="flex gap-2">
            <Link href="/dashboard/contacts">
              <Button variant="ghost">← All contacts</Button>
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
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="h-28 w-28 overflow-hidden rounded-3xl border border-ink-600 bg-ink-800">
            {contact.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={contact.avatar_url}
                alt={contact.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-neon-400">
                {contact.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <dl className="grid flex-1 gap-3 text-sm">
            {contact.phone && (
              <div>
                <dt className="text-xs uppercase tracking-wider text-neon-400/80">
                  Phone
                </dt>
                <dd className="text-white">{contact.phone}</dd>
              </div>
            )}
            {contact.telegram_username && (
              <div>
                <dt className="text-xs uppercase tracking-wider text-neon-400/80">
                  Telegram
                </dt>
                <dd className="text-white">
                  @{contact.telegram_username.replace(/^@/, "")}
                </dd>
              </div>
            )}
            {contact.description && (
              <div>
                <dt className="text-xs uppercase tracking-wider text-neon-400/80">
                  Notes
                </dt>
                <dd className="whitespace-pre-wrap text-white/80">
                  {contact.description}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </Card>
    </div>
  );
}
