"use client";

import { motion } from "framer-motion";
import { Note } from "@/lib/types";
import { formatDate, truncate } from "@/lib/utils";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onClick: (note: Note) => void;
  index: number;
}

export default function NoteCard({ note, onEdit, onDelete, onClick, index }: NoteCardProps) {
  return (
    <motion.div
      className="group bg-[#0d1a0d] border border-[#1a2e1a] rounded-xl p-5 cursor-pointer
                 hover:border-[#39ff14]/40 hover:shadow-[0_0_20px_rgba(57,255,20,0.08)]
                 transition-all duration-200"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -2 }}
      onClick={() => onClick(note)}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-white font-semibold text-lg leading-snug group-hover:text-[#39ff14] transition-colors line-clamp-2">
          {note.title}
        </h3>
        <div
          className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.button
            onClick={() => onEdit(note)}
            className="p-1.5 text-gray-500 hover:text-[#39ff14] hover:bg-[#39ff14]/10 rounded-lg transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <PencilSquareIcon className="w-4 h-4" />
          </motion.button>
          <motion.button
            onClick={() => onDelete(note.id)}
            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <TrashIcon className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
      <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-3">
        {truncate(note.content, 150)}
      </p>
      <p className="text-xs text-gray-600">
        Updated {formatDate(note.updated_at)}
      </p>
    </motion.div>
  );
}
