import { StatusBar } from "expo-status-bar";
import { Animated, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useEffect, useRef, useState } from "react";

import { SectionCard } from "./app/components/SectionCard";

type Tokens = { access_token: string; refresh_token: string };
type User = { id: string; email: string };
type Section = "notes" | "contacts" | "links";

type Note = { id: string; title: string; content: string };
type Contact = { id: string; name: string; phone: string | null; telegram_username: string | null };
type LinkItem = { id: string; title: string; url: string; description: string | null };

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://10.0.2.2:8000/api/v1";

export default function App() {
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [tokens, setTokens] = useState<Tokens | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [section, setSection] = useState<Section>("notes");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [notes, setNotes] = useState<Note[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);

  const [noteForm, setNoteForm] = useState({ id: "", title: "", content: "" });
  const [contactForm, setContactForm] = useState({ id: "", name: "", phone: "", telegram_username: "" });
  const [linkForm, setLinkForm] = useState({ id: "", title: "", url: "", description: "" });

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true
    }).start();
  }, [fadeAnim, section, user]);

  const parseError = async (response: Response): Promise<string> => {
    const payload = await response.json().catch(() => ({}));
    return payload?.error?.message ?? payload?.detail ?? "Request failed";
  };

  const authedFetch = async (path: string, init: RequestInit = {}, suppliedAccess?: string): Promise<Response> => {
    const access = suppliedAccess ?? tokens?.access_token;
    if (!access) throw new Error("Not authenticated");

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access}`,
        ...(init.headers ?? {})
      }
    });

    if (response.status !== 401) return response;
    if (!tokens?.refresh_token) return response;

    const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: tokens.refresh_token })
    });
    if (!refreshResponse.ok) {
      setTokens(null);
      setUser(null);
      return response;
    }
    const refreshed = await refreshResponse.json();
    setTokens({ access_token: refreshed.access_token, refresh_token: refreshed.refresh_token });
    setUser(refreshed.user);
    return authedFetch(path, init, refreshed.access_token);
  };

  const requestCode = async () => {
    setError(null);
    const response = await fetch(`${API_BASE_URL}/auth/request-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    if (!response.ok) {
      setError(await parseError(response));
      return;
    }
    setMessage("OTP отправлен на email.");
  };

  const verifyCode = async () => {
    setError(null);
    const response = await fetch(`${API_BASE_URL}/auth/verify-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code: otpCode.toUpperCase() })
    });
    if (!response.ok) {
      setError(await parseError(response));
      return;
    }
    const payload = await response.json();
    setTokens({ access_token: payload.access_token, refresh_token: payload.refresh_token });
    setUser(payload.user);
    setMessage("Вход выполнен.");
    await loadSection("notes", payload.access_token);
  };

  const loadSection = async (next: Section, suppliedAccess?: string) => {
    setSection(next);
    setError(null);
    const response = await authedFetch(`/${next}`, {}, suppliedAccess);
    if (!response.ok) {
      setError(await parseError(response));
      return;
    }
    const payload = await response.json();
    if (next === "notes") setNotes(payload);
    if (next === "contacts") setContacts(payload);
    if (next === "links") setLinks(payload);
  };

  const logout = async () => {
    if (!tokens) return;
    await authedFetch("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refresh_token: tokens.refresh_token })
    });
    setTokens(null);
    setUser(null);
    setMessage("Сессия завершена.");
  };

  const submitNote = async () => {
    if (!noteForm.title || !noteForm.content) return;
    const response = noteForm.id
      ? await authedFetch(`/notes/${noteForm.id}`, {
          method: "PATCH",
          body: JSON.stringify({ title: noteForm.title, content: noteForm.content })
        })
      : await authedFetch("/notes", {
          method: "POST",
          body: JSON.stringify({ title: noteForm.title, content: noteForm.content })
        });

    if (!response.ok) {
      setError(await parseError(response));
      return;
    }
    await loadSection("notes");
    setNoteForm({ id: "", title: "", content: "" });
  };

  const openNote = async (id: string) => {
    const response = await authedFetch(`/notes/${id}`);
    if (!response.ok) {
      setError(await parseError(response));
      return;
    }
    const payload = await response.json();
    setNoteForm({ id: payload.id, title: payload.title, content: payload.content });
  };

  const deleteNote = async (id: string) => {
    await authedFetch(`/notes/${id}`, { method: "DELETE" });
    await loadSection("notes");
  };

  const submitContact = async () => {
    if (!contactForm.name) return;
    const payload = {
      name: contactForm.name,
      phone: contactForm.phone || null,
      telegram_username: contactForm.telegram_username || null
    };
    const response = contactForm.id
      ? await authedFetch(`/contacts/${contactForm.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        })
      : await authedFetch("/contacts", {
          method: "POST",
          body: JSON.stringify(payload)
        });
    if (!response.ok) {
      setError(await parseError(response));
      return;
    }
    await loadSection("contacts");
    setContactForm({ id: "", name: "", phone: "", telegram_username: "" });
  };

  const openContact = async (id: string) => {
    const response = await authedFetch(`/contacts/${id}`);
    if (!response.ok) {
      setError(await parseError(response));
      return;
    }
    const payload = await response.json();
    setContactForm({
      id: payload.id,
      name: payload.name,
      phone: payload.phone ?? "",
      telegram_username: payload.telegram_username ?? ""
    });
  };

  const deleteContact = async (id: string) => {
    await authedFetch(`/contacts/${id}`, { method: "DELETE" });
    await loadSection("contacts");
  };

  const submitLink = async () => {
    if (!linkForm.title || !linkForm.url) return;
    const payload = {
      title: linkForm.title,
      url: linkForm.url,
      description: linkForm.description || null
    };
    const response = linkForm.id
      ? await authedFetch(`/links/${linkForm.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        })
      : await authedFetch("/links", {
          method: "POST",
          body: JSON.stringify(payload)
        });
    if (!response.ok) {
      setError(await parseError(response));
      return;
    }
    await loadSection("links");
    setLinkForm({ id: "", title: "", url: "", description: "" });
  };

  const openLink = async (id: string) => {
    const response = await authedFetch(`/links/${id}`);
    if (!response.ok) {
      setError(await parseError(response));
      return;
    }
    const payload = await response.json();
    setLinkForm({
      id: payload.id,
      title: payload.title,
      url: payload.url,
      description: payload.description ?? ""
    });
  };

  const deleteLink = async (id: string) => {
    await authedFetch(`/links/${id}`, { method: "DELETE" });
    await loadSection("links");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>SatoSave Vault Mobile</Text>
        <Text style={styles.subtitle}>Expo client for OTP auth and secure vault CRUD</Text>
        {message && <Text style={styles.success}>{message}</Text>}
        {error && <Text style={styles.error}>{error}</Text>}

        {!user ? (
          <Animated.View style={[styles.panel, { opacity: fadeAnim }]}>
            <Text style={styles.panelTitle}>Вход по OTP</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="Email"
              placeholderTextColor="#7aa09d"
            />
            <Pressable style={styles.button} onPress={() => void requestCode()}>
              <Text style={styles.buttonText}>Получить OTP</Text>
            </Pressable>
            <TextInput
              style={styles.input}
              value={otpCode}
              onChangeText={setOtpCode}
              autoCapitalize="characters"
              maxLength={6}
              placeholder="OTP код"
              placeholderTextColor="#7aa09d"
            />
            <Pressable style={[styles.button, styles.cyanButton]} onPress={() => void verifyCode()}>
              <Text style={[styles.buttonText, styles.cyanText]}>Войти</Text>
            </Pressable>
          </Animated.View>
        ) : (
          <Animated.View style={[styles.panel, { opacity: fadeAnim }]}>
            <View style={styles.rowBetween}>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Pressable style={styles.outlineButton} onPress={() => void logout()}>
                <Text style={styles.outlineText}>Logout</Text>
              </Pressable>
            </View>

            <View style={styles.sectionPicker}>
              <SectionCard title="Заметки" subtitle="Личные записи" onPress={() => void loadSection("notes")} />
              <SectionCard title="Контакты" subtitle="Важные люди" onPress={() => void loadSection("contacts")} />
              <SectionCard title="Ссылки" subtitle="Библиотека URL" onPress={() => void loadSection("links")} />
            </View>

            {section === "notes" && (
              <View style={styles.stack}>
                <Text style={styles.panelTitle}>Заметки</Text>
                <TextInput
                  style={styles.input}
                  value={noteForm.title}
                  onChangeText={(value) => setNoteForm((current) => ({ ...current, title: value }))}
                  placeholder="Заголовок"
                  placeholderTextColor="#7aa09d"
                />
                <TextInput
                  style={[styles.input, styles.multiline]}
                  multiline
                  value={noteForm.content}
                  onChangeText={(value) => setNoteForm((current) => ({ ...current, content: value }))}
                  placeholder="Содержимое"
                  placeholderTextColor="#7aa09d"
                />
                <Pressable style={styles.button} onPress={() => void submitNote()}>
                  <Text style={styles.buttonText}>{noteForm.id ? "Сохранить заметку" : "Создать заметку"}</Text>
                </Pressable>
                {notes.map((item) => (
                  <View key={item.id} style={styles.itemCard}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemBody}>{item.content}</Text>
                    <View style={styles.row}>
                      <Pressable style={styles.outlineButton} onPress={() => void openNote(item.id)}>
                        <Text style={styles.outlineText}>Открыть</Text>
                      </Pressable>
                      <Pressable style={styles.deleteButton} onPress={() => void deleteNote(item.id)}>
                        <Text style={styles.deleteText}>Удалить</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {section === "contacts" && (
              <View style={styles.stack}>
                <Text style={styles.panelTitle}>Контакты</Text>
                <TextInput
                  style={styles.input}
                  value={contactForm.name}
                  onChangeText={(value) => setContactForm((current) => ({ ...current, name: value }))}
                  placeholder="Имя"
                  placeholderTextColor="#7aa09d"
                />
                <TextInput
                  style={styles.input}
                  value={contactForm.phone}
                  onChangeText={(value) => setContactForm((current) => ({ ...current, phone: value }))}
                  placeholder="Телефон"
                  placeholderTextColor="#7aa09d"
                />
                <TextInput
                  style={styles.input}
                  value={contactForm.telegram_username}
                  onChangeText={(value) => setContactForm((current) => ({ ...current, telegram_username: value }))}
                  placeholder="Telegram username"
                  placeholderTextColor="#7aa09d"
                />
                <Pressable style={styles.button} onPress={() => void submitContact()}>
                  <Text style={styles.buttonText}>{contactForm.id ? "Сохранить контакт" : "Создать контакт"}</Text>
                </Pressable>
                {contacts.map((item) => (
                  <View key={item.id} style={styles.itemCard}>
                    <Text style={styles.itemTitle}>{item.name}</Text>
                    <Text style={styles.itemBody}>{item.phone || item.telegram_username || "-"}</Text>
                    <View style={styles.row}>
                      <Pressable style={styles.outlineButton} onPress={() => void openContact(item.id)}>
                        <Text style={styles.outlineText}>Открыть</Text>
                      </Pressable>
                      <Pressable style={styles.deleteButton} onPress={() => void deleteContact(item.id)}>
                        <Text style={styles.deleteText}>Удалить</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {section === "links" && (
              <View style={styles.stack}>
                <Text style={styles.panelTitle}>Ссылки</Text>
                <TextInput
                  style={styles.input}
                  value={linkForm.title}
                  onChangeText={(value) => setLinkForm((current) => ({ ...current, title: value }))}
                  placeholder="Название"
                  placeholderTextColor="#7aa09d"
                />
                <TextInput
                  style={styles.input}
                  value={linkForm.url}
                  onChangeText={(value) => setLinkForm((current) => ({ ...current, url: value }))}
                  placeholder="https://example.com"
                  placeholderTextColor="#7aa09d"
                />
                <TextInput
                  style={[styles.input, styles.multiline]}
                  multiline
                  value={linkForm.description}
                  onChangeText={(value) => setLinkForm((current) => ({ ...current, description: value }))}
                  placeholder="Описание"
                  placeholderTextColor="#7aa09d"
                />
                <Pressable style={styles.button} onPress={() => void submitLink()}>
                  <Text style={styles.buttonText}>{linkForm.id ? "Сохранить ссылку" : "Создать ссылку"}</Text>
                </Pressable>
                {links.map((item) => (
                  <View key={item.id} style={styles.itemCard}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemBody}>{item.url}</Text>
                    {!!item.description && <Text style={styles.itemBody}>{item.description}</Text>}
                    <View style={styles.row}>
                      <Pressable style={styles.outlineButton} onPress={() => void openLink(item.id)}>
                        <Text style={styles.outlineText}>Открыть</Text>
                      </Pressable>
                      <Pressable style={styles.deleteButton} onPress={() => void deleteLink(item.id)}>
                        <Text style={styles.deleteText}>Удалить</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#050b09"
  },
  container: {
    padding: 18,
    gap: 12
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#89ff2c"
  },
  subtitle: {
    color: "#85d4cf",
    marginBottom: 8
  },
  panel: {
    borderWidth: 1,
    borderColor: "rgba(34,230,214,0.35)",
    borderRadius: 16,
    backgroundColor: "rgba(16,25,23,0.92)",
    padding: 14,
    gap: 10
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#89ff2c"
  },
  success: {
    color: "#89ff2c"
  },
  error: {
    color: "#ff6c7a"
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(34,230,214,0.4)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#defde6",
    backgroundColor: "rgba(5,12,10,0.92)"
  },
  multiline: {
    minHeight: 84,
    textAlignVertical: "top"
  },
  button: {
    borderRadius: 10,
    backgroundColor: "#89ff2c",
    padding: 12,
    alignItems: "center"
  },
  cyanButton: {
    backgroundColor: "#22e6d6"
  },
  buttonText: {
    color: "#081209",
    fontWeight: "700"
  },
  cyanText: {
    color: "#052220"
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  userEmail: {
    color: "#d8ffe2",
    fontWeight: "600"
  },
  sectionPicker: {
    gap: 10
  },
  stack: {
    gap: 10
  },
  itemCard: {
    borderWidth: 1,
    borderColor: "rgba(34,230,214,0.3)",
    borderRadius: 12,
    padding: 10,
    gap: 6
  },
  itemTitle: {
    color: "#89ff2c",
    fontWeight: "700"
  },
  itemBody: {
    color: "#c5ece6"
  },
  row: {
    flexDirection: "row",
    gap: 8
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: "rgba(34,230,214,0.6)",
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  outlineText: {
    color: "#22e6d6",
    fontWeight: "600"
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: "#f16e7f",
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  deleteText: {
    color: "#f16e7f",
    fontWeight: "600"
  }
});
