import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import { PageTitle } from "../components/ui";
import { useAuth } from "../lib/auth";

const sections = [
  {
    to: "/dashboard/notes",
    title: "Notes",
    description: "Encrypted text snippets.",
    icon: "✎",
  },
  {
    to: "/dashboard/contacts",
    title: "Contacts",
    description: "People you care about.",
    icon: "☎",
  },
  {
    to: "/dashboard/links",
    title: "Links",
    description: "Curated URLs with previews.",
    icon: "⇪",
  },
];

export function DashboardScreen() {
  const { user } = useAuth();
  return (
    <div>
      <PageTitle
        title={`Welcome back${user ? `, ${user.email}` : ""}.`}
        subtitle="Pick a section to open."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        {sections.map((section, index) => (
          <motion.div
            key={section.to}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index }}
          >
            <Link
              to={section.to}
              className="glass glow-border block rounded-2xl p-6 transition hover:-translate-y-0.5"
            >
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-neon-500/30 to-aqua-500/30 text-2xl text-neon-400">
                {section.icon}
              </div>
              <h2 className="text-lg font-semibold text-white">{section.title}</h2>
              <p className="mt-2 text-sm text-white/60">{section.description}</p>
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
