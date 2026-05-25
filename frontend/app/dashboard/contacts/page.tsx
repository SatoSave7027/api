"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import { Button, EmptyState, PageTitle, Spinner } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { ApiError, api } from "@/lib/api";
import type { Contact } from "@/lib/types";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ContactsListPage() {
  const { notify } = useToast();
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const items = await api.contacts.list();
        setContacts(items);
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.message
            : "Failed to load contacts.";
        notify(message, "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [notify]);

  return (
    <div>
      <PageTitle
        title="Important contacts"
        subtitle="Encrypted directory of the people that matter."
        action={
          <Link href="/dashboard/contacts/new">
            <Button variant="primary">+ New contact</Button>
          </Link>
        }
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size={28} />
        </div>
      ) : contacts.length === 0 ? (
        <EmptyState
          icon="☎"
          title="No contacts yet"
          description="Add the people you don't want to lose. At minimum a phone number or a Telegram handle is required."
          action={
            <Link href="/dashboard/contacts/new">
              <Button variant="primary">Add a contact</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <AnimatePresence>
            {contacts.map((contact, index) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: 0.03 * index, duration: 0.35 }}
              >
                <Link
                  href={`/dashboard/contacts/${contact.id}`}
                  className="glass glow-border flex h-full flex-col items-center rounded-2xl p-5 text-center transition hover:-translate-y-0.5"
                >
                  <div className="mb-4 h-20 w-20 overflow-hidden rounded-full border border-ink-600 bg-ink-800">
                    {contact.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={contact.avatar_url}
                        alt={contact.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-neon-400">
                        {initials(contact.name)}
                      </div>
                    )}
                  </div>
                  <h3 className="line-clamp-1 text-base font-semibold text-white">
                    {contact.name}
                  </h3>
                  <p className="mt-1 line-clamp-1 text-xs text-white/55">
                    {contact.phone ||
                      (contact.telegram_username
                        ? `@${contact.telegram_username.replace(/^@/, "")}`
                        : "")}
                  </p>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
