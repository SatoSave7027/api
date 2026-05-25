"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link as LinkType } from "@/lib/types";
import { linksApi } from "@/lib/api";
import LinkCard from "@/components/links/LinkCard";
import LinkForm from "@/components/links/LinkForm";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import {
  PlusIcon,
  LinkIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { formatDate } from "@/lib/utils";

export default function LinksPage() {
  const [links, setLinks] = useState<LinkType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkType | null>(null);
  const [viewingLink, setViewingLink] = useState<LinkType | null>(null);

  const fetchLinks = useCallback(async () => {
    try {
      const res = await linksApi.list();
      setLinks(res.data);
    } catch {
      setLinks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const handleDelete = async (id: string) => {
    try {
      await linksApi.delete(id);
      setLinks((prev) => prev.filter((l) => l.id !== id));
    } catch {}
  };

  const handleFormSuccess = async () => {
    setShowForm(false);
    setEditingLink(null);
    await fetchLinks();
  };

  const openEdit = (link: LinkType) => {
    setEditingLink(link);
    setShowForm(true);
    setViewingLink(null);
  };

  return (
    <div className="p-6 lg:p-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Links</h1>
          <p className="text-gray-500 mt-1">
            {links.length} saved {links.length === 1 ? "link" : "links"}
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingLink(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          New Link
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-[#0d1a0d] border border-[#1a2e1a] rounded-xl overflow-hidden animate-pulse"
            >
              <div className="aspect-video bg-[#1a2e1a]" />
              <div className="p-4">
                <div className="h-4 bg-[#1a2e1a] rounded mb-2 w-3/4" />
                <div className="h-3 bg-[#1a2e1a] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : links.length === 0 ? (
        <EmptyState
          icon={<LinkIcon className="w-20 h-20" />}
          title="No links saved"
          description="Build your encrypted library of important links"
          action={
            <Button onClick={() => setShowForm(true)} size="lg">
              <PlusIcon className="w-5 h-5 mr-2" />
              Save Link
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {links.map((link, i) => (
              <LinkCard
                key={link.id}
                link={link}
                index={i}
                onEdit={openEdit}
                onDelete={handleDelete}
                onClick={setViewingLink}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingLink(null);
        }}
        title={editingLink ? "Edit Link" : "New Link"}
      >
        <LinkForm
          link={editingLink}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingLink(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={!!viewingLink}
        onClose={() => setViewingLink(null)}
        title={viewingLink?.title || ""}
      >
        {viewingLink && (
          <div className="space-y-4">
            {viewingLink.image && (
              <div className="rounded-xl overflow-hidden aspect-video">
                <img
                  src={viewingLink.image.url}
                  alt={viewingLink.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold text-white mb-2">
                {viewingLink.title}
              </h3>
              <a
                href={viewingLink.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#39ff14] hover:text-[#2de010] text-sm transition-colors break-all"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="truncate">{viewingLink.url}</span>
                <ArrowTopRightOnSquareIcon className="w-4 h-4 flex-shrink-0" />
              </a>
            </div>
            {viewingLink.description && (
              <div className="p-3 bg-[#111] rounded-xl border border-[#1a2e1a]">
                <p className="text-gray-400 text-sm leading-relaxed">
                  {viewingLink.description}
                </p>
              </div>
            )}
            <p className="text-xs text-gray-600">
              Saved {formatDate(viewingLink.created_at)}
            </p>
            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => openEdit(viewingLink)}
              >
                Edit
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => {
                  handleDelete(viewingLink.id);
                  setViewingLink(null);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
