"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Link as LinkIcon, LogOut, Plus, RefreshCw, Trash2, Upload, Users } from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { absoluteMediaUrl, api, type Contact, type LinkItem, type Note, type User } from "@/lib/api";

type Section = "notes" | "contacts" | "links";
type VaultItem = Note | Contact | LinkItem;

const sections = [
  { id: "notes" as const, label: "Заметки", icon: BookOpen },
  { id: "contacts" as const, label: "Важные контакты", icon: Users },
  { id: "links" as const, label: "Библиотека ссылок", icon: LinkIcon }
];

export function Dashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [section, setSection] = useState<Section>("notes");
  const [items, setItems] = useState<VaultItem[]>([]);
  const [selected, setSelected] = useState<VaultItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);
  const title = useMemo(() => sections.find((item) => item.id === section)?.label || "Vault", [section]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = section === "notes" ? await api.notes.list() : section === "contacts" ? await api.contacts.list() : await api.links.list();
      setItems(data);
      setSelected(null);
      setForm({});
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить данные");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [section]);

  function edit(item: VaultItem) {
    setSelected(item);
    if (section === "notes") {
      const note = item as Note;
      setForm({ title: note.title, content: note.content });
    } else if (section === "contacts") {
      const contact = item as Contact;
      setForm({
        name: contact.name,
        phone: contact.phone || "",
        telegram_username: contact.telegram_username || "",
        description: contact.description || "",
        avatar_file_id: contact.avatar_file_id || ""
      });
    } else {
      const link = item as LinkItem;
      setForm({ title: link.title, url: link.url, description: link.description || "", image_file_id: link.image_file_id || "" });
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const uploaded = file ? await api.upload(file) : null;
      if (section === "notes") {
        const payload = { title: form.title, content: form.content };
        selected ? await api.notes.update(selected.id, payload) : await api.notes.create(payload);
      } else if (section === "contacts") {
        const payload = {
          name: form.name,
          phone: form.phone || null,
          telegram_username: form.telegram_username || null,
          description: form.description || null,
          avatar_file_id: uploaded?.id || form.avatar_file_id || null
        };
        selected ? await api.contacts.update(selected.id, payload) : await api.contacts.create(payload);
      } else {
        const payload = {
          title: form.title,
          url: form.url,
          description: form.description || null,
          image_file_id: uploaded?.id || form.image_file_id || null
        };
        selected ? await api.links.update(selected.id, payload) : await api.links.create(payload);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }

  async function remove(item: VaultItem) {
    setSaving(true);
    try {
      if (section === "notes") await api.notes.remove(item.id);
      if (section === "contacts") await api.contacts.remove(item.id);
      if (section === "links") await api.links.remove(item.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось удалить");
    } finally {
      setSaving(false);
    }
  }

  async function removeImage(item: VaultItem) {
    const fileId = section === "contacts" ? (item as Contact).avatar_file_id : (item as LinkItem).image_file_id;
    if (!fileId) return;
    await api.deleteUpload(fileId);
    await load();
  }

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-7xl space-y-6">
      <header className="glass flex flex-col gap-4 rounded-[2rem] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-vault-teal">SatoSave Vault</p>
          <h1 className="text-3xl font-black text-white">{title}</h1>
          <p className="text-sm text-emerald-50/60">Активная сессия: {user.email}</p>
        </div>
        <button onClick={async () => { await api.logout(); onLogout(); }} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5">
          <LogOut size={16} /> Выйти
        </button>
      </header>
      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <nav className="glass h-fit rounded-[2rem] p-3">
          {sections.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => setSection(item.id)} className={`mb-2 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${section === item.id ? "bg-vault-green text-black" : "text-emerald-50/75 hover:bg-white/5"}`}>
                <Icon size={18} /> {item.label}
              </button>
            );
          })}
        </nav>
        <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
          <div className="glass rounded-[2rem] p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-xl font-black">Записи</h2>
              <button onClick={load} className="rounded-xl border border-white/10 p-2 hover:bg-white/5" aria-label="refresh"><RefreshCw size={18} /></button>
            </div>
            {loading ? <LoadingCards /> : null}
            {error ? <p className="mb-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}
            {!loading && items.length === 0 ? <div className="rounded-3xl border border-dashed border-vault-teal/30 p-10 text-center text-emerald-50/60"><Plus className="mx-auto mb-3 text-vault-teal" /> Здесь пока пусто. Создайте первую запись справа.</div> : null}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence>{items.map((item) => <VaultCard key={item.id} item={item} section={section} onEdit={edit} onDelete={remove} onDeleteImage={removeImage} />)}</AnimatePresence>
            </div>
          </div>
          <form onSubmit={submit} className="glass h-fit space-y-4 rounded-[2rem] p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black">{selected ? "Редактировать" : "Создать"}</h2>
              {selected ? <button type="button" onClick={() => { setSelected(null); setForm({}); setFile(null); }} className="text-sm text-vault-teal">Новая запись</button> : null}
            </div>
            <Fields section={section} form={form} setForm={setForm} setFile={setFile} />
            <motion.button whileTap={{ scale: 0.98 }} disabled={saving} className="w-full rounded-2xl bg-vault-green px-5 py-3 font-black text-black disabled:opacity-60">
              {saving ? "Сохранение..." : "Сохранить"}
            </motion.button>
          </form>
        </div>
      </div>
    </motion.section>
  );
}

