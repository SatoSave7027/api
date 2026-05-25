import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useToast } from "../components/Toast";
import { Button, EmptyState, PageTitle, Spinner } from "../components/ui";
import { ApiError, api } from "../lib/api";
import type { Note } from "../lib/types";

export function NotesScreen() {
  const { notify } = useToast();
  const [items, setItems] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setItems(await api.notes.list());
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
        title="Notes"
        action={
          <Link to="/dashboard/notes/new">
            <Button>+ New note</Button>
          </Link>
        }
      />
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon="✎"
          title="No notes yet"
          description="Capture your first encrypted thought."
          action={
            <Link to="/dashboard/notes/new">
              <Button>Create note</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {items.map((note, index) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.03 * index }}
              >
                <Link
                  to={`/dashboard/notes/${note.id}`}
                  className="glass glow-border flex h-full flex-col rounded-2xl p-5 transition hover:-translate-y-0.5"
                >
                  <h3 className="line-clamp-1 text-base font-semibold text-white">
                    {note.title}
                  </h3>
                  <p className="mt-2 line-clamp-5 whitespace-pre-wrap text-sm text-white/55">
                    {note.content || "(empty)"}
                  </p>
                  <span className="mt-auto pt-4 text-xs text-white/40">
                    Updated {new Date(note.updated_at).toLocaleString()}
                  </span>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
