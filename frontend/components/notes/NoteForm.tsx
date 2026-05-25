"use client";

import { useState, useEffect } from "react";
import { Note } from "@/lib/types";
import { notesApi } from "@/lib/api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface NoteFormProps {
  note?: Note | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function NoteForm({ note, onSuccess, onCancel }: NoteFormProps) {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setTitle(note?.title || "");
    setContent(note?.content || "");
  }, [note]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      if (note) {
        await notesApi.update(note.id, { title, content });
      } else {
        await notesApi.create({ title, content });
      }
      onSuccess();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="note-title"
        label="Title"
        placeholder="Note title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        autoFocus
      />
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1.5">
          Content
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your note here..."
          rows={8}
          required
          className="w-full bg-[#111] border border-[#1a2e1a] rounded-lg px-4 py-3
                     text-white placeholder-gray-600 resize-none
                     focus:outline-none focus:ring-2 focus:ring-[#39ff14] focus:border-transparent
                     transition-all duration-200"
        />
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button type="submit" className="flex-1" isLoading={isLoading}>
          {note ? "Save Changes" : "Create Note"}
        </Button>
      </div>
    </form>
  );
}
