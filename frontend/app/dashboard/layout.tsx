"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Navbar } from "@/components/Navbar";
import { Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, hydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !user) {
      router.replace("/login");
    }
  }, [hydrated, user, router]);

  if (!hydrated || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Spinner size={28} />
      </main>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
