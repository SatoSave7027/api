"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import { Button, EmptyState, PageTitle, Spinner } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { ApiError, api } from "@/lib/api";
import type { Note } from "@/lib/types";

export default function NotesListPage() {
  const { notify } = useToast();
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const items = await api.notes.list();
        setNotes(items);
      } catch (error) {
        const message =
          error instanceof ApiError ? error.message : "Failed to load notes.";
        notify(message, "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [notify]);

  return (
    <div>
      <PageTitle
        title="Notes"
        subtitle="All your notes are encrypted before they leave this device."
        action={
          <Link href="/dashboard/notes/new">
            <Button variant="primary">+ New note</Button>
          </Link>
        }
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size={28} />
        </div>
      ) : notes.length === 0 ? (
        <EmptyState
          icon="✎"
          title="No notes yet"
          description="Capture your first thought. Notes are encrypted with your key before they reach the server."
          action={
            <Link href="/dashboard/notes/new">
              <Button variant="primary">Create your first note</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {notes.map((note, index) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: 0.03 * index, duration: 0.35 }}
              >
                <Link
                  href={`/dashboard/notes/${note.id}`}
                  className="glass glow-border flex h-full flex-col rounded-2xl p-5 transition hover:-translate-y-0.5"
                >
                  <h3 className="line-clamp-1 text-base font-semibold text-white">
                    {note.title}
                  </h3>
                  <p className="mt-2 line-clamp-5 whitespace-pre-wrap text-sm text-white/55">
                    {note.content || "(empty note)"}
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
