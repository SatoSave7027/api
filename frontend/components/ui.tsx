"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef, type ReactNode } from "react";

type ButtonVariant = "primary" | "ghost" | "danger";

export type ButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
  variant?: ButtonVariant;
  loading?: boolean;
  children?: ReactNode;
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-500/70";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-neon-500 to-aqua-500 text-ink-950 shadow-glow hover:from-neon-400 hover:to-aqua-400",
  ghost:
    "border border-ink-600 bg-ink-800/60 text-neon-400 hover:border-neon-500/50 hover:bg-ink-700",
  danger:
    "border border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      loading = false,
      disabled,
      className = "",
      children,
      ...rest
    },
    ref
  ) {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        disabled={loading || disabled}
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        {...rest}
      >
        {loading && (
          <span
            className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent"
            aria-hidden
          />
        )}
        <span>{children}</span>
      </motion.button>
    );
  }
);

export function Input(
  props: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }
) {
  const { label, className = "", id, ...rest } = props;
  const inputId = id || rest.name || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <label className="block w-full text-sm">
      {label && (
        <span className="mb-1.5 block text-xs uppercase tracking-wider text-neon-400/80">
          {label}
        </span>
      )}
      <input
        id={inputId}
        className={`w-full rounded-xl border border-ink-600 bg-ink-800/70 px-4 py-2.5 text-sm text-white outline-none transition focus:border-neon-500/70 focus:bg-ink-700 ${className}`}
        {...rest}
      />
    </label>
  );
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }
) {
  const { label, className = "", id, ...rest } = props;
  const inputId = id || rest.name || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <label className="block w-full text-sm">
      {label && (
        <span className="mb-1.5 block text-xs uppercase tracking-wider text-neon-400/80">
          {label}
        </span>
      )}
      <textarea
        id={inputId}
        className={`w-full rounded-xl border border-ink-600 bg-ink-800/70 px-4 py-2.5 text-sm text-white outline-none transition focus:border-neon-500/70 focus:bg-ink-700 ${className}`}
        {...rest}
      />
    </label>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`glass glow-border rounded-2xl p-5 ${className}`}>
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass glow-border flex flex-col items-center justify-center gap-3 rounded-2xl px-8 py-16 text-center"
    >
      {icon && (
        <div className="text-4xl text-neon-500 animate-floaty" aria-hidden>
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="max-w-md text-sm text-white/60">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </motion.div>
  );
}

export function Spinner({ size = 22 }: { size?: number }) {
  return (
    <span
      className="inline-block animate-spin rounded-full border-2 border-neon-500 border-r-transparent"
      style={{ width: size, height: size }}
      aria-label="Loading"
    />
  );
}

export function PageTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-semibold tracking-tight text-white sm:text-3xl"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="mt-1 text-sm text-white/60"
          >
            {subtitle}
          </motion.p>
        )}
      </div>
      {action}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/80 backdrop-blur-md sm:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 32, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 24, opacity: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        onClick={(event) => event.stopPropagation()}
        className="glass glow-border w-full max-w-lg rounded-t-3xl p-6 sm:rounded-3xl"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            type="button"
            className="text-white/60 hover:text-white"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}
