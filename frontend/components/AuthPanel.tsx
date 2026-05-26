"use client";

import { motion } from "framer-motion";
import { Loader2, MailCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { api, type User } from "@/lib/api";

export function AuthPanel({ onAuthenticated }: { onAuthenticated: (user: User) => void }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function submitEmail(event: FormEvent) { event.preventDefault(); setLoading(true); setError(""); try { await api.requestCode(email); setStep("code"); setMessage("Код отправлен на email через SMTP."); } catch (err) { setError(err instanceof Error ? err.message : "Не удалось отправить код"); } finally { setLoading(false); } }
  async function submitCode(event: FormEvent) { event.preventDefault(); setLoading(true); setError(""); try { onAuthenticated(await api.verifyCode(email, code)); } catch (err) { setError(err instanceof Error ? err.message : "Неверный код"); } finally { setLoading(false); } }
  return <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6"><div><div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-vault-green text-black"><MailCheck /></div><h2 className="text-3xl font-black text-white">Вход без пароля</h2><p className="mt-2 text-sm text-emerald-50/65">Введите email и подтвердите шестизначный OTP-код.</p></div><form onSubmit={step === "email" ? submitEmail : submitCode} className="space-y-4"><input className="input" type="email" value={email} disabled={step === "code"} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />{step === "code" ? <input className="input uppercase tracking-[0.45em]" value={code} onChange={(event) => setCode(event.target.value)} placeholder="A1B2C3" maxLength={6} required /> : null}<motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-vault-teal px-5 py-3 font-black text-black disabled:opacity-60">{loading ? <Loader2 className="animate-spin" size={18} /> : null}{step === "email" ? "Получить код" : "Войти в Vault"}</motion.button></form>{message ? <p className="rounded-2xl border border-vault-green/20 bg-vault-green/10 p-3 text-sm text-vault-green">{message}</p> : null}{error ? <p className="rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}</motion.div>;
}
