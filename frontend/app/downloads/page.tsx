"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { Button, Card } from "@/components/ui";

const platforms = [
  {
    title: "Windows desktop",
    badge: "Tauri",
    description:
      "Native Tauri build of the SatoSave Vault UI. Ships as a single signed .exe file.",
    cta: "Build .exe instructions",
    href: "https://tauri.app/v1/guides/building/windows/",
  },
  {
    title: "Android mobile",
    badge: "Expo",
    description:
      "React Native client with the same vault, optimised for touch. Build with EAS or locally.",
    cta: "Build .apk instructions",
    href: "https://docs.expo.dev/build/setup/",
  },
  {
    title: "Web app",
    badge: "Next.js",
    description:
      "No installation needed — open SatoSave Vault directly in your browser.",
    cta: "Continue in browser",
    href: "/login",
  },
];

export default function DownloadsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-20">
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-semibold text-white sm:text-4xl"
      >
        Get SatoSave Vault
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="mt-3 max-w-2xl text-white/60"
      >
        Use the web app right now or build a native client from the bundled
        sources. Every client talks to the same encrypted backend, so your vault
        stays in sync.
      </motion.p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {platforms.map((platform, index) => (
          <motion.div
            key={platform.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index, duration: 0.5 }}
          >
            <Card className="h-full">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  {platform.title}
                </h3>
                <span className="rounded-full border border-neon-500/30 bg-ink-800 px-2 py-0.5 text-xs text-neon-400">
                  {platform.badge}
                </span>
              </div>
              <p className="mt-3 text-sm text-white/60">{platform.description}</p>
              <div className="mt-5">
                <Link href={platform.href}>
                  <Button variant="ghost">{platform.cta}</Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-10">
        <Link href="/" className="text-sm text-neon-400 hover:text-neon-300">
          ← Back home
        </Link>
      </div>
    </main>
  );
}
