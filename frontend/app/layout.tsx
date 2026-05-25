import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SatoSave Vault",
  description: "Secure vault for notes, contacts and links with OTP auth."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
