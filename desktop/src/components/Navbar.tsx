import { motion } from "framer-motion";
import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../lib/auth";
import { Button } from "./ui";

const sections = [
  { to: "/dashboard", label: "Vault", end: true },
  { to: "/dashboard/notes", label: "Notes" },
  { to: "/dashboard/contacts", label: "Contacts" },
  { to: "/dashboard/links", label: "Links" },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-30 border-b border-ink-700/70 bg-ink-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <motion.span
            animate={{ rotate: [0, 8, -6, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-neon-500 to-aqua-500 font-bold text-ink-950"
          >
            S
          </motion.span>
          <span className="hidden text-sm font-semibold text-white sm:inline">
            SatoSave Vault
          </span>
        </div>
        <nav className="flex items-center gap-1">
          {sections.map((section) => (
            <NavLink
              key={section.to}
              to={section.to}
              end={section.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition ${
                  isActive
                    ? "bg-ink-800/80 text-neon-400 ring-1 ring-neon-500/30"
                    : "text-white/60 hover:text-white"
                }`
              }
            >
              {section.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {user && (
            <span className="hidden text-xs text-white/50 sm:inline">
              {user.email}
            </span>
          )}
          <Button
            variant="ghost"
            onClick={async () => {
              await logout();
              navigate("/login", { replace: true });
            }}
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
