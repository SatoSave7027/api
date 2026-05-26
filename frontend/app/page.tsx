"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Download, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthPanel } from "@/components/AuthPanel";
import { Dashboard } from "@/components/Dashboard";
import { api, tokenStore, type User } from "@/lib/api";

export default function HomePage() {
  const [mode, setMode] = useState<"landing" | "auth" | "app">("landing");
  const [user, setUser] = useState<User | null>(null);
  const [downloadHint, setDownloadHint] = useState("");

  useEffect(() => {
    if (!tokenStore.getAccess()) {
      return;
    }
    api.me()
      .then((currentUser) => {
        setUser(currentUser);
        setMode("app");
      })
      .catch(() => tokenStore.clear());
  }, []);

  return (
    <main className="min-h-screen px-4 py-6 sm:px-8 lg:px-12">
      <AnimatePresence mode="wait">
        {mode !== "app" ? (
          <motion.section
            key="landing"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col justify-center gap-10 lg:flex-row lg:items-center"
          >
            <div className="flex-1 space-y-8">
              <motion.div
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center gap-2 rounded-full border border-vault-teal/30 bg-vault-teal/10 px-4 py-2 text-sm text-vault-teal"
              >
                <ShieldCheck size={18} /> Passwordless encrypted vault
              </motion.div>
              <div className="space-y-5">
                <h1 className="max-w-3xl text-5xl font-black tracking-tight text-white sm:text-7xl">
                  SatoSave <span className="text-vault-green">Vault</span>
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-emerald-50/72">
                  Храни заметки, важные контакты и библиотеку ссылок в защищённом хранилище с OTP-входом,
                  серверными сессиями и шифрованием данных перед записью в PostgreSQL.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <motion.button
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDownloadHint("Desktop сборка создаётся командой npm run tauri:build в папке desktop.")}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-vault-green px-6 py-3 font-bold text-black shadow-glow"
                >
                  <Download size={19} /> Скачать приложение
                </motion.button>
                <motion.button
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setMode("auth")}
                  className="rounded-2xl border border-vault-teal/40 px-6 py-3 font-bold text-vault-teal hover:bg-vault-teal/10"
                >
                  Продолжить в браузере
                </motion.button>
              </div>
              {downloadHint ? <p className="text-sm text-vault-teal">{downloadHint}</p> : null}
            </div>
            <div className="glass flex-1 rounded-[2rem] p-6 sm:p-8">
              {mode === "auth" ? (
                <AuthPanel onAuthenticated={(nextUser) => { setUser(nextUser); setMode("app"); }} />
              ) : (
                <div className="space-y-5">
                  {["Encrypted notes", "Important contacts", "Private link library"].map((label, index) => (
                    <motion.div
                      key={label}
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.08 }}
                      className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"
                    >
                      <div className="flex items-center gap-3 text-xl font-bold">
                        <Sparkles className="text-vault-green" /> {label}
                      </div>
                      <p className="mt-2 text-sm text-emerald-50/60">Real API, real PostgreSQL storage, real encrypted payloads.</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.section>
        ) : user ? (
          <Dashboard
            key="dashboard"
            user={user}
            onLogout={() => {
              tokenStore.clear();
              setUser(null);
              setMode("landing");
            }}
          />
        ) : null}
      </AnimatePresence>
    </main>
  );
}
