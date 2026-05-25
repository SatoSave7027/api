"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export default function Card({ children, className, onClick, hover = false }: CardProps) {
  return (
    <motion.div
      className={cn(
        "bg-[#0d1a0d] border border-[#1a2e1a] rounded-xl p-5",
        "transition-colors duration-200",
        hover &&
          "cursor-pointer hover:border-[#39ff14]/50 hover:shadow-[0_0_15px_rgba(57,255,20,0.1)]",
        className
      )}
      whileHover={hover ? { scale: 1.01 } : undefined}
      whileTap={onClick ? { scale: 0.99 } : undefined}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
