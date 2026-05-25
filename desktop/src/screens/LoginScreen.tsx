import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useToast } from "../components/Toast";
import { Button, Card, Input } from "../components/ui";
import { ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";

type Stage = "email" | "code";

export function LoginScreen() {
  const navigate = useNavigate();
  const { user, hydrated, requestCode, verifyCode } = useAuth();
  const { notify } = useToast();
  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (hydrated && user) navigate("/dashboard", { replace: true });
  }, [hydrated, user, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(
      () => setCooldown((value) => Math.max(0, value - 1)),
      1000
    );
    return () => window.clearInterval(id);
  }, [cooldown]);

  async function handleRequest(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) {
      notify("Email is required.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await requestCode(email.trim());
      notify("Verification code sent.", "success");
      setStage("code");
      setCooldown(60);
    } catch (error) {
      notify(
        error instanceof ApiError ? error.message : "Failed to send code.",
        "error"
      );
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
      navigate("/dashboard", { replace: true });
    } catch (error) {
      notify(
        error instanceof ApiError ? error.message : "Verification failed.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card>
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold text-white">
              {stage === "email" ? "Sign in to SatoSave" : "Enter your code"}
            </h1>
            <p className="mt-2 text-sm text-white/60">
              {stage === "email"
                ? "Passwordless login. We send a one-time code to your email."
                : `Code sent to ${email}. It expires shortly.`}
            </p>
          </div>
          {stage === "email" ? (
            <form onSubmit={handleRequest} className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@domain.com"
                required
              />
              <Button
                type="submit"
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
                  ← Different email
                </button>
                <button
                  type="button"
                  disabled={cooldown > 0}
                  className="text-neon-400 disabled:opacity-40"
                  onClick={async () => {
                    if (cooldown > 0) return;
                    try {
                      await requestCode(email.trim());
                      notify("Code re-sent.", "success");
                      setCooldown(60);
                    } catch (error) {
                      notify(
                        error instanceof ApiError
                          ? error.message
                          : "Failed to resend.",
                        "error"
                      );
                    }
                  }}
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
