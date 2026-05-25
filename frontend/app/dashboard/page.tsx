"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { PageTitle } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";

const sections = [
  {
    href: "/dashboard/notes",
    title: "Notes",
    description: "Encrypted text snippets for thoughts, secrets and todos.",
    icon: "✎",
  },
  {
    href: "/dashboard/contacts",
    title: "Important contacts",
    description: "People you care about, with phones, Telegrams and avatars.",
    icon: "☎",
  },
  {
    href: "/dashboard/links",
    title: "Link library",
    description: "Curated URLs with previews and descriptions.",
    icon: "⇪",
  },
];

export default function DashboardHome() {
  const { user } = useAuth();
  return (
    <div>
      <PageTitle
        title={`Welcome back${user?.email ? `, ${user.email}` : ""}.`}
        subtitle="Pick a section to open your vault."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        {sections.map((section, index) => (
          <motion.div
            key={section.href}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index, duration: 0.5 }}
          >
            <Link
              href={section.href}
              className="glass glow-border block rounded-2xl p-6 transition hover:-translate-y-0.5 hover:shadow-glow"
            >
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-neon-500/30 to-aqua-500/30 text-2xl text-neon-400">
                {section.icon}
              </div>
              <h2 className="text-lg font-semibold text-white">
                {section.title}
              </h2>
              <p className="mt-2 text-sm text-white/60">
                {section.description}
              </p>
              <p className="mt-4 text-xs uppercase tracking-widest text-neon-400">
                Open →
              </p>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
