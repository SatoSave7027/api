import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SatoSave Vault",
  description: "Encrypted notes, contacts, and links vault"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
