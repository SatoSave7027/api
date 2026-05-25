import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef, type ReactNode } from "react";

type Variant = "primary" | "ghost" | "danger";

export type ButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
  variant?: Variant;
  loading?: boolean;
  children?: ReactNode;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-500/70";

const variants: Record<Variant, string> = {
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
        className={`${base} ${variants[variant]} ${className}`}
        {...rest}
      >
        {loading && (
          <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" />
        )}
        <span>{children}</span>
      </motion.button>
    );
  }
);

export function Input(
  props: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }
) {
  const { label, className = "", ...rest } = props;
  return (
    <label className="block w-full text-sm">
      {label && (
        <span className="mb-1 block text-xs uppercase tracking-wider text-neon-400/80">
          {label}
        </span>
      )}
      <input
        {...rest}
        className={`w-full rounded-xl border border-ink-600 bg-ink-800/70 px-4 py-2.5 text-sm text-white outline-none transition focus:border-neon-500/70 ${className}`}
      />
    </label>
  );
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }
) {
  const { label, className = "", ...rest } = props;
  return (
    <label className="block w-full text-sm">
      {label && (
        <span className="mb-1 block text-xs uppercase tracking-wider text-neon-400/80">
          {label}
        </span>
      )}
      <textarea
        {...rest}
        className={`w-full rounded-xl border border-ink-600 bg-ink-800/70 px-4 py-2.5 text-sm text-white outline-none transition focus:border-neon-500/70 ${className}`}
      />
    </label>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
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
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass glow-border flex flex-col items-center justify-center gap-3 rounded-2xl px-8 py-14 text-center"
    >
      {icon && <div className="text-3xl text-neon-500">{icon}</div>}
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="max-w-md text-sm text-white/60">{description}</p>
      {action}
    </motion.div>
  );
}

export function Spinner({ size = 22 }: { size?: number }) {
  return (
    <span
      className="inline-block animate-spin rounded-full border-2 border-neon-500 border-r-transparent"
      style={{ width: size, height: size }}
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
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-white">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-white/55">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
