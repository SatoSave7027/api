"use client";

import { motion } from "framer-motion";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-20 px-4 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="text-[#39ff14]/30 mb-6"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        {icon}
      </motion.div>
      <h3 className="text-2xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-500 max-w-sm mb-8">{description}</p>
      {action}
    </motion.div>
  );
}
