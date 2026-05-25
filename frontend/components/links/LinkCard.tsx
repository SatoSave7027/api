"use client";

import { motion } from "framer-motion";
import { Link as LinkType } from "@/lib/types";
import { LinkIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { truncate } from "@/lib/utils";

interface LinkCardProps {
  link: LinkType;
  onEdit: (link: LinkType) => void;
  onDelete: (id: string) => void;
  onClick: (link: LinkType) => void;
  index: number;
}

export default function LinkCard({ link, onEdit, onDelete, onClick, index }: LinkCardProps) {
  return (
    <motion.div
      className="group bg-[#0d1a0d] border border-[#1a2e1a] rounded-xl overflow-hidden cursor-pointer
                 hover:border-[#39ff14]/40 hover:shadow-[0_0_20px_rgba(57,255,20,0.08)]
                 transition-all duration-200 flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -2 }}
      onClick={() => onClick(link)}
    >
      <div className="aspect-video bg-[#111] flex items-center justify-center overflow-hidden">
        {link.image ? (
          <img
            src={link.image.url}
            alt={link.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-[#39ff14]/20 group-hover:text-[#39ff14]/40 transition-colors">
            <LinkIcon className="w-10 h-10" />
          </div>
        )}
      </div>
      <div className="p-4 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-white font-semibold text-base group-hover:text-[#39ff14] transition-colors line-clamp-2">
            {link.title}
          </h3>
          <div
            className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.button
              onClick={() => onEdit(link)}
              className="p-1.5 text-gray-500 hover:text-[#39ff14] hover:bg-[#39ff14]/10 rounded-lg transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <PencilSquareIcon className="w-4 h-4" />
            </motion.button>
            <motion.button
              onClick={() => onDelete(link.id)}
              className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <TrashIcon className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
        <p className="text-[#39ff14]/50 text-xs mt-1 truncate">{link.url}</p>
        {link.description && (
          <p className="text-gray-500 text-sm mt-2 line-clamp-2">
            {truncate(link.description, 100)}
          </p>
        )}
      </div>
    </motion.div>
  );
}
