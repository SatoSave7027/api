"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type ToastKind = "success" | "error" | "info";

type ToastItem = {
  id: number;
  kind: ToastKind;
  message: string;
};

type ToastContextValue = {
  notify: (message: string, kind?: ToastKind) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, kind: ToastKind = "info") => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setItems((prev) => [...prev, { id, kind, message }]);
      window.setTimeout(() => remove(id), 4200);
    },
    [remove]
  );

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-6 z-[60] flex flex-col items-center gap-2 px-4 sm:top-8">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className={`pointer-events-auto max-w-md rounded-xl px-4 py-3 text-sm shadow-glow glass ${
                item.kind === "success"
                  ? "text-neon-400"
                  : item.kind === "error"
                  ? "text-rose-300"
                  : "text-aqua-400"
              }`}
              onClick={() => remove(item.id)}
              role="status"
            >
              {item.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return ctx;
}
