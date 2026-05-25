"use client";

import { motion } from "framer-motion";
import { Contact } from "@/lib/types";
import { UserIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";

interface ContactCardProps {
  contact: Contact;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
  onClick: (contact: Contact) => void;
  index: number;
}

export default function ContactCard({
  contact,
  onEdit,
  onDelete,
  onClick,
  index,
}: ContactCardProps) {
  return (
    <motion.div
      className="group bg-[#0d1a0d] border border-[#1a2e1a] rounded-xl p-5 cursor-pointer
                 hover:border-[#39ff14]/40 hover:shadow-[0_0_20px_rgba(57,255,20,0.08)]
                 transition-all duration-200 flex flex-col items-center text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -2 }}
      onClick={() => onClick(contact)}
    >
      <div className="relative mb-4">
        {contact.avatar ? (
          <img
            src={contact.avatar.url}
            alt={contact.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-[#39ff14]/20 group-hover:border-[#39ff14]/50 transition-colors"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-[#39ff14]/10 border-2 border-[#1a2e1a] group-hover:border-[#39ff14]/30 flex items-center justify-center transition-colors">
            <UserIcon className="w-7 h-7 text-[#39ff14]/50" />
          </div>
        )}
      </div>
      <h3 className="text-white font-semibold text-base group-hover:text-[#39ff14] transition-colors mb-1 line-clamp-1 w-full">
        {contact.name}
      </h3>
      {contact.phone && (
        <p className="text-gray-500 text-sm truncate w-full">{contact.phone}</p>
      )}
      {contact.telegram_username && (
        <p className="text-[#39ff14]/60 text-sm truncate w-full">
          @{contact.telegram_username}
        </p>
      )}
      <div
        className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.button
          onClick={() => onEdit(contact)}
          className="p-1.5 text-gray-500 hover:text-[#39ff14] hover:bg-[#39ff14]/10 rounded-lg transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <PencilSquareIcon className="w-4 h-4" />
        </motion.button>
        <motion.button
          onClick={() => onDelete(contact.id)}
          className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <TrashIcon className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}
