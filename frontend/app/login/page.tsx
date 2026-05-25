"use client";

import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { Button, Card, Input, Spinner } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type Stage = "email" | "code";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <Spinner size={28} />
        </main>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/dashboard";
  const { user, hydrated, requestCode, verifyCode } = useAuth();
  const { notify } = useToast();

  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (hydrated && user) {
      router.replace(next);
    }
  }, [hydrated, user, next, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(
      () => setCooldown((value) => Math.max(0, value - 1)),
      1000
    );
    return () => window.clearInterval(id);
  }, [cooldown]);

  async function handleRequestCode(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) {
      notify("Please enter your email.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await requestCode(email.trim());
      notify("Verification code sent. Check your inbox.", "success");
      setStage("code");
      setCooldown(60);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Failed to send code.";
      notify(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    if (code.trim().length < 4) {
      notify("Enter the code from your email.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await verifyCode(email.trim(), code.trim());
      notify("Welcome back.", "success");
      router.replace(next);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Verification failed.";
      notify(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0) return;
    try {
      await requestCode(email.trim());
      notify("Code re-sent.", "success");
      setCooldown(60);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Failed to resend.";
      notify(message, "error");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card>
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold text-white">
              {stage === "email" ? "Sign in to SatoSave" : "Enter your code"}
            </h1>
            <p className="mt-2 text-sm text-white/60">
              {stage === "email"
                ? "We will send a one-time code to your inbox. No passwords, ever."
                : `We just sent a 6-character code to ${email}. It is valid for a few minutes.`}
            </p>
          </div>

          {stage === "email" ? (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <Input
                label="Email"
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@domain.com"
                required
              />
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                loading={submitting}
              >
                Send verification code
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <Input
                label="Code"
                name="code"
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.toUpperCase().replace(/\s/g, ""))
                }
                placeholder="ABC123"
                maxLength={12}
                className="tracking-[0.45em] text-center text-xl uppercase"
                autoFocus
                required
              />
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                loading={submitting}
              >
                Verify & sign in
              </Button>
              <div className="flex items-center justify-between text-xs text-white/60">
                <button
                  type="button"
                  className="hover:text-white"
                  onClick={() => setStage("email")}
                >
                  ← Use a different email
                </button>
                <button
                  type="button"
                  disabled={cooldown > 0}
                  onClick={handleResend}
                  className="text-neon-400 hover:text-neon-300 disabled:opacity-40"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
              </div>
            </form>
          )}
        </Card>
      </motion.div>
    </main>
  );
}
