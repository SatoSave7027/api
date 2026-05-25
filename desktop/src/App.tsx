import { motion } from "framer-motion";
import { BookOpen, Link as LinkIcon, Loader2, LogOut, Send, Users } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { api, mediaUrl, type Contact, type LinkItem, type Note, type Section, type User } from "./api";

type Item = Note | Contact | LinkItem;
const sections = [
  { id: "notes" as const, label: "Заметки", icon: BookOpen },
  { id: "contacts" as const, label: "Контакты", icon: Users },
  { id: "links" as const, label: "Ссылки", icon: LinkIcon }
];

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [section, setSection] = useState<Section>("notes");
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<Item | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (api.hasSession()) api.me().then(setUser).catch(api.clear);
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, section]);

  async function load() {
    setBusy(true);
    setError("");
    try {
      setItems(await api.list(section));
      setSelected(null);
      setForm({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setBusy(false);
    }
  }

  async function auth(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (!codeSent) {
        await api.requestCode(email);
        setCodeSent(true);
      } else {
        setUser(await api.verifyCode(email, code));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setBusy(false);
    }
  }

  function open(item: Item) {
    setSelected(item);
    if (section === "notes") setForm({ title: (item as Note).title, content: (item as Note).content });
    if (section === "contacts") {
      const contact = item as Contact;
      setForm({ name: contact.name, phone: contact.phone || "", telegram_username: contact.telegram_username || "", description: contact.description || "", avatar_file_id: contact.avatar_file_id || "" });
    }
    if (section === "links") {
      const link = item as LinkItem;
      setForm({ title: link.title, url: link.url, description: link.description || "", image_file_id: link.image_file_id || "" });
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const uploaded = file ? await api.upload(file) : null;
      const payload = section === "notes"
        ? { title: form.title, content: form.content }
        : section === "contacts"
          ? { name: form.name, phone: form.phone || null, telegram_username: form.telegram_username || null, description: form.description || null, avatar_file_id: uploaded?.id || form.avatar_file_id || null }
          : { title: form.title, url: form.url, description: form.description || null, image_file_id: uploaded?.id || form.image_file_id || null };
      selected ? await api.update(section, selected.id, payload) : await api.create(section, payload);
      setFile(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  if (!user) {
    return (
      <main className="shell auth-shell">
        <motion.form initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} onSubmit={auth} className="panel auth-card">
          <h1>SatoSave Vault</h1>
          <p>Desktop OTP login connected to the FastAPI backend.</p>
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="email" required disabled={codeSent} />
          {codeSent ? <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="A1B2C3" maxLength={6} required /> : null}
          <button disabled={busy}>{busy ? <Loader2 className="spin" /> : <Send size={18} />} {codeSent ? "Verify" : "Send OTP"}</button>
          {error ? <span className="error">{error}</span> : null}
        </motion.form>
      </main>
    );
  }

  return (
    <main className="shell">
      <aside className="panel sidebar">
        <strong>SatoSave Vault</strong>
        <small>{user.email}</small>
        {sections.map((item) => {
          const Icon = item.icon;
          return <button key={item.id} className={section === item.id ? "active" : ""} onClick={() => setSection(item.id)}><Icon size={18} /> {item.label}</button>;
        })}
        <button onClick={async () => { await api.logout(); setUser(null); }}><LogOut size={18} /> Logout</button>
      </aside>
      <section className="panel content">
        <h2>{sections.find((item) => item.id === section)?.label}</h2>
        {error ? <div className="error">{error}</div> : null}
        {busy ? <div className="loading">Loading...</div> : null}
        <div className="cards">
          {items.map((item) => <Card key={item.id} item={item} section={section} onOpen={open} onRemove={async () => { await api.remove(section, item.id); await load(); }} />)}
        </div>
      </section>
      <form className="panel editor" onSubmit={save}>
        <h2>{selected ? "Edit" : "Create"}</h2>
        <Editor section={section} form={form} setForm={setForm} setFile={setFile} />
        <button disabled={busy}>Save</button>
        {selected ? <button type="button" onClick={() => { setSelected(null); setForm({}); }}>New</button> : null}
      </form>
    </main>
  );
}

function Editor({ section, form, setForm, setFile }: { section: Section; form: Record<string, string>; setForm: (form: Record<string, string>) => void; setFile: (file: File | null) => void }) {
  const update = (key: string, value: string) => setForm({ ...form, [key]: value });
  return (
    <>
      <input placeholder={section === "contacts" ? "Name" : "Title"} value={form[section === "contacts" ? "name" : "title"] || ""} onChange={(event) => update(section === "contacts" ? "name" : "title", event.target.value)} required />
      {section === "notes" ? <textarea placeholder="Content" value={form.content || ""} onChange={(event) => update("content", event.target.value)} required /> : null}
      {section === "contacts" ? <><input placeholder="Phone" value={form.phone || ""} onChange={(event) => update("phone", event.target.value)} /><input placeholder="Telegram" value={form.telegram_username || ""} onChange={(event) => update("telegram_username", event.target.value)} /><textarea placeholder="Description" value={form.description || ""} onChange={(event) => update("description", event.target.value)} /><input type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] || null)} /></> : null}
      {section === "links" ? <><input placeholder="URL" value={form.url || ""} onChange={(event) => update("url", event.target.value)} required /><textarea placeholder="Description" value={form.description || ""} onChange={(event) => update("description", event.target.value)} /><input type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] || null)} /></> : null}
    </>
  );
}

function Card({ item, section, onOpen, onRemove }: { item: Item; section: Section; onOpen: (item: Item) => void; onRemove: () => void }) {
  const title = section === "contacts" ? (item as Contact).name : (item as Note | LinkItem).title;
  const media = section === "contacts" ? mediaUrl((item as Contact).avatar_url) : section === "links" ? mediaUrl((item as LinkItem).image_url) : null;
  return <motion.article whileHover={{ y: -3 }} className="card">{section !== "notes" ? <div className="avatar">{media ? <img src={media} alt={title} /> : title[0]}</div> : null}<strong>{title}</strong><button onClick={() => onOpen(item)}>Open</button><button onClick={onRemove}>Delete</button></motion.article>;
}
