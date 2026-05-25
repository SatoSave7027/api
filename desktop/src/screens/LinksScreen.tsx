import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useToast } from "../components/Toast";
import { Button, EmptyState, PageTitle, Spinner } from "../components/ui";
import { ApiError, api } from "../lib/api";
import type { LinkItem } from "../lib/types";

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function LinksScreen() {
  const { notify } = useToast();
  const [items, setItems] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setItems(await api.links.list());
      } catch (error) {
        notify(
          error instanceof ApiError ? error.message : "Failed to load.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [notify]);

  return (
    <div>
      <PageTitle
        title="Link library"
        action={
          <Link to="/dashboard/links/new">
            <Button>+ New link</Button>
          </Link>
        }
      />
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon="⇪"
          title="No links yet"
          description="Save a URL with a preview and a description."
          action={
            <Link to="/dashboard/links/new">
              <Button>Save a link</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <AnimatePresence>
            {items.map((link, index) => (
              <motion.div
                key={link.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.03 * index }}
              >
                <Link
                  to={`/dashboard/links/${link.id}`}
                  className="glass glow-border flex h-full flex-col overflow-hidden rounded-2xl transition hover:-translate-y-0.5"
                >
                  <div className="relative h-32 w-full overflow-hidden bg-ink-800">
                    {link.image_url ? (
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
