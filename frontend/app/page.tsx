"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import LoginForm from "@/components/auth/LoginForm";
import {
  ShieldCheckIcon,
  DocumentTextIcon,
  UserGroupIcon,
  LinkIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";

const features = [
  {
    icon: DocumentTextIcon,
    title: "Encrypted Notes",
    desc: "Store private notes with Fernet encryption at rest",
  },
  {
    icon: UserGroupIcon,
    title: "Important Contacts",
    desc: "Keep your key contacts safe with encrypted fields",
  },
  {
    icon: LinkIcon,
    title: "Link Library",
    desc: "Organize your important links in one secure place",
  },
  {
    icon: ShieldCheckIcon,
    title: "Zero Passwords",
    desc: "Passwordless auth via email OTP — no passwords to leak",
  },
];

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard/notes");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080f08] flex items-center justify-center">
        <motion.div
          className="w-8 h-8 border-2 border-[#39ff14] border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#080f08]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#39ff14]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#00ffd5]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative min-h-screen flex flex-col lg:flex-row">
        <div className="flex-1 flex flex-col justify-between p-8 lg:p-16">
          <div>
            <div className="flex items-center gap-3 mb-16">
              <div className="w-10 h-10 rounded-xl bg-[#39ff14]/20 border border-[#39ff14]/40 flex items-center justify-center">
                <ShieldCheckIcon className="w-6 h-6 text-[#39ff14]" />
              </div>
              <span className="text-2xl font-bold text-white">
                SatoSave{" "}
                <span className="text-[#39ff14]">Vault</span>
              </span>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                Your data.{" "}
                <span className="text-[#39ff14]">Encrypted.</span>
                <br />
                Always.
              </h1>
              <p className="text-xl text-gray-400 max-w-lg mb-12">
                A secure personal vault for your notes, contacts, and links.
                Passwordless login. End-to-end encryption.
              </p>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  className="flex items-start gap-3 p-4 bg-[#0d1a0d] border border-[#1a2e1a] rounded-xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#39ff14]/10 border border-[#39ff14]/20 flex items-center justify-center">
                    <f.icon className="w-5 h-5 text-[#39ff14]" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">{f.title}</h3>
                    <p className="text-gray-500 text-xs mt-0.5">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <motion.div
            className="mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <a
              href="#"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-[#39ff14] transition-colors text-sm"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Download desktop app
            </a>
          </motion.div>
        </div>

        <div className="flex-1 flex items-center justify-center p-8 lg:p-16 bg-[#080f08] lg:bg-[#0a120a]">
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-[#0d1a0d] border border-[#1a2e1a] rounded-2xl p-8 shadow-2xl shadow-[#39ff14]/5">
              <LoginForm />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
