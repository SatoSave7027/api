import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  RefreshControl,
} from "react-native";
import Animated, { FadeIn, Layout } from "react-native-reanimated";
import { Contact } from "@/lib/types";
import { contactsApi } from "@/lib/api";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function ContactsTab() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [viewContact, setViewContact] = useState<Contact | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [telegram, setTelegram] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchContacts = useCallback(async () => {
    try {
      const res = await contactsApi.list();
      setContacts(res.data);
    } catch {
      setContacts([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const openCreate = () => {
    setEditContact(null);
    setName("");
    setPhone("");
    setTelegram("");
    setDescription("");
    setError("");
    setModalVisible(true);
  };

  const openEdit = (c: Contact) => {
    setEditContact(c);
    setName(c.name);
    setPhone(c.phone || "");
    setTelegram(c.telegram_username || "");
    setDescription(c.description || "");
    setError("");
    setViewModalVisible(false);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!phone.trim() && !telegram.trim()) {
      setError("Phone or Telegram is required");
      return;
    }
    setError("");
    setIsSaving(true);
    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim() || undefined,
        telegram_username: telegram.trim() || undefined,
        description: description.trim() || undefined,
      };
      if (editContact) {
        await contactsApi.update(editContact.id, payload);
      } else {
        await contactsApi.create(payload);
      }
      setModalVisible(false);
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
      setViewModalVisible(false);
    } catch {}
  };

  const renderContact = ({ item, index }: { item: Contact; index: number }) => (
    <AnimatedTouchable
      entering={FadeIn.delay(index * 40)}
      layout={Layout}
      style={styles.contactCard}
      onPress={() => {
        setViewContact(item);
        setViewModalVisible(true);
      }}
      activeOpacity={0.85}
    >
      {item.avatar ? (
        <Image
          source={{ uri: item.avatar.url }}
          style={styles.avatar}
        />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarPlaceholderText}>👤</Text>
        </View>
      )}
      <Text style={styles.contactName} numberOfLines={1}>{item.name}</Text>
      {item.phone && (
        <Text style={styles.contactDetail} numberOfLines={1}>{item.phone}</Text>
      )}
      {item.telegram_username && (
        <Text style={[styles.contactDetail, { color: "#39ff14" }]} numberOfLines={1}>
          @{item.telegram_username}
        </Text>
      )}
      <View style={styles.cardActions}>
        <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionBtn}>
          <Text>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionBtn}>
          <Text>🗑️</Text>
        </TouchableOpacity>
      </View>
    </AnimatedTouchable>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#39ff14" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Contacts</Text>
        <TouchableOpacity style={styles.addButton} onPress={openCreate} activeOpacity={0.85}>
          <Text style={styles.addButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {contacts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👤</Text>
          <Text style={styles.emptyTitle}>No contacts yet</Text>
          <Text style={styles.emptyDesc}>Add your important contacts</Text>
          <TouchableOpacity style={styles.addButton} onPress={openCreate}>
            <Text style={styles.addButtonText}>+ Add Contact</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          renderItem={renderContact}
          contentContainerStyle={styles.grid}
          numColumns={3}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchContacts();
              }}
              tintColor="#39ff14"
            />
          }
        />
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editContact ? "Edit Contact" : "New Contact"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            {[
              { label: "Name *", value: name, setter: setName, placeholder: "Full name", keyboard: "default" as const },
              { label: "Phone", value: phone, setter: setPhone, placeholder: "+1 234 567 8900", keyboard: "phone-pad" as const },
              { label: "Telegram", value: telegram, setter: setTelegram, placeholder: "username", keyboard: "default" as const },
              { label: "Description", value: description, setter: setDescription, placeholder: "Optional note...", keyboard: "default" as const },
            ].map(({ label, value, setter, placeholder, keyboard }) => (
              <View key={label}>
                <Text style={styles.inputLabel}>{label}</Text>
                <TextInput
                  style={styles.input}
                  value={value}
                  onChangeText={setter}
                  placeholder={placeholder}
                  placeholderTextColor="#444"
                  keyboardType={keyboard}
                  autoCapitalize="none"
                />
              </View>
            ))}
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, isSaving && styles.btnDisabled]}
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>{editContact ? "Save" : "Create"}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={viewModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setViewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {viewContact?.name}
              </Text>
              <TouchableOpacity onPress={() => setViewModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            {viewContact && (
              <>
                {viewContact.phone && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailIcon}>📞</Text>
                    <Text style={styles.detailText}>{viewContact.phone}</Text>
                  </View>
                )}
                {viewContact.telegram_username && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailIcon}>💬</Text>
                    <Text style={[styles.detailText, { color: "#39ff14" }]}>
                      @{viewContact.telegram_username}
                    </Text>
                  </View>
                )}
                {viewContact.description && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailIcon}>📄</Text>
                    <Text style={styles.detailText}>{viewContact.description}</Text>
                  </View>
                )}
              </>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => viewContact && openEdit(viewContact)}
              >
                <Text style={styles.cancelBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: "#dc2626" }]}
                onPress={() => viewContact && handleDelete(viewContact.id)}
              >
                <Text style={styles.saveBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const ITEM_SIZE = "33.3%" as const;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#080f08" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#080f08" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: { fontSize: 22, fontWeight: "800", color: "#fff" },
  addButton: {
    backgroundColor: "#39ff14",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    shadowColor: "#39ff14",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  addButtonText: { color: "#000", fontWeight: "700", fontSize: 13 },
  grid: { paddingHorizontal: 12, paddingBottom: 20 },
  contactCard: {
    width: ITEM_SIZE,
    backgroundColor: "#0d1a0d",
    borderWidth: 1,
    borderColor: "#1a2e1a",
    borderRadius: 14,
    padding: 10,
    margin: 4,
    alignItems: "center",
  },
  avatar: { width: 52, height: 52, borderRadius: 26, marginBottom: 8, borderWidth: 2, borderColor: "#1a2e1a" },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(57,255,20,0.1)",
    borderWidth: 2,
    borderColor: "#1a2e1a",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  avatarPlaceholderText: { fontSize: 22 },
  contactName: { fontSize: 13, fontWeight: "700", color: "#fff", textAlign: "center" },
  contactDetail: { fontSize: 11, color: "#555", textAlign: "center", marginTop: 2 },
  cardActions: { flexDirection: "row", marginTop: 6, gap: 4 },
  actionBtn: { padding: 3 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  emptyIcon: { fontSize: 64, opacity: 0.2, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#fff", marginBottom: 6 },
  emptyDesc: { fontSize: 14, color: "#555", marginBottom: 20 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "flex-end" },
  modalContent: {
    backgroundColor: "#0d1a0d",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1a2e1a",
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#fff", flex: 1 },
  closeBtn: { color: "#555", fontSize: 18, padding: 4 },
  inputLabel: { fontSize: 12, color: "#666", marginBottom: 4 },
  input: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#1a2e1a",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 14,
    marginBottom: 10,
  },
  error: { color: "#f87171", fontSize: 12, marginBottom: 8 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: "#1a2e1a", alignItems: "center" },
  cancelBtnText: { color: "#888", fontSize: 14 },
  saveBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: "#39ff14", alignItems: "center" },
  btnDisabled: { opacity: 0.5 },
  saveBtnText: { color: "#000", fontSize: 14, fontWeight: "700" },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#111",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#1a2e1a",
  },
  detailIcon: { fontSize: 16 },
  detailText: { color: "#ccc", fontSize: 14, flex: 1 },
});
