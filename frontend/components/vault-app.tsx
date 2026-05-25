"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { ApiClient, ApiError } from "@/lib/api";
import { Contact, LinkItem, Note, Tokens } from "@/lib/types";

type Section = "notes" | "contacts" | "links";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

function formatDate(value: string): string {
  return new Date(value).toLocaleString("ru-RU");
}

function getAssetUrl(path: string | null, apiBaseUrl: string): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  try {
    return `${new URL(apiBaseUrl).origin}${path}`;
  } catch {
    return path;
  }
}

export function VaultApp() {
  const [tokens, setTokens] = useState<Tokens | null>(null);
  const tokensRef = useRef<Tokens | null>(tokens);
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [authStep, setAuthStep] = useState<"request" | "verify">("request");
  const [authLoading, setAuthLoading] = useState(false);
  const [loadingSection, setLoadingSection] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [infoText, setInfoText] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<Section>("notes");

  const [notes, setNotes] = useState<Note[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);

  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedLink, setSelectedLink] = useState<LinkItem | null>(null);

  const [newNote, setNewNote] = useState({ title: "", content: "" });
  const [newContact, setNewContact] = useState({
    name: "",
    phone: "",
    telegram_username: "",
    description: "",
    avatar_file_id: null as string | null
  });
  const [newLink, setNewLink] = useState({
    title: "",
    url: "",
    description: "",
    image_file_id: null as string | null
  });

  useEffect(() => {
    tokensRef.current = tokens;
  }, [tokens]);

  const api = useMemo(
    () =>
      new ApiClient({
        baseUrl: API_BASE_URL,
        getTokens: () => tokensRef.current,
        setTokens: (nextTokens) => {
          tokensRef.current = nextTokens;
          setTokens(nextTokens);
        }
      }),
    [],
  );

  const user = tokens?.user ?? null;

  const showError = (error: unknown) => {
    if (error instanceof ApiError) {
      setErrorText(error.message);
      return;
    }
    if (error instanceof Error) {
      setErrorText(error.message);
      return;
    }
    setErrorText("Unexpected error");
  };

  const clearMessages = () => {
    setErrorText(null);
    setInfoText(null);
  };

  const loadCurrentSection = async (section: Section) => {
    setLoadingSection(true);
    clearMessages();
    try {
      if (section === "notes") {
        setNotes(await api.listNotes());
      } else if (section === "contacts") {
        setContacts(await api.listContacts());
      } else {
        setLinks(await api.listLinks());
      }
    } catch (error) {
      showError(error);
    } finally {
      setLoadingSection(false);
    }
  };

  useEffect(() => {
    if (!tokens) {
      setNotes([]);
      setContacts([]);
      setLinks([]);
      setSelectedNote(null);
      setSelectedContact(null);
      setSelectedLink(null);
      return;
    }
    loadCurrentSection(activeSection);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens, activeSection]);

  const handleRequestCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearMessages();
    setAuthLoading(true);
    try {
      await api.requestCode(email);
      setAuthStep("verify");
      setInfoText("Код отправлен на email. Проверьте входящие.");
    } catch (error) {
      showError(error);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearMessages();
    setAuthLoading(true);
    try {
      await api.verifyCode(email, otpCode.toUpperCase());
      setInfoText("Успешный вход.");
      setOtpCode("");
    } catch (error) {
      showError(error);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    clearMessages();
    try {
      await api.logout();
      setTokens(null);
      setAuthStep("request");
      setInfoText("Сессия завершена.");
    } catch (error) {
      showError(error);
    }
  };

  const createNote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearMessages();
    try {
      const created = await api.createNote(newNote);
      setNotes((current) => [created, ...current]);
      setNewNote({ title: "", content: "" });
    } catch (error) {
      showError(error);
    }
  };

  const openNote = async (noteId: string) => {
    clearMessages();
    try {
      setSelectedNote(await api.getNote(noteId));
    } catch (error) {
      showError(error);
    }
  };

  const saveSelectedNote = async () => {
    if (!selectedNote) return;
    clearMessages();
    try {
      const updated = await api.updateNote(selectedNote.id, {
        title: selectedNote.title,
        content: selectedNote.content
      });
      setNotes((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setSelectedNote(updated);
      setInfoText("Заметка сохранена.");
    } catch (error) {
      showError(error);
    }
  };

  const removeNote = async (noteId: string) => {
    clearMessages();
    try {
      await api.deleteNote(noteId);
      setNotes((current) => current.filter((item) => item.id !== noteId));
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }
    } catch (error) {
      showError(error);
    }
  };

  const uploadContactAvatar = async (file: File) => {
    clearMessages();
    try {
      const uploaded = await api.uploadImage(file);
      setNewContact((current) => ({ ...current, avatar_file_id: uploaded.id }));
      setInfoText("Аватар загружен.");
    } catch (error) {
      showError(error);
    }
  };

  const uploadLinkImage = async (file: File) => {
    clearMessages();
    try {
      const uploaded = await api.uploadImage(file);
      setNewLink((current) => ({ ...current, image_file_id: uploaded.id }));
      setInfoText("Изображение загружено.");
    } catch (error) {
      showError(error);
    }
  };

  const createContact = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearMessages();
    try {
      const created = await api.createContact({
        name: newContact.name,
        phone: newContact.phone || null,
        telegram_username: newContact.telegram_username || null,
        description: newContact.description || null,
        avatar_file_id: newContact.avatar_file_id
      });
      setContacts((current) => [created, ...current]);
      setNewContact({ name: "", phone: "", telegram_username: "", description: "", avatar_file_id: null });
    } catch (error) {
      showError(error);
    }
  };

  const openContact = async (contactId: string) => {
    clearMessages();
    try {
      setSelectedContact(await api.getContact(contactId));
    } catch (error) {
      showError(error);
    }
  };

  const saveSelectedContact = async () => {
    if (!selectedContact) return;
    clearMessages();
    try {
      const updated = await api.updateContact(selectedContact.id, {
        name: selectedContact.name,
        phone: selectedContact.phone,
        telegram_username: selectedContact.telegram_username,
        description: selectedContact.description,
        avatar_file_id: selectedContact.avatar_file_id
      });
      setContacts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setSelectedContact(updated);
      setInfoText("Контакт сохранён.");
    } catch (error) {
      showError(error);
    }
  };

  const removeContact = async (contactId: string) => {
    clearMessages();
    try {
      await api.deleteContact(contactId);
      setContacts((current) => current.filter((item) => item.id !== contactId));
      if (selectedContact?.id === contactId) {
        setSelectedContact(null);
      }
    } catch (error) {
      showError(error);
    }
  };

  const createLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearMessages();
    try {
      const created = await api.createLink({
        title: newLink.title,
        url: newLink.url,
        description: newLink.description || null,
        image_file_id: newLink.image_file_id
      });
      setLinks((current) => [created, ...current]);
      setNewLink({ title: "", url: "", description: "", image_file_id: null });
    } catch (error) {
      showError(error);
    }
  };

  const openLink = async (linkId: string) => {
    clearMessages();
    try {
      setSelectedLink(await api.getLink(linkId));
    } catch (error) {
      showError(error);
    }
  };

  const saveSelectedLink = async () => {
    if (!selectedLink) return;
    clearMessages();
    try {
      const updated = await api.updateLink(selectedLink.id, {
        title: selectedLink.title,
        url: selectedLink.url,
        description: selectedLink.description,
        image_file_id: selectedLink.image_file_id
      });
      setLinks((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setSelectedLink(updated);
      setInfoText("Ссылка сохранена.");
    } catch (error) {
      showError(error);
    }
  };

  const removeLink = async (linkId: string) => {
    clearMessages();
    try {
      await api.deleteLink(linkId);
      setLinks((current) => current.filter((item) => item.id !== linkId));
      if (selectedLink?.id === linkId) {
        setSelectedLink(null);
      }
    } catch (error) {
      showError(error);
    }
  };

  const sectionButtons: { id: Section; label: string }[] = [
    { id: "notes", label: "Заметки" },
    { id: "contacts", label: "Важные контакты" },
    { id: "links", label: "Библиотека ссылок" }
  ];

  if (!user) {
    return (
      <main className="min-h-screen px-6 py-12 md:px-12">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-vault-lime/30 bg-vault-panel/80 p-8 shadow-glow"
          >
            <h1 className="text-4xl font-semibold text-vault-lime">SatoSave Vault</h1>
            <p className="mt-4 max-w-2xl text-vault-text/90">
              Защищённый сервис хранения заметок, контактов и важных ссылок. Вход без пароля: только email и OTP-код.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <button
                className="rounded-xl border border-vault-cyan px-5 py-3 font-medium text-vault-cyan transition hover:bg-vault-cyan/10"
                type="button"
              >
                Скачать приложение
              </button>
              <button
                className="rounded-xl bg-vault-lime px-5 py-3 font-semibold text-[#021103] transition hover:brightness-110"
                type="button"
              >
                Продолжить в браузере
              </button>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-vault-cyan/20 bg-black/40 p-6"
          >
            {authStep === "request" ? (
              <form className="space-y-4" onSubmit={handleRequestCode}>
                <h2 className="text-xl font-semibold">Войти по email OTP</h2>
                <input
                  className="w-full rounded-lg border border-vault-cyan/40 bg-transparent px-4 py-3 outline-none focus:border-vault-lime"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  required
                  placeholder="you@example.com"
                />
                <button
                  className="rounded-lg bg-vault-cyan px-4 py-2 font-semibold text-[#032426] transition hover:brightness-110 disabled:opacity-60"
                  disabled={authLoading}
                  type="submit"
                >
                  {authLoading ? "Отправка..." : "Получить OTP-код"}
                </button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={handleVerifyCode}>
                <h2 className="text-xl font-semibold">Введите код из письма</h2>
                <input
                  className="w-full rounded-lg border border-vault-cyan/40 bg-transparent px-4 py-3 uppercase tracking-[0.35em] outline-none focus:border-vault-lime"
                  value={otpCode}
                  onChange={(event) => setOtpCode(event.target.value.toUpperCase())}
                  maxLength={6}
                  minLength={6}
                  required
                  placeholder="A1B2C3"
                />
                <div className="flex gap-3">
                  <button
                    className="rounded-lg bg-vault-lime px-4 py-2 font-semibold text-[#021103] transition hover:brightness-110 disabled:opacity-60"
                    disabled={authLoading}
                    type="submit"
                  >
                    {authLoading ? "Проверка..." : "Войти"}
                  </button>
                  <button
                    className="rounded-lg border border-vault-cyan px-4 py-2 text-vault-cyan transition hover:bg-vault-cyan/10"
                    type="button"
                    onClick={() => setAuthStep("request")}
                  >
                    Назад
                  </button>
                </div>
              </form>
            )}
            <Feedback infoText={infoText} errorText={errorText} />
          </motion.section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-transparent px-6 py-8 md:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-vault-lime/20 bg-vault-panel/80 p-5">
          <div>
            <h1 className="text-2xl font-semibold text-vault-lime">SatoSave Vault Dashboard</h1>
            <p className="text-sm text-vault-text/80">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-vault-cyan px-4 py-2 text-vault-cyan transition hover:bg-vault-cyan/10"
          >
            Logout
          </button>
        </header>

        <section className="rounded-2xl border border-vault-cyan/20 bg-black/40 p-4">
          <div className="flex flex-wrap gap-3">
            {sectionButtons.map((button) => (
              <button
                key={button.id}
                type="button"
                onClick={() => {
                  setActiveSection(button.id);
                  setSelectedNote(null);
                  setSelectedContact(null);
                  setSelectedLink(null);
                }}
                className={`rounded-xl px-4 py-2 font-medium transition ${
                  activeSection === button.id
                    ? "bg-vault-lime text-[#041005]"
                    : "border border-vault-cyan/40 text-vault-cyan hover:bg-vault-cyan/10"
                }`}
              >
                {button.label}
              </button>
            ))}
          </div>
          <Feedback infoText={infoText} errorText={errorText} />
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <section className="rounded-2xl border border-vault-lime/20 bg-vault-panel/60 p-5">
            {activeSection === "notes" && (
              <form onSubmit={createNote} className="space-y-3">
                <h2 className="text-lg font-semibold">Новая заметка</h2>
                <input
                  className="w-full rounded-lg border border-vault-cyan/40 bg-transparent px-3 py-2 outline-none focus:border-vault-lime"
                  placeholder="Заголовок"
                  required
                  value={newNote.title}
                  onChange={(event) => setNewNote((current) => ({ ...current, title: event.target.value }))}
                />
                <textarea
                  className="h-28 w-full rounded-lg border border-vault-cyan/40 bg-transparent px-3 py-2 outline-none focus:border-vault-lime"
                  placeholder="Содержимое"
                  required
                  value={newNote.content}
                  onChange={(event) => setNewNote((current) => ({ ...current, content: event.target.value }))}
                />
                <button className="rounded-lg bg-vault-lime px-4 py-2 font-semibold text-[#031105]" type="submit">
                  Создать заметку
                </button>
              </form>
            )}

            {activeSection === "contacts" && (
              <form onSubmit={createContact} className="space-y-3">
                <h2 className="text-lg font-semibold">Новый контакт</h2>
                <input
                  className="w-full rounded-lg border border-vault-cyan/40 bg-transparent px-3 py-2 outline-none focus:border-vault-lime"
                  placeholder="Имя"
                  required
                  value={newContact.name}
                  onChange={(event) => setNewContact((current) => ({ ...current, name: event.target.value }))}
                />
                <input
                  className="w-full rounded-lg border border-vault-cyan/40 bg-transparent px-3 py-2 outline-none focus:border-vault-lime"
                  placeholder="Телефон"
                  value={newContact.phone}
                  onChange={(event) => setNewContact((current) => ({ ...current, phone: event.target.value }))}
                />
                <input
                  className="w-full rounded-lg border border-vault-cyan/40 bg-transparent px-3 py-2 outline-none focus:border-vault-lime"
                  placeholder="Telegram username"
                  value={newContact.telegram_username}
                  onChange={(event) =>
                    setNewContact((current) => ({ ...current, telegram_username: event.target.value }))
                  }
                />
                <textarea
                  className="h-24 w-full rounded-lg border border-vault-cyan/40 bg-transparent px-3 py-2 outline-none focus:border-vault-lime"
                  placeholder="Описание"
                  value={newContact.description}
                  onChange={(event) => setNewContact((current) => ({ ...current, description: event.target.value }))}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadContactAvatar(file);
                  }}
                />
                <button className="rounded-lg bg-vault-lime px-4 py-2 font-semibold text-[#031105]" type="submit">
                  Создать контакт
                </button>
              </form>
            )}

            {activeSection === "links" && (
              <form onSubmit={createLink} className="space-y-3">
                <h2 className="text-lg font-semibold">Новая ссылка</h2>
                <input
                  className="w-full rounded-lg border border-vault-cyan/40 bg-transparent px-3 py-2 outline-none focus:border-vault-lime"
                  placeholder="Название"
                  required
                  value={newLink.title}
                  onChange={(event) => setNewLink((current) => ({ ...current, title: event.target.value }))}
                />
                <input
                  className="w-full rounded-lg border border-vault-cyan/40 bg-transparent px-3 py-2 outline-none focus:border-vault-lime"
                  placeholder="https://example.com"
                  required
                  type="url"
                  value={newLink.url}
                  onChange={(event) => setNewLink((current) => ({ ...current, url: event.target.value }))}
                />
                <textarea
                  className="h-24 w-full rounded-lg border border-vault-cyan/40 bg-transparent px-3 py-2 outline-none focus:border-vault-lime"
                  placeholder="Описание"
                  value={newLink.description}
                  onChange={(event) => setNewLink((current) => ({ ...current, description: event.target.value }))}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadLinkImage(file);
                  }}
                />
                <button className="rounded-lg bg-vault-lime px-4 py-2 font-semibold text-[#031105]" type="submit">
                  Создать ссылку
                </button>
              </form>
            )}
          </section>

          <section className="rounded-2xl border border-vault-cyan/20 bg-black/40 p-5">
            <AnimatePresence mode="wait">
              {loadingSection ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-lg border border-vault-cyan/30 p-4 text-vault-cyan"
                >
                  Загрузка...
                </motion.div>
              ) : activeSection === "notes" ? (
                <motion.div key="notes-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {notes.length === 0 ? (
                    <EmptyState title="Пока нет заметок" subtitle="Создайте первую заметку в форме слева." />
                  ) : (
                    <div className="space-y-3">
                      {notes.map((note) => (
                        <button
                          key={note.id}
                          type="button"
                          onClick={() => void openNote(note.id)}
                          className="w-full rounded-xl border border-vault-cyan/30 bg-vault-panel/70 p-3 text-left transition hover:border-vault-lime"
                        >
                          <p className="font-medium text-vault-lime">{note.title}</p>
                          <p className="text-sm text-vault-text/75">Обновлено: {formatDate(note.updated_at)}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              ) : activeSection === "contacts" ? (
                <motion.div key="contacts-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {contacts.length === 0 ? (
                    <EmptyState title="Пока нет контактов" subtitle="Добавьте важный контакт с телефоном или Telegram." />
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {contacts.map((contact) => (
                        <button
                          key={contact.id}
                          type="button"
                          onClick={() => void openContact(contact.id)}
                          className="rounded-xl border border-vault-cyan/30 bg-vault-panel/70 p-3 text-left transition hover:border-vault-lime"
                        >
                          {contact.avatar_url ? (
                            <img
                              src={getAssetUrl(contact.avatar_url, API_BASE_URL) ?? ""}
                              alt={contact.name}
                              className="mb-2 h-16 w-16 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-xl bg-vault-cyan/10 text-vault-cyan">
                              ?
                            </div>
                          )}
                          <p className="font-medium text-vault-lime">{contact.name}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="links-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {links.length === 0 ? (
                    <EmptyState title="Пока нет ссылок" subtitle="Создайте библиотеку полезных URL и ресурсов." />
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {links.map((link) => (
                        <button
                          key={link.id}
                          type="button"
                          onClick={() => void openLink(link.id)}
                          className="rounded-xl border border-vault-cyan/30 bg-vault-panel/70 p-3 text-left transition hover:border-vault-lime"
                        >
                          {link.image_url ? (
                            <img
                              src={getAssetUrl(link.image_url, API_BASE_URL) ?? ""}
                              alt={link.title}
                              className="mb-2 h-16 w-full rounded-xl object-cover"
                            />
                          ) : (
                            <div className="mb-2 h-16 rounded-xl bg-vault-cyan/10" />
                          )}
                          <p className="line-clamp-1 font-medium text-vault-lime">{link.title}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </div>

      <AnimatePresence>
        {selectedNote && (
          <Modal title="Заметка" onClose={() => setSelectedNote(null)}>
            <div className="space-y-3">
              <input
                className="w-full rounded-lg border border-vault-cyan/40 bg-transparent px-3 py-2"
                value={selectedNote.title}
                onChange={(event) => setSelectedNote((note) => (note ? { ...note, title: event.target.value } : null))}
              />
              <textarea
                className="h-40 w-full rounded-lg border border-vault-cyan/40 bg-transparent px-3 py-2"
                value={selectedNote.content}
                onChange={(event) => setSelectedNote((note) => (note ? { ...note, content: event.target.value } : null))}
              />
              <div className="flex gap-3">
                <button className="rounded-lg bg-vault-lime px-4 py-2 font-semibold text-[#031105]" onClick={saveSelectedNote}>
                  Сохранить
                </button>
                <button
                  className="rounded-lg border border-red-500 px-4 py-2 text-red-400"
                  onClick={() => void removeNote(selectedNote.id)}
                >
                  Удалить
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedContact && (
          <Modal title="Контакт" onClose={() => setSelectedContact(null)}>
            <div className="space-y-3">
              <input
                className="w-full rounded-lg border border-vault-cyan/40 bg-transparent px-3 py-2"
                value={selectedContact.name}
                onChange={(event) =>
                  setSelectedContact((contact) => (contact ? { ...contact, name: event.target.value } : null))
                }
              />
              <input
                className="w-full rounded-lg border border-vault-cyan/40 bg-transparent px-3 py-2"
                value={selectedContact.phone ?? ""}
                placeholder="Телефон"
                onChange={(event) =>
                  setSelectedContact((contact) => (contact ? { ...contact, phone: event.target.value } : null))
                }
              />
              <input
                className="w-full rounded-lg border border-vault-cyan/40 bg-transparent px-3 py-2"
                value={selectedContact.telegram_username ?? ""}
                placeholder="Telegram username"
                onChange={(event) =>
                  setSelectedContact((contact) =>
                    contact ? { ...contact, telegram_username: event.target.value } : null,
                  )
                }
              />
              <textarea
                className="h-28 w-full rounded-lg border border-vault-cyan/40 bg-transparent px-3 py-2"
                value={selectedContact.description ?? ""}
                placeholder="Описание"
                onChange={(event) =>
                  setSelectedContact((contact) => (contact ? { ...contact, description: event.target.value } : null))
                }
              />
              <div className="flex gap-3">
                <button
                  className="rounded-lg bg-vault-lime px-4 py-2 font-semibold text-[#031105]"
                  onClick={saveSelectedContact}
                >
                  Сохранить
                </button>
                <button
                  className="rounded-lg border border-red-500 px-4 py-2 text-red-400"
                  onClick={() => void removeContact(selectedContact.id)}
                >
                  Удалить
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedLink && (
          <Modal title="Ссылка" onClose={() => setSelectedLink(null)}>
            <div className="space-y-3">
              <input
                className="w-full rounded-lg border border-vault-cyan/40 bg-transparent px-3 py-2"
                value={selectedLink.title}
                onChange={(event) => setSelectedLink((link) => (link ? { ...link, title: event.target.value } : null))}
              />
              <input
                className="w-full rounded-lg border border-vault-cyan/40 bg-transparent px-3 py-2"
                value={selectedLink.url}
                onChange={(event) => setSelectedLink((link) => (link ? { ...link, url: event.target.value } : null))}
              />
              <textarea
                className="h-28 w-full rounded-lg border border-vault-cyan/40 bg-transparent px-3 py-2"
                value={selectedLink.description ?? ""}
                onChange={(event) =>
                  setSelectedLink((link) => (link ? { ...link, description: event.target.value } : null))
                }
              />
              <div className="flex gap-3">
                <button className="rounded-lg bg-vault-lime px-4 py-2 font-semibold text-[#031105]" onClick={saveSelectedLink}>
                  Сохранить
                </button>
                <button
                  className="rounded-lg border border-red-500 px-4 py-2 text-red-400"
                  onClick={() => void removeLink(selectedLink.id)}
                >
                  Удалить
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </main>
  );
}

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-xl border border-dashed border-vault-cyan/40 p-6 text-center">
      <p className="text-lg font-semibold text-vault-lime">{title}</p>
      <p className="mt-2 text-sm text-vault-text/75">{subtitle}</p>
    </div>
  );
}

function Feedback({ infoText, errorText }: { infoText: string | null; errorText: string | null }) {
  return (
    <div className="mt-4 min-h-6">
      {infoText && <p className="text-sm text-vault-lime">{infoText}</p>}
      {errorText && <p className="text-sm text-red-400">{errorText}</p>}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-vault-cyan/30 bg-vault-panel p-5"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 30, opacity: 0 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-vault-lime">{title}</h3>
          <button className="rounded-md border border-vault-cyan/40 px-3 py-1 text-sm text-vault-cyan" onClick={onClose}>
            Закрыть
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}
