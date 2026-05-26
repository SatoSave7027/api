import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import { Animated, FlatList, Image, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import { api, mediaUrl, type Contact, type LinkItem, type Note, type Section, type User } from "./api";

type Item = Note | Contact | LinkItem;
const sections: { id: Section; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: "notes", label: "Заметки", icon: "book-outline" },
  { id: "contacts", label: "Контакты", icon: "people-outline" },
  { id: "links", label: "Ссылки", icon: "link-outline" }
];

export default function App() {
  const fade = useRef(new Animated.Value(0)).current;
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [section, setSection] = useState<Section>("notes");
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<Item | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 420, useNativeDriver: true }).start();
    api.me().then(setUser).catch(api.clear);
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, section]);

  async function load() {
    setBusy(true);
    setError("");
    try {
      setItems(await api.list(section));
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setBusy(false);
    }
  }

  function resetForm() {
    setSelected(null);
    setForm({});
    setImageUri(null);
  }

  async function authenticate() {
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
      setError(err instanceof Error ? err.message : "Authentication failed");
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

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.82 });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  }

  async function save() {
    setBusy(true);
    setError("");
    try {
      const upload = imageUri ? await api.upload(imageUri) : null;
      const payload = section === "notes"
        ? { title: form.title, content: form.content }
        : section === "contacts"
          ? { name: form.name, phone: form.phone || null, telegram_username: form.telegram_username || null, description: form.description || null, avatar_file_id: upload?.id || form.avatar_file_id || null }
          : { title: form.title, url: form.url, description: form.description || null, image_file_id: upload?.id || form.image_file_id || null };
      selected ? await api.update(section, selected.id, payload) : await api.create(section, payload);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <Animated.View style={[styles.authCard, { opacity: fade }]}> 
          <Text style={styles.logo}>SatoSave Vault</Text>
          <Text style={styles.muted}>OTP-вход через реальный backend API</Text>
          <TextInput style={styles.input} autoCapitalize="none" keyboardType="email-address" placeholder="email" placeholderTextColor="#789" value={email} onChangeText={setEmail} editable={!codeSent} />
          {codeSent ? <TextInput style={styles.input} autoCapitalize="characters" placeholder="A1B2C3" placeholderTextColor="#789" value={code} onChangeText={setCode} maxLength={6} /> : null}
          <Pressable style={styles.primary} onPress={authenticate} disabled={busy}><Text style={styles.primaryText}>{codeSent ? "Войти" : "Получить код"}</Text></Pressable>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
        <View style={styles.header}>
          <View><Text style={styles.logo}>SatoSave Vault</Text><Text style={styles.muted}>{user.email}</Text></View>
          <Pressable onPress={async () => { await api.logout(); setUser(null); }}><Ionicons name="log-out-outline" color="#20f6d2" size={26} /></Pressable>
        </View>
        <View style={styles.tabs}>
          {sections.map((item) => <Pressable key={item.id} style={[styles.tab, section === item.id && styles.tabActive]} onPress={() => setSection(item.id)}><Ionicons name={item.icon} color={section === item.id ? "#020403" : "#20f6d2"} size={18} /><Text style={section === item.id ? styles.tabTextActive : styles.tabText}>{item.label}</Text></Pressable>)}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <FlatList data={items} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} ListEmptyComponent={<Text style={styles.empty}>{busy ? "Загрузка..." : "Пока пусто. Создайте первую запись."}</Text>} renderItem={({ item }) => <Card item={item} section={section} onOpen={() => open(item)} onDelete={async () => { await api.remove(section, item.id); await load(); }} />} />
        <View style={styles.editor}>
          <Text style={styles.editorTitle}>{selected ? "Редактировать" : "Создать"}</Text>
          <Editor section={section} form={form} setForm={setForm} pickImage={pickImage} />
          <View style={styles.editorActions}><Pressable style={styles.primary} onPress={save} disabled={busy}><Text style={styles.primaryText}>Сохранить</Text></Pressable><Pressable style={styles.secondary} onPress={resetForm}><Text style={styles.secondaryText}>Новая</Text></Pressable></View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Editor({ section, form, setForm, pickImage }: { section: Section; form: Record<string, string>; setForm: (form: Record<string, string>) => void; pickImage: () => void }) {
  const update = (key: string, value: string) => setForm({ ...form, [key]: value });
  return (
    <View style={styles.form}>
      {section === "contacts" ? <TextInput style={styles.input} placeholder="Имя" placeholderTextColor="#789" value={form.name || ""} onChangeText={(value) => update("name", value)} /> : <TextInput style={styles.input} placeholder="Название" placeholderTextColor="#789" value={form.title || ""} onChangeText={(value) => update("title", value)} />}
      {section === "notes" ? <TextInput style={[styles.input, styles.textarea]} multiline placeholder="Заметка" placeholderTextColor="#789" value={form.content || ""} onChangeText={(value) => update("content", value)} /> : null}
      {section === "contacts" ? <><TextInput style={styles.input} placeholder="Телефон" placeholderTextColor="#789" value={form.phone || ""} onChangeText={(value) => update("phone", value)} /><TextInput style={styles.input} placeholder="Telegram" placeholderTextColor="#789" value={form.telegram_username || ""} onChangeText={(value) => update("telegram_username", value)} /><TextInput style={[styles.input, styles.textarea]} multiline placeholder="Описание" placeholderTextColor="#789" value={form.description || ""} onChangeText={(value) => update("description", value)} /><Pressable style={styles.secondary} onPress={pickImage}><Text style={styles.secondaryText}>Загрузить аватар</Text></Pressable></> : null}
      {section === "links" ? <><TextInput style={styles.input} placeholder="URL" placeholderTextColor="#789" value={form.url || ""} onChangeText={(value) => update("url", value)} /><TextInput style={[styles.input, styles.textarea]} multiline placeholder="Описание" placeholderTextColor="#789" value={form.description || ""} onChangeText={(value) => update("description", value)} /><Pressable style={styles.secondary} onPress={pickImage}><Text style={styles.secondaryText}>Загрузить изображение</Text></Pressable></> : null}
    </View>
  );
}

function Card({ item, section, onOpen, onDelete }: { item: Item; section: Section; onOpen: () => void; onDelete: () => void }) {
  const title = section === "contacts" ? (item as Contact).name : (item as Note | LinkItem).title;
  const subtitle = section === "notes" ? (item as Note).content : section === "contacts" ? ((item as Contact).phone || (item as Contact).telegram_username || "") : (item as LinkItem).url;
  const image = section === "contacts" ? mediaUrl((item as Contact).avatar_url) : section === "links" ? mediaUrl((item as LinkItem).image_url) : null;
  return <Animated.View style={styles.card}><Pressable onPress={onOpen}>{section !== "notes" ? <View style={styles.avatar}>{image ? <Image source={{ uri: image }} style={styles.image} /> : <Text style={styles.avatarText}>{title.slice(0, 1).toUpperCase()}</Text>}</View> : null}<Text style={styles.cardTitle}>{title}</Text><Text style={styles.muted} numberOfLines={2}>{subtitle}</Text></Pressable><Pressable onPress={onDelete} style={styles.delete}><Text style={styles.deleteText}>Удалить</Text></Pressable></Animated.View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#030706" },
  container: { flex: 1, padding: 16, gap: 12 },
  authCard: { margin: 18, marginTop: 120, padding: 22, borderRadius: 28, borderWidth: 1, borderColor: "rgba(32,246,210,0.25)", backgroundColor: "#07110f", gap: 12 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  logo: { color: "white", fontSize: 28, fontWeight: "900" },
  muted: { color: "rgba(236,255,248,0.62)", marginTop: 4 },
  tabs: { flexDirection: "row", gap: 8 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderRadius: 18, borderWidth: 1, borderColor: "rgba(32,246,210,0.22)", paddingVertical: 10 },
  tabActive: { backgroundColor: "#67ff6a", borderColor: "#67ff6a" },
  tabText: { color: "#20f6d2", fontSize: 12, fontWeight: "700" },
  tabTextActive: { color: "#020403", fontSize: 12, fontWeight: "900" },
  list: { gap: 10, paddingBottom: 12 },
  empty: { color: "rgba(236,255,248,0.65)", textAlign: "center", marginTop: 24 },
  card: { borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", borderRadius: 22, padding: 14, backgroundColor: "rgba(255,255,255,0.04)" },
  avatar: { height: 100, borderRadius: 18, marginBottom: 10, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(32,246,210,0.12)" },
  image: { width: "100%", height: "100%" },
  avatarText: { color: "#20f6d2", fontSize: 32, fontWeight: "900" },
  cardTitle: { color: "white", fontSize: 18, fontWeight: "900" },
  delete: { marginTop: 10, alignSelf: "flex-start" },
  deleteText: { color: "#ffb4b4" },
  editor: { borderRadius: 24, borderWidth: 1, borderColor: "rgba(103,255,106,0.22)", padding: 12, backgroundColor: "#07110f" },
  editorTitle: { color: "white", fontWeight: "900", fontSize: 18, marginBottom: 8 },
  form: { gap: 8 },
  input: { borderWidth: 1, borderColor: "rgba(32,246,210,0.25)", borderRadius: 16, color: "white", padding: 12, backgroundColor: "rgba(0,0,0,0.25)" },
  textarea: { minHeight: 76, textAlignVertical: "top" },
  editorActions: { flexDirection: "row", gap: 8, marginTop: 10 },
  primary: { flex: 1, borderRadius: 16, backgroundColor: "#67ff6a", padding: 12, alignItems: "center" },
  primaryText: { color: "#020403", fontWeight: "900" },
  secondary: { borderRadius: 16, borderWidth: 1, borderColor: "rgba(32,246,210,0.25)", padding: 12, alignItems: "center" },
  secondaryText: { color: "#20f6d2", fontWeight: "800" },
  error: { color: "#ffb4b4", marginVertical: 8 }
});
