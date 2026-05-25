import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Note } from "@/lib/types";
import { notesApi } from "@/lib/api";
import { formatDate, truncate } from "@/lib/utils";

type ModalType = "create" | "edit" | "view" | null;

export default function NotesScreen() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modal, setModal] = useState<ModalType>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

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

  const openCreate = () => {
    setSelectedNote(null);
    setTitle("");
    setContent("");
    setError("");
    setModal("create");
  };

  const openEdit = (note: Note) => {
    setSelectedNote(note);
    setTitle(note.title);
    setContent(note.content);
    setError("");
    setModal("edit");
  };

  const openView = (note: Note) => {
    setSelectedNote(note);
    setModal("view");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      if (modal === "edit" && selectedNote) {
        await notesApi.update(selectedNote.id, { title, content });
      } else {
        await notesApi.create({ title, content });
      }
      setModal(null);
      await fetchNotes();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Something went wrong";
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notesApi.delete(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (selectedNote?.id === id) setModal(null);
    } catch {}
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Notes</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {notes.length} encrypted {notes.length === 1 ? "note" : "notes"}
          </p>
        </div>
        <motion.button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#39ff14] text-black font-semibold px-4 py-2 rounded-lg
                     hover:bg-[#2de010] transition-colors shadow-[0_0_15px_rgba(57,255,20,0.3)]"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span>+</span> New Note
        </motion.button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-[#0d1a0d] border border-[#1a2e1a] rounded-xl p-4 animate-pulse"
            >
              <div className="h-4 bg-[#1a2e1a] rounded mb-3 w-3/4" />
              <div className="h-3 bg-[#1a2e1a] rounded mb-2" />
              <div className="h-3 bg-[#1a2e1a] rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <motion.div
            className="text-6xl mb-4 text-[#39ff14]/20"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            📝
          </motion.div>
          <h3 className="text-xl font-semibold text-white mb-2">No notes yet</h3>
          <p className="text-gray-500 mb-6 text-sm">Create your first encrypted note</p>
          <motion.button
            onClick={openCreate}
            className="bg-[#39ff14] text-black font-semibold px-6 py-2.5 rounded-lg hover:bg-[#2de010] transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            + Create Note
          </motion.button>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {notes.map((note, i) => (
              <motion.div
                key={note.id}
                className="group bg-[#0d1a0d] border border-[#1a2e1a] rounded-xl p-4 cursor-pointer
                           hover:border-[#39ff14]/40 hover:shadow-[0_0_15px_rgba(57,255,20,0.08)]
                           transition-all"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ y: -2 }}
                onClick={() => openView(note)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-white font-semibold text-sm group-hover:text-[#39ff14] transition-colors line-clamp-2">
                    {note.title}
                  </h3>
                  <div
                    className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => openEdit(note)}
                      className="p-1 text-gray-500 hover:text-[#39ff14] hover:bg-[#39ff14]/10 rounded transition-colors"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed line-clamp-3">
                  {truncate(note.content, 120)}
                </p>
                <p className="text-gray-600 text-xs mt-3">
                  {formatDate(note.updated_at)}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {(modal === "create" || modal === "edit") && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setModal(null)}
            />
            <motion.div
              className="relative z-10 w-full max-w-lg bg-[#0d1a0d] border border-[#1a2e1a] rounded-2xl shadow-2xl"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
            >
              <div className="flex items-center justify-between p-5 border-b border-[#1a2e1a]">
                <h2 className="text-lg font-bold text-white">
                  {modal === "edit" ? "Edit Note" : "New Note"}
                </h2>
                <button
                  onClick={() => setModal(null)}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleSave} className="p-5 space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">
                    Title
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Note title"
                    required
                    autoFocus
                    className="w-full bg-[#111] border border-[#1a2e1a] rounded-lg px-4 py-2.5 text-white
                               placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#39ff14]
                               focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">
                    Content
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your note..."
                    rows={8}
                    required
                    className="w-full bg-[#111] border border-[#1a2e1a] rounded-lg px-4 py-2.5 text-white
                               placeholder-gray-600 resize-none focus:outline-none focus:ring-2
                               focus:ring-[#39ff14] focus:border-transparent transition-all"
                  />
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setModal(null)}
                    className="flex-1 py-2.5 rounded-lg border border-[#1a2e1a] text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-2.5 rounded-lg bg-[#39ff14] text-black font-semibold hover:bg-[#2de010] transition-colors disabled:opacity-50"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    {isSaving ? "Saving..." : modal === "edit" ? "Save Changes" : "Create"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {modal === "view" && selectedNote && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setModal(null)}
            />
            <motion.div
              className="relative z-10 w-full max-w-lg bg-[#0d1a0d] border border-[#1a2e1a] rounded-2xl shadow-2xl"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
            >
              <div className="flex items-center justify-between p-5 border-b border-[#1a2e1a]">
                <h2 className="text-lg font-bold text-white truncate flex-1">
                  {selectedNote.title}
                </h2>
                <button
                  onClick={() => setModal(null)}
                  className="text-gray-500 hover:text-white transition-colors ml-2"
                >
                  ✕
                </button>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-xs text-gray-600">
                    Updated {formatDate(selectedNote.updated_at)}
                  </p>
                  <button
                    onClick={() => openEdit(selectedNote)}
                    className="text-sm text-[#39ff14] hover:text-[#2de010] transition-colors"
                  >
                    Edit
                  </button>
                </div>
                <div className="bg-[#111] border border-[#1a2e1a] rounded-xl p-4 max-h-80 overflow-y-auto">
                  <p className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                    {selectedNote.content}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
