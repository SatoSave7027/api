import { AnimatePresence, motion } from "framer-motion";
import { FormEvent, useState } from "react";

type Tokens = {
  access_token: string;
  refresh_token: string;
};

type User = {
  id: string;
  email: string;
};

type Note = { id: string; title: string; content: string; updated_at: string };
type Contact = { id: string; name: string; phone: string | null; telegram_username: string | null };
type LinkItem = { id: string; title: string; url: string; description: string | null };
type Section = "notes" | "contacts" | "links";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.error?.message ?? payload?.detail ?? "Request failed";
    throw new Error(message);
  }
  return payload as T;
}

export function App() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [tokens, setTokens] = useState<Tokens | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [section, setSection] = useState<Section>("notes");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [notes, setNotes] = useState<Note[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);

  const [noteForm, setNoteForm] = useState({ title: "", content: "" });
  const [contactForm, setContactForm] = useState({ name: "", phone: "", telegram_username: "" });
  const [linkForm, setLinkForm] = useState({ title: "", url: "", description: "" });

  const requestCode = async () => {
    setError(null);
    const response = await fetch(`${API_BASE_URL}/auth/request-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    await parseResponse<{ message: string }>(response);
    setMessage("OTP-код отправлен на email.");
  };

  const verifyCode = async () => {
    setError(null);
    const response = await fetch(`${API_BASE_URL}/auth/verify-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code: otp.toUpperCase() })
    });
    const payload = await parseResponse<{ access_token: string; refresh_token: string; user: User }>(response);
    setTokens({ access_token: payload.access_token, refresh_token: payload.refresh_token });
    setUser(payload.user);
    setMessage("Вход выполнен.");
    await loadSection("notes", payload.access_token);
  };

  const authFetch = async <T,>(
    path: string,
    init: RequestInit = {},
    suppliedAccess?: string,
  ): Promise<T> => {
    if (!tokens && !suppliedAccess) throw new Error("Not authenticated");
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${suppliedAccess ?? tokens?.access_token}`,
        ...(init.headers ?? {})
      }
    });

    if (response.status === 401 && tokens?.refresh_token) {
      const refreshed = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: tokens.refresh_token })
      });
      if (!refreshed.ok) {
        setTokens(null);
        setUser(null);
        throw new Error("Session expired. Login again.");
      }
      const refreshedPayload = await parseResponse<{ access_token: string; refresh_token: string; user: User }>(refreshed);
      setTokens({ access_token: refreshedPayload.access_token, refresh_token: refreshedPayload.refresh_token });
      setUser(refreshedPayload.user);
      return authFetch(path, init, refreshedPayload.access_token);
    }

    return parseResponse<T>(response);
  };

  const loadSection = async (nextSection: Section, suppliedAccess?: string) => {
    setSection(nextSection);
    setError(null);
    if (nextSection === "notes") {
      setNotes(await authFetch<Note[]>("/notes", {}, suppliedAccess));
      return;
    }
    if (nextSection === "contacts") {
      setContacts(await authFetch<Contact[]>("/contacts", {}, suppliedAccess));
      return;
    }
    setLinks(await authFetch<LinkItem[]>("/links", {}, suppliedAccess));
  };

  const logout = async () => {
    if (!tokens) return;
    await authFetch("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refresh_token: tokens.refresh_token })
    });
    setTokens(null);
    setUser(null);
    setNotes([]);
    setContacts([]);
    setLinks([]);
    setMessage("Сессия завершена.");
  };

  const createNote = async (event: FormEvent) => {
    event.preventDefault();
    const created = await authFetch<Note>("/notes", {
      method: "POST",
      body: JSON.stringify(noteForm)
    });
    setNotes((current) => [created, ...current]);
    setNoteForm({ title: "", content: "" });
  };

  const createContact = async (event: FormEvent) => {
    event.preventDefault();
    const created = await authFetch<Contact>("/contacts", {
      method: "POST",
      body: JSON.stringify({
        ...contactForm,
        phone: contactForm.phone || null,
        telegram_username: contactForm.telegram_username || null
      })
    });
    setContacts((current) => [created, ...current]);
    setContactForm({ name: "", phone: "", telegram_username: "" });
  };

  const createLink = async (event: FormEvent) => {
    event.preventDefault();
    const created = await authFetch<LinkItem>("/links", {
      method: "POST",
      body: JSON.stringify({ ...linkForm, description: linkForm.description || null })
    });
    setLinks((current) => [created, ...current]);
    setLinkForm({ title: "", url: "", description: "" });
  };

  const removeItem = async (endpoint: string, id: string) => {
    await authFetch(`${endpoint}/${id}`, { method: "DELETE" });
    if (endpoint === "/notes") setNotes((current) => current.filter((item) => item.id !== id));
    if (endpoint === "/contacts") setContacts((current) => current.filter((item) => item.id !== id));
    if (endpoint === "/links") setLinks((current) => current.filter((item) => item.id !== id));
  };

  const sectionButtons: { id: Section; label: string }[] = [
    { id: "notes", label: "Заметки" },
    { id: "contacts", label: "Контакты" },
    { id: "links", label: "Ссылки" }
  ];

  return (
    <main className="desktop-shell">
      <div className="desktop-panel">
        <h1>SatoSave Vault Desktop</h1>
        <p className="subtitle">Tauri client with real FastAPI integration</p>
        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}

        {!user ? (
          <div className="auth-grid">
            <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" type="email" />
            <button onClick={() => void requestCode()}>Получить OTP</button>
            <input
              value={otp}
              onChange={(event) => setOtp(event.target.value.toUpperCase())}
              placeholder="OTP код"
              maxLength={6}
            />
            <button onClick={() => void verifyCode()}>Войти</button>
          </div>
        ) : (
          <>
            <div className="row between">
              <span>{user.email}</span>
              <button onClick={() => void logout()}>Logout</button>
            </div>

            <div className="row">
              {sectionButtons.map((item) => (
                <button
                  key={item.id}
                  className={item.id === section ? "tab active" : "tab"}
                  onClick={() => void loadSection(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {section === "notes" && (
                <motion.section key="notes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <form className="stack" onSubmit={createNote}>
                    <input
                      required
                      value={noteForm.title}
                      placeholder="Заголовок"
                      onChange={(event) => setNoteForm((current) => ({ ...current, title: event.target.value }))}
                    />
                    <textarea
                      required
                      value={noteForm.content}
                      placeholder="Содержимое"
                      onChange={(event) => setNoteForm((current) => ({ ...current, content: event.target.value }))}
                    />
                    <button type="submit">Создать</button>
                  </form>
                  <ul className="stack">
                    {notes.map((item) => (
                      <li key={item.id} className="card">
                        <strong>{item.title}</strong>
                        <p>{item.content}</p>
                        <button onClick={() => void removeItem("/notes", item.id)}>Удалить</button>
                      </li>
                    ))}
                  </ul>
                </motion.section>
              )}

              {section === "contacts" && (
                <motion.section key="contacts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <form className="stack" onSubmit={createContact}>
                    <input
                      required
                      value={contactForm.name}
                      placeholder="Имя"
                      onChange={(event) => setContactForm((current) => ({ ...current, name: event.target.value }))}
                    />
                    <input
                      value={contactForm.phone}
                      placeholder="Телефон"
                      onChange={(event) => setContactForm((current) => ({ ...current, phone: event.target.value }))}
                    />
                    <input
                      value={contactForm.telegram_username}
                      placeholder="Telegram username"
                      onChange={(event) =>
                        setContactForm((current) => ({ ...current, telegram_username: event.target.value }))
                      }
                    />
                    <button type="submit">Создать</button>
                  </form>
                  <ul className="stack">
                    {contacts.map((item) => (
                      <li key={item.id} className="card">
                        <strong>{item.name}</strong>
                        <p>{item.phone || item.telegram_username || "-"}</p>
                        <button onClick={() => void removeItem("/contacts", item.id)}>Удалить</button>
                      </li>
                    ))}
                  </ul>
                </motion.section>
              )}

              {section === "links" && (
                <motion.section key="links" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <form className="stack" onSubmit={createLink}>
                    <input
                      required
                      value={linkForm.title}
                      placeholder="Название"
                      onChange={(event) => setLinkForm((current) => ({ ...current, title: event.target.value }))}
                    />
                    <input
                      required
                      type="url"
                      value={linkForm.url}
                      placeholder="https://example.com"
                      onChange={(event) => setLinkForm((current) => ({ ...current, url: event.target.value }))}
                    />
                    <textarea
                      value={linkForm.description}
                      placeholder="Описание"
                      onChange={(event) => setLinkForm((current) => ({ ...current, description: event.target.value }))}
                    />
                    <button type="submit">Создать</button>
                  </form>
                  <ul className="stack">
                    {links.map((item) => (
                      <li key={item.id} className="card">
                        <strong>{item.title}</strong>
                        <a href={item.url} target="_blank" rel="noreferrer">
                          {item.url}
                        </a>
                        <button onClick={() => void removeItem("/links", item.id)}>Удалить</button>
                      </li>
                    ))}
                  </ul>
                </motion.section>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </main>
  );
}
