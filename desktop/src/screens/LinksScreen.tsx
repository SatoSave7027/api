import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@/lib/types";
import { linksApi, uploadsApi } from "@/lib/api";
import { formatDate, truncate } from "@/lib/utils";

type ModalType = "create" | "edit" | "view" | null;

export default function LinksScreen() {
  const [links, setLinks] = useState<Link[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modal, setModal] = useState<ModalType>(null);
  const [selected, setSelected] = useState<Link | null>(null);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [imageId, setImageId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

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

  const resetForm = () => {
    setTitle("");
    setUrl("");
    setDescription("");
    setImageId("");
    setImageUrl("");
    setError("");
  };

  const openCreate = () => {
    setSelected(null);
    resetForm();
    setModal("create");
  };

  const openEdit = (l: Link) => {
    setSelected(l);
    setTitle(l.title);
    setUrl(l.url);
    setDescription(l.description || "");
    setImageId(l.image_id || "");
    setImageUrl(l.image?.url || "");
    setError("");
    setModal("edit");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await uploadsApi.upload(file);
      setImageId(res.data.id);
      setImageUrl(res.data.url);
    } catch {
      setError("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      const payload = {
        title,
        url,
        description: description || undefined,
        image_id: imageId || undefined,
      };
      if (modal === "edit" && selected) {
        await linksApi.update(selected.id, payload);
      } else {
        await linksApi.create(payload);
      }
      setModal(null);
      await fetchLinks();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Something went wrong";
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await linksApi.delete(id);
      setLinks((prev) => prev.filter((l) => l.id !== id));
      if (selected?.id === id) setModal(null);
    } catch {}
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Links</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {links.length} saved {links.length === 1 ? "link" : "links"}
          </p>
        </div>
        <motion.button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#39ff14] text-black font-semibold px-4 py-2 rounded-lg hover:bg-[#2de010] transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          + New Link
        </motion.button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#0d1a0d] border border-[#1a2e1a] rounded-xl overflow-hidden animate-pulse">
              <div className="aspect-video bg-[#1a2e1a]" />
              <div className="p-3">
                <div className="h-3 bg-[#1a2e1a] rounded mb-2 w-3/4" />
                <div className="h-2 bg-[#1a2e1a] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : links.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <motion.div
            className="text-6xl mb-4 text-[#39ff14]/20"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            🔗
          </motion.div>
          <h3 className="text-xl font-semibold text-white mb-2">No links saved</h3>
          <p className="text-gray-500 mb-6 text-sm">Build your encrypted link library</p>
          <motion.button
            onClick={openCreate}
            className="bg-[#39ff14] text-black font-semibold px-6 py-2.5 rounded-lg hover:bg-[#2de010] transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            + Save Link
          </motion.button>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {links.map((l, i) => (
            <motion.div
              key={l.id}
              className="group bg-[#0d1a0d] border border-[#1a2e1a] rounded-xl overflow-hidden cursor-pointer
                         hover:border-[#39ff14]/40 hover:shadow-[0_0_15px_rgba(57,255,20,0.08)]
                         transition-all flex flex-col"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -2 }}
              onClick={() => { setSelected(l); setModal("view"); }}
            >
              <div className="aspect-video bg-[#111] flex items-center justify-center overflow-hidden">
                {l.image ? (
                  <img
                    src={l.image.url}
                    alt={l.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <span className="text-3xl text-[#39ff14]/20 group-hover:text-[#39ff14]/40 transition-colors">
                    🔗
                  </span>
                )}
              </div>
              <div className="p-3 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-white text-sm font-semibold group-hover:text-[#39ff14] transition-colors line-clamp-2">
                    {l.title}
                  </h3>
                  <div
                    className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => openEdit(l)}
                      className="text-xs p-1 text-gray-500 hover:text-[#39ff14] hover:bg-[#39ff14]/10 rounded"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(l.id)}
                      className="text-xs p-1 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <p className="text-[#39ff14]/40 text-xs mt-1 truncate">{l.url}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {(modal === "create" || modal === "edit") && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setModal(null)}
            />
            <motion.div
              className="relative z-10 w-full max-w-sm bg-[#0d1a0d] border border-[#1a2e1a] rounded-2xl shadow-2xl"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
            >
              <div className="flex items-center justify-between p-5 border-b border-[#1a2e1a]">
                <h2 className="text-lg font-bold text-white">
                  {modal === "edit" ? "Edit Link" : "New Link"}
                </h2>
                <button onClick={() => setModal(null)} className="text-gray-500 hover:text-white">✕</button>
              </div>
              <form onSubmit={handleSave} className="p-5 space-y-3">
                <label className="block cursor-pointer">
                  <div
                    className="h-24 border-2 border-dashed border-[#1a2e1a] rounded-xl overflow-hidden
                                hover:border-[#39ff14]/40 transition-colors relative flex items-center justify-center"
                  >
                    {imageUrl ? (
                      <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-600 text-sm">Click to upload image</span>
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-[#39ff14] border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>

                {[
                  { label: "Title *", value: title, setter: setTitle, placeholder: "Link title", required: true, type: "text" },
                  { label: "URL *", value: url, setter: setUrl, placeholder: "https://example.com", required: true, type: "url" },
                ].map(({ label, value, setter, placeholder, required, type }) => (
                  <div key={label}>
                    <label className="block text-xs text-gray-400 mb-1">{label}</label>
                    <input
                      type={type}
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      placeholder={placeholder}
                      required={required}
                      className="w-full bg-[#111] border border-[#1a2e1a] rounded-lg px-3 py-2 text-white text-sm
                                 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#39ff14]
                                 focus:border-transparent transition-all"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description..."
                    rows={2}
                    className="w-full bg-[#111] border border-[#1a2e1a] rounded-lg px-3 py-2 text-white text-sm
                               placeholder-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-[#39ff14]
                               focus:border-transparent transition-all"
                  />
                </div>
                {error && <p className="text-red-400 text-xs">{error}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setModal(null)}
                    className="flex-1 py-2 rounded-lg border border-[#1a2e1a] text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-2 rounded-lg bg-[#39ff14] text-black font-semibold text-sm hover:bg-[#2de010] transition-colors disabled:opacity-50"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    {isSaving ? "Saving..." : modal === "edit" ? "Save" : "Create"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {modal === "view" && selected && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setModal(null)}
            />
            <motion.div
              className="relative z-10 w-full max-w-sm bg-[#0d1a0d] border border-[#1a2e1a] rounded-2xl shadow-2xl"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
            >
              <button
                onClick={() => setModal(null)}
                className="absolute top-4 right-4 text-gray-500 hover:text-white z-10"
              >
                ✕
              </button>
              {selected.image && (
                <div className="rounded-t-2xl overflow-hidden aspect-video">
                  <img src={selected.image.url} alt={selected.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-5 space-y-3">
                <h3 className="text-lg font-bold text-white">{selected.title}</h3>
                <a
                  href={selected.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[#39ff14] text-sm hover:text-[#2de010] break-all"
                >
                  <span className="truncate">{selected.url}</span>
                  <span className="flex-shrink-0">↗</span>
                </a>
                {selected.description && (
                  <p className="text-gray-400 text-sm">{selected.description}</p>
                )}
                <p className="text-xs text-gray-600">{formatDate(selected.created_at)}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(selected)}
                    className="flex-1 py-2 rounded-lg border border-[#39ff14]/40 text-[#39ff14] text-sm hover:bg-[#39ff14]/10 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => { handleDelete(selected.id); setModal(null); }}
                    className="flex-1 py-2 rounded-lg border border-red-500/40 text-red-400 text-sm hover:bg-red-500/10 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
