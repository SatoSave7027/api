"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Note } from "@/lib/types";
import { notesApi } from "@/lib/api";
import NoteCard from "@/components/notes/NoteCard";
import NoteForm from "@/components/notes/NoteForm";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import {
  PlusIcon,
  DocumentTextIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { formatDate } from "@/lib/utils";

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await notesApi.list();
      setNotes(res.data);
    } catch {
      setNotes([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await notesApi.delete(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const handleFormSuccess = async () => {
    setShowForm(false);
    setEditingNote(null);
    await fetchNotes();
  };

  const openEdit = (note: Note) => {
    setEditingNote(note);
    setShowForm(true);
    setViewingNote(null);
  };

  return (
    <div className="p-6 lg:p-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Notes</h1>
          <p className="text-gray-500 mt-1">
            {notes.length} encrypted {notes.length === 1 ? "note" : "notes"}
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingNote(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          New Note
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-[#0d1a0d] border border-[#1a2e1a] rounded-xl p-5 animate-pulse"
            >
              <div className="h-5 bg-[#1a2e1a] rounded mb-3 w-3/4" />
              <div className="h-3 bg-[#1a2e1a] rounded mb-2" />
              <div className="h-3 bg-[#1a2e1a] rounded mb-2 w-5/6" />
              <div className="h-3 bg-[#1a2e1a] rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : notes.length === 0 ? (
        <EmptyState
          icon={<DocumentTextIcon className="w-20 h-20" />}
          title="No notes yet"
          description="Create your first encrypted note to get started"
          action={
            <Button onClick={() => setShowForm(true)} size="lg">
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Note
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {notes.map((note, i) => (
              <NoteCard
                key={note.id}
                note={note}
                index={i}
                onEdit={openEdit}
                onDelete={handleDelete}
                onClick={setViewingNote}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingNote(null);
        }}
        title={editingNote ? "Edit Note" : "New Note"}
      >
        <NoteForm
          note={editingNote}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingNote(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={!!viewingNote}
        onClose={() => setViewingNote(null)}
        title={viewingNote?.title || ""}
      >
        {viewingNote && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-gray-600">
                Updated {formatDate(viewingNote.updated_at)}
              </p>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => openEdit(viewingNote)}
              >
                Edit
              </Button>
            </div>
            <div className="bg-[#111] border border-[#1a2e1a] rounded-xl p-4 max-h-96 overflow-y-auto">
              <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                {viewingNote.content}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
