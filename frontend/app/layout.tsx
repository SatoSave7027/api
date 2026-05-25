import type { Metadata, Viewport } from "next";
import "../styles/globals.css";

import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "SatoSave Vault — Encrypted notes, contacts & links",
  description:
    "SatoSave Vault keeps your personal notes, important contacts and a curated library of links encrypted and accessible from any device.",
};

export const viewport: Viewport = {
  themeColor: "#04060a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
