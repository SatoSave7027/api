import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authApi } from "@/lib/api";

interface LoginScreenProps {
  onLogin: (access: string, refresh: string) => void;
}

type Step = "email" | "otp";

export default function LoginScreen({ onLogin }: LoginScreenProps) {
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
        "Failed to send code";
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
      onLogin(res.data.access_token, res.data.refresh_token);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Invalid or expired code";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-[#080f08] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#39ff14]/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        className="w-full max-w-sm p-8 bg-[#0d1a0d] border border-[#1a2e1a] rounded-2xl shadow-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="text-center mb-8">
          <span className="text-4xl">🛡️</span>
          <h1 className="text-2xl font-bold text-white mt-3">SatoSave Vault</h1>
          <p className="text-gray-500 text-sm mt-1">Secure personal data vault</p>
        </div>

        <AnimatePresence mode="wait">
          {step === "email" ? (
            <motion.form
              key="email"
              onSubmit={handleRequestCode}
              className="space-y-4"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoFocus
                  className="w-full bg-[#111] border border-[#1a2e1a] rounded-lg px-4 py-3
                             text-white placeholder-gray-600
                             focus:outline-none focus:ring-2 focus:ring-[#39ff14] focus:border-transparent
                             transition-all"
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <motion.button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#39ff14] text-black font-semibold rounded-lg py-3
                           hover:bg-[#2de010] transition-colors disabled:opacity-50
                           shadow-[0_0_20px_rgba(57,255,20,0.3)]"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? "Sending..." : "Send Code"}
              </motion.button>
            </motion.form>
          ) : (
            <motion.form
              key="otp"
              onSubmit={handleVerifyCode}
              className="space-y-4"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <div className="text-center">
                <p className="text-gray-400 text-sm">
                  Code sent to{" "}
                  <span className="text-[#39ff14]">{email}</span>
                </p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">
                  Verification code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.toUpperCase())}
                  placeholder="A1B2C3"
                  maxLength={6}
                  required
                  autoFocus
                  className="w-full bg-[#111] border border-[#1a2e1a] rounded-lg px-4 py-3
                             text-white placeholder-gray-600 text-center text-2xl font-mono tracking-widest
                             focus:outline-none focus:ring-2 focus:ring-[#39ff14] focus:border-transparent
                             transition-all"
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <motion.button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#39ff14] text-black font-semibold rounded-lg py-3
                           hover:bg-[#2de010] transition-colors disabled:opacity-50
                           shadow-[0_0_20px_rgba(57,255,20,0.3)]"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? "Verifying..." : "Sign In"}
              </motion.button>
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setOtp("");
                  setError("");
                }}
                className="w-full text-sm text-gray-500 hover:text-[#39ff14] transition-colors"
              >
                Use different email
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