function Fields({ section, form, setForm, setFile }: { section: Section; form: Record<string, string>; setForm: (value: Record<string, string>) => void; setFile: (file: File | null) => void }) {
  const update = (key: string, value: string) => setForm({ ...form, [key]: value });
  const fileInput = (event: ChangeEvent<HTMLInputElement>) => setFile(event.target.files?.[0] || null);
  if (section === "notes") {
    return <><input className="input" required placeholder="Заголовок" value={form.title || ""} onChange={(event) => update("title", event.target.value)} /><textarea className="input min-h-44" required placeholder="Содержимое" value={form.content || ""} onChange={(event) => update("content", event.target.value)} /></>;
  }
  if (section === "contacts") {
    return <><input className="input" required placeholder="Имя" value={form.name || ""} onChange={(event) => update("name", event.target.value)} /><input className="input" placeholder="Телефон" value={form.phone || ""} onChange={(event) => update("phone", event.target.value)} /><input className="input" placeholder="Telegram username" value={form.telegram_username || ""} onChange={(event) => update("telegram_username", event.target.value)} /><textarea className="input min-h-28" placeholder="Описание" value={form.description || ""} onChange={(event) => update("description", event.target.value)} /><label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-vault-teal/30 p-3 text-sm text-vault-teal"><Upload size={16} /> Загрузить аватар <input hidden type="file" accept="image/*" onChange={fileInput} /></label></>;
  }
  return <><input className="input" required placeholder="Название" value={form.title || ""} onChange={(event) => update("title", event.target.value)} /><input className="input" required placeholder="https://example.com" value={form.url || ""} onChange={(event) => update("url", event.target.value)} /><textarea className="input min-h-28" placeholder="Описание" value={form.description || ""} onChange={(event) => update("description", event.target.value)} /><label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-vault-teal/30 p-3 text-sm text-vault-teal"><Upload size={16} /> Загрузить изображение <input hidden type="file" accept="image/*" onChange={fileInput} /></label></>;
}

function VaultCard({ item, section, onEdit, onDelete, onDeleteImage }: { item: VaultItem; section: Section; onEdit: (item: VaultItem) => void; onDelete: (item: VaultItem) => void; onDeleteImage: (item: VaultItem) => void }) {
  const title = section === "contacts" ? (item as Contact).name : (item as Note | LinkItem).title;
  const subtitle = section === "notes" ? (item as Note).content : section === "contacts" ? ((item as Contact).phone || (item as Contact).telegram_username) : (item as LinkItem).url;
  const image = section === "contacts" ? absoluteMediaUrl((item as Contact).avatar_url) : section === "links" ? absoluteMediaUrl((item as LinkItem).image_url) : null;
  const hasImage = Boolean(image);
  return <motion.article layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} whileHover={{ y: -4 }} className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">{section !== "notes" ? <div className="mb-3 flex h-24 items-center justify-center overflow-hidden rounded-2xl bg-vault-teal/10">{image ? <img src={image} alt={title} className="h-full w-full object-cover" /> : <span className="text-3xl font-black text-vault-teal">{title.slice(0, 1).toUpperCase()}</span>}</div> : null}<h3 className="line-clamp-2 font-black text-white">{title}</h3><p className="mt-2 line-clamp-3 text-sm text-emerald-50/58">{subtitle}</p><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => onEdit(item)} className="rounded-xl bg-vault-teal px-3 py-2 text-xs font-bold text-black">Открыть</button>{hasImage ? <button onClick={() => onDeleteImage(item)} className="rounded-xl border border-white/10 px-3 py-2 text-xs">Удалить image</button> : null}<button onClick={() => onDelete(item)} className="rounded-xl border border-red-400/30 px-3 py-2 text-xs text-red-200"><Trash2 size={14} /></button></div></motion.article>;
}

function LoadingCards() {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-40 animate-pulse rounded-3xl bg-white/[0.06]" />)}</div>;
}
