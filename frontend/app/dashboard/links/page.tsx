"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import { Button, EmptyState, PageTitle, Spinner } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { ApiError, api } from "@/lib/api";
import type { Link as LinkItem } from "@/lib/types";

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function LinksListPage() {
  const { notify } = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<LinkItem[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.links.list();
        setItems(data);
      } catch (error) {
        const message =
          error instanceof ApiError ? error.message : "Failed to load links.";
        notify(message, "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [notify]);

  return (
    <div>
      <PageTitle
        title="Link library"
        subtitle="Encrypted bookmarks with previews and descriptions."
        action={
          <Link href="/dashboard/links/new">
            <Button variant="primary">+ New link</Button>
          </Link>
        }
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size={28} />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon="⇪"
          title="No links yet"
          description="Save your first link. URLs, titles and descriptions are encrypted at rest."
          action={
            <Link href="/dashboard/links/new">
              <Button variant="primary">Save a link</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <AnimatePresence>
            {items.map((link, index) => (
              <motion.div
                key={link.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: 0.03 * index, duration: 0.35 }}
              >
                <Link
                  href={`/dashboard/links/${link.id}`}
                  className="glass glow-border flex h-full flex-col overflow-hidden rounded-2xl transition hover:-translate-y-0.5"
                >
                  <div className="relative h-32 w-full overflow-hidden bg-ink-800">
                    {link.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={link.image_url}
                        alt={link.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl text-neon-500/70">
                        ⇪
                      </div>
                    )}
                    <span className="absolute bottom-2 right-2 rounded-full bg-ink-950/80 px-2 py-0.5 text-[10px] uppercase tracking-widest text-neon-400">
                      {hostnameOf(link.url)}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="line-clamp-2 text-sm font-semibold text-white">
                      {link.title}
                    </h3>
                    {link.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-white/55">
                        {link.description}
                      </p>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
