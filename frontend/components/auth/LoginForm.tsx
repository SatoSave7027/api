"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

type Step = "email" | "otp";

export default function LoginForm() {
  const { login } = useAuth();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await authApi.requestCode(email);
      setStep("otp");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Failed to send code. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await authApi.verifyCode(email, otp.toUpperCase());
      await login(res.data.access_token, res.data.refresh_token);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Invalid or expired code. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {step === "email" ? (
          <motion.form
            key="email-step"
            onSubmit={handleRequestCode}
            className="space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Welcome back
              </h2>
              <p className="text-gray-500">
                Enter your email to receive a login code
              </p>
            </div>
            <Input
              id="email"
              type="email"
              label="Email address"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              error={error}
            />
            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
            >
              Send Code
            </Button>
          </motion.form>
        ) : (
          <motion.form
            key="otp-step"
            onSubmit={handleVerifyCode}
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Check your email
              </h2>
              <p className="text-gray-500">
                We sent a 6-character code to{" "}
                <span className="text-[#39ff14]">{email}</span>
              </p>
            </div>
            <Input
              id="otp"
              type="text"
              label="Verification code"
              placeholder="A1B2C3"
              value={otp}
              onChange={(e) => setOtp(e.target.value.toUpperCase())}
              maxLength={6}
              required
              autoFocus
              className="text-center text-2xl tracking-widest font-mono"
              error={error}
            />
            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
            >
              Verify &amp; Sign In
            </Button>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setOtp("");
                setError("");
              }}
              className="w-full text-sm text-gray-500 hover:text-[#39ff14] transition-colors"
            >
              Use a different email
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
