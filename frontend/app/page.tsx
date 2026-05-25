"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { Button } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";

const features = [
  {
    title: "Encrypted notes",
    description:
      "Capture thoughts, secrets and todos. Every note is encrypted with your key before it ever reaches the database.",
  },
  {
    title: "Important contacts",
    description:
      "Keep the people that matter at hand. Add phone numbers, Telegram handles, avatars and descriptions.",
  },
  {
    title: "Link library",
    description:
      "A personal directory of the URLs you actually need: previews, descriptions, and instant search.",
  },
];

export default function LandingPage() {
  const { user } = useAuth();
  return (
    <main className="relative overflow-hidden">
      <section className="mx-auto flex max-w-6xl flex-col items-center px-4 pb-16 pt-20 text-center sm:pt-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-full border border-neon-500/30 bg-ink-800/60 px-4 py-1.5 text-xs uppercase tracking-[0.3em] text-neon-400"
        >
          Encrypted personal vault
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.6 }}
          className="mt-6 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-white sm:text-6xl"
        >
          Your notes, contacts and links —{" "}
          <span className="bg-gradient-to-r from-neon-500 via-neon-400 to-aqua-500 bg-clip-text text-transparent">
            sealed by you
          </span>
          .
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="mt-6 max-w-2xl text-base text-white/65 sm:text-lg"
        >
          SatoSave Vault is a passwordless, end-to-end-encrypted home for
          everything you don&apos;t want anyone else to see. Sign in with a one-time
          code, the rest is yours.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.6 }}
          className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
        >
          <Link href={user ? "/dashboard" : "/login"}>
            <Button variant="primary">
              {user ? "Open your vault" : "Continue in browser"}
            </Button>
          </Link>
          <Link href="/downloads">
            <Button variant="ghost">Download app</Button>
          </Link>
        </motion.div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-24 sm:grid-cols-3">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ delay: 0.05 * index, duration: 0.6 }}
            className="glass glow-border rounded-2xl p-6 text-left"
          >
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-neon-500/30 to-aqua-500/30 text-neon-400">
              ◈
            </div>
            <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
            <p className="mt-2 text-sm text-white/60">{feature.description}</p>
          </motion.div>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="glass glow-border flex flex-col items-center gap-6 rounded-3xl px-6 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h2 className="text-2xl font-semibold text-white">
              Built for desktop, web and mobile.
            </h2>
            <p className="mt-2 max-w-xl text-sm text-white/60">
              The same UI ships as a Next.js web app, a Tauri desktop bundle for
              Windows, and an Expo / React Native app you can install on your
              phone. One backend, one vault.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href={user ? "/dashboard" : "/login"}>
              <Button variant="primary">
                {user ? "Go to vault" : "Sign in with email"}
              </Button>
            </Link>
            <Link href="/downloads">
              <Button variant="ghost">Downloads</Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
