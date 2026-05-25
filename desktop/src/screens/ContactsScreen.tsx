import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Contact } from "@/lib/types";
import { contactsApi, uploadsApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";

type ModalType = "create" | "edit" | "view" | null;

export default function ContactsScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modal, setModal] = useState<ModalType>(null);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [telegram, setTelegram] = useState("");
  const [description, setDescription] = useState("");
  const [avatarId, setAvatarId] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const fetchContacts = useCallback(async () => {
    try {
      const res = await contactsApi.list();
      setContacts(res.data);
    } catch {
      setContacts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const resetForm = () => {
    setName("");
    setPhone("");
    setTelegram("");
    setDescription("");
    setAvatarId("");
    setAvatarUrl("");
    setError("");
  };

  const openCreate = () => {
    setSelected(null);
    resetForm();
    setModal("create");
  };

  const openEdit = (c: Contact) => {
    setSelected(c);
    setName(c.name);
    setPhone(c.phone || "");
    setTelegram(c.telegram_username || "");
    setDescription(c.description || "");
    setAvatarId(c.avatar_id || "");
    setAvatarUrl(c.avatar?.url || "");
    setError("");
    setModal("edit");
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await uploadsApi.upload(file);
      setAvatarId(res.data.id);
      setAvatarUrl(res.data.url);
    } catch {
      setError("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone && !telegram) {
      setError("Phone or Telegram is required");
      return;
    }
    setError("");
    setIsSaving(true);
    try {
      const payload = {
        name,
        phone: phone || undefined,
        telegram_username: telegram || undefined,
        description: description || undefined,
        avatar_id: avatarId || undefined,
      };
      if (modal === "edit" && selected) {
        await contactsApi.update(selected.id, payload);
      } else {
        await contactsApi.create(payload);
      }
      setModal(null);
      await fetchContacts();
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
      await contactsApi.delete(id);
      setContacts((prev) => prev.filter((c) => c.id !== id));
      if (selected?.id === id) setModal(null);
    } catch {}
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Contacts</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {contacts.length} {contacts.length === 1 ? "contact" : "contacts"}
          </p>
        </div>
        <motion.button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#39ff14] text-black font-semibold px-4 py-2 rounded-lg hover:bg-[#2de010] transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          + New Contact
        </motion.button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-[#0d1a0d] border border-[#1a2e1a] rounded-xl p-4 flex flex-col items-center animate-pulse"
            >
              <div className="w-12 h-12 rounded-full bg-[#1a2e1a] mb-3" />
              <div className="h-3 bg-[#1a2e1a] rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <motion.div
            className="text-6xl mb-4 text-[#39ff14]/20"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            👤
          </motion.div>
          <h3 className="text-xl font-semibold text-white mb-2">No contacts yet</h3>
          <p className="text-gray-500 mb-6 text-sm">Add your important contacts</p>
          <motion.button
            onClick={openCreate}
            className="bg-[#39ff14] text-black font-semibold px-6 py-2.5 rounded-lg hover:bg-[#2de010] transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            + Add Contact
          </motion.button>
        </div>
      ) : (
        <div className="grid grid-cols-3 lg:grid-cols-5 gap-4">
          {contacts.map((c, i) => (
            <motion.div
              key={c.id}
              className="group bg-[#0d1a0d] border border-[#1a2e1a] rounded-xl p-4 cursor-pointer
                         hover:border-[#39ff14]/40 hover:shadow-[0_0_15px_rgba(57,255,20,0.08)]
                         transition-all flex flex-col items-center text-center"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -2 }}
              onClick={() => {
                setSelected(c);
                setModal("view");
              }}
            >
              {c.avatar ? (
                <img
                  src={c.avatar.url}
                  alt={c.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-[#39ff14]/20 mb-3"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#39ff14]/10 border-2 border-[#1a2e1a] flex items-center justify-center mb-3">
                  <span className="text-lg">👤</span>
                </div>
              )}
              <p className="text-white text-xs font-semibold group-hover:text-[#39ff14] transition-colors line-clamp-1 w-full">
                {c.name}
              </p>
              {c.phone && (
                <p className="text-gray-500 text-xs truncate w-full mt-0.5">{c.phone}</p>
              )}
              <div
                className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => openEdit(c)}
                  className="text-xs p-1 text-gray-500 hover:text-[#39ff14] hover:bg-[#39ff14]/10 rounded transition-colors"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="text-xs p-1 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                >
                  🗑️
                </button>
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
                  {modal === "edit" ? "Edit Contact" : "New Contact"}
                </h2>
                <button
                  onClick={() => setModal(null)}
                  className="text-gray-500 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleSave} className="p-5 space-y-3">
                <div className="flex justify-center">
                  <label className="cursor-pointer group">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#1a2e1a] group-hover:border-[#39ff14]/50 transition-colors relative">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[#39ff14]/10 flex items-center justify-center text-2xl">
                          👤
                        </div>
                      )}
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-[#39ff14] border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    <p className="text-xs text-gray-500 text-center mt-1">Photo</p>
                  </label>
                </div>

                {[
                  { label: "Name *", value: name, setter: setName, placeholder: "Full name", required: true },
                  { label: "Phone", value: phone, setter: setPhone, placeholder: "+1 234 567 8900", required: false },
                  { label: "Telegram", value: telegram, setter: setTelegram, placeholder: "username", required: false },
                ].map(({ label, value, setter, placeholder, required }) => (
                  <div key={label}>
                    <label className="block text-xs text-gray-400 mb-1">{label}</label>
                    <input
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
                    placeholder="Optional note..."
                    rows={2}
                    className="w-full bg-[#111] border border-[#1a2e1a] rounded-lg px-3 py-2 text-white text-sm
                               placeholder-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-[#39ff14]
                               focus:border-transparent transition-all"
                  />
                </div>
                {error && <p className="text-red-400 text-xs">{error}</p>}
                <div className="flex gap-2 pt-1">
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
              className="relative z-10 w-full max-w-sm bg-[#0d1a0d] border border-[#1a2e1a] rounded-2xl shadow-2xl p-5"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
            >
              <button
                onClick={() => setModal(null)}
                className="absolute top-4 right-4 text-gray-500 hover:text-white"
              >
                ✕
              </button>
              <div className="flex items-center gap-4 mb-4">
                {selected.avatar ? (
                  <img
                    src={selected.avatar.url}
                    alt={selected.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-[#39ff14]/30"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-[#39ff14]/10 border-2 border-[#1a2e1a] flex items-center justify-center text-2xl">
                    👤
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-white">{selected.name}</h3>
                  <p className="text-xs text-gray-600">{formatDate(selected.created_at)}</p>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                {selected.phone && (
                  <div className="flex items-center gap-2 p-2.5 bg-[#111] rounded-xl border border-[#1a2e1a]">
                    <span>📞</span>
                    <span className="text-gray-300 text-sm">{selected.phone}</span>
                  </div>
                )}
                {selected.telegram_username && (
                  <div className="flex items-center gap-2 p-2.5 bg-[#111] rounded-xl border border-[#1a2e1a]">
                    <span>💬</span>
                    <span className="text-gray-300 text-sm">@{selected.telegram_username}</span>
                  </div>
                )}
                {selected.description && (
                  <div className="p-2.5 bg-[#111] rounded-xl border border-[#1a2e1a]">
                    <p className="text-gray-400 text-sm">{selected.description}</p>
                  </div>
                )}
              </div>
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
