"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { useAuth } from "@/lib/auth-context";
import { Button } from "./ui";

const sections = [
  { href: "/dashboard", label: "Vault" },
  { href: "/dashboard/notes", label: "Notes" },
  { href: "/dashboard/contacts", label: "Contacts" },
  { href: "/dashboard/links", label: "Links" },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-ink-700/60 bg-ink-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <motion.span
            animate={{ rotate: [0, 8, -6, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-neon-500 to-aqua-500 text-ink-950 font-bold"
            aria-hidden
          >
            S
          </motion.span>
          <span className="hidden text-sm font-semibold tracking-wide text-white sm:inline">
            SatoSave Vault
          </span>
        </Link>

        <nav className="flex items-center gap-1 overflow-x-auto">
          {sections.map((section) => {
            const active =
              section.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname?.startsWith(section.href);
            return (
              <Link
                key={section.href}
                href={section.href}
                className={`relative whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition ${
                  active
                    ? "text-neon-400"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 -z-10 rounded-lg bg-ink-800/80 ring-1 ring-neon-500/30"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                {section.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {user && (
            <span className="hidden text-xs text-white/50 sm:inline">
              {user.email}
            </span>
          )}
          <Button variant="ghost" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
