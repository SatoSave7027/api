import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useToast } from "../components/Toast";
import { Button, EmptyState, PageTitle, Spinner } from "../components/ui";
import { ApiError, api } from "../lib/api";
import type { Contact } from "../lib/types";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ContactsScreen() {
  const { notify } = useToast();
  const [items, setItems] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setItems(await api.contacts.list());
      } catch (error) {
        notify(
          error instanceof ApiError ? error.message : "Failed to load.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [notify]);

  return (
    <div>
      <PageTitle
        title="Important contacts"
        action={
          <Link to="/dashboard/contacts/new">
            <Button>+ New contact</Button>
          </Link>
        }
      />
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon="☎"
          title="No contacts yet"
          description="Add the people that matter — phone or Telegram required."
          action={
            <Link to="/dashboard/contacts/new">
              <Button>Add a contact</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <AnimatePresence>
            {items.map((contact, index) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.03 * index }}
              >
                <Link
                  to={`/dashboard/contacts/${contact.id}`}
                  className="glass glow-border flex h-full flex-col items-center rounded-2xl p-5 text-center transition hover:-translate-y-0.5"
                >
                  <div className="mb-4 h-20 w-20 overflow-hidden rounded-full border border-ink-600 bg-ink-800">
                    {contact.avatar_url ? (
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
                  <p className="mt-1 text-xs text-white/55">
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
