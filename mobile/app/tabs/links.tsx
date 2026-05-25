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
  Linking,
  RefreshControl,
} from "react-native";
import Animated, { FadeIn, Layout } from "react-native-reanimated";
import { Link } from "@/lib/types";
import { linksApi } from "@/lib/api";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function LinksTab() {
  const [links, setLinks] = useState<Link[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editLink, setEditLink] = useState<Link | null>(null);
  const [viewLink, setViewLink] = useState<Link | null>(null);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchLinks = useCallback(async () => {
    try {
      const res = await linksApi.list();
      setLinks(res.data);
    } catch {
      setLinks([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const openCreate = () => {
    setEditLink(null);
    setTitle("");
    setUrl("");
    setDescription("");
    setError("");
    setModalVisible(true);
  };

  const openEdit = (l: Link) => {
    setEditLink(l);
    setTitle(l.title);
    setUrl(l.url);
    setDescription(l.description || "");
    setError("");
    setViewModalVisible(false);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !url.trim()) {
      setError("Title and URL are required");
      return;
    }
    setError("");
    setIsSaving(true);
    try {
      const payload = {
        title: title.trim(),
        url: url.trim(),
        description: description.trim() || undefined,
      };
      if (editLink) {
        await linksApi.update(editLink.id, payload);
      } else {
        await linksApi.create(payload);
      }
      setModalVisible(false);
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
      setViewModalVisible(false);
    } catch {}
  };

  const renderLink = ({ item, index }: { item: Link; index: number }) => (
    <AnimatedTouchable
      entering={FadeIn.delay(index * 50)}
      layout={Layout}
      style={styles.linkCard}
      onPress={() => {
        setViewLink(item);
        setViewModalVisible(true);
      }}
      activeOpacity={0.85}
    >
      <View style={styles.linkImageContainer}>
        {item.image ? (
          <Image
            source={{ uri: item.image.url }}
            style={styles.linkImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.linkImagePlaceholder}>
            <Text style={styles.linkImagePlaceholderText}>🔗</Text>
          </View>
        )}
      </View>
      <View style={styles.linkContent}>
        <Text style={styles.linkTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.linkUrl} numberOfLines={1}>{item.url}</Text>
        <View style={styles.linkActions}>
          <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionBtn}>
            <Text>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionBtn}>
            <Text>🗑️</Text>
          </TouchableOpacity>
        </View>
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
        <Text style={styles.sectionTitle}>Links</Text>
        <TouchableOpacity style={styles.addButton} onPress={openCreate} activeOpacity={0.85}>
          <Text style={styles.addButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {links.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔗</Text>
          <Text style={styles.emptyTitle}>No links saved</Text>
          <Text style={styles.emptyDesc}>Build your encrypted link library</Text>
          <TouchableOpacity style={styles.addButton} onPress={openCreate}>
            <Text style={styles.addButtonText}>+ Save Link</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={links}
          keyExtractor={(item) => item.id}
          renderItem={renderLink}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchLinks();
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
                {editLink ? "Edit Link" : "New Link"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.inputLabel}>Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Link title"
              placeholderTextColor="#444"
              autoFocus
            />
            <Text style={styles.inputLabel}>URL *</Text>
            <TextInput
              style={styles.input}
              value={url}
              onChangeText={setUrl}
              placeholder="https://example.com"
              placeholderTextColor="#444"
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="Optional description..."
              placeholderTextColor="#444"
            />
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
                  <Text style={styles.saveBtnText}>{editLink ? "Save" : "Create"}</Text>
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
              <Text style={[styles.modalTitle, { flex: 1 }]} numberOfLines={2}>
                {viewLink?.title}
              </Text>
              <TouchableOpacity onPress={() => setViewModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            {viewLink && (
              <>
                {viewLink.image && (
                  <Image
                    source={{ uri: viewLink.image.url }}
                    style={styles.viewImage}
                    resizeMode="cover"
                  />
                )}
                <TouchableOpacity
                  onPress={() => Linking.openURL(viewLink.url)}
                  style={styles.urlRow}
                >
                  <Text style={styles.urlText} numberOfLines={2}>{viewLink.url}</Text>
                  <Text style={styles.urlIcon}>↗</Text>
                </TouchableOpacity>
                {viewLink.description && (
                  <Text style={styles.viewDesc}>{viewLink.description}</Text>
                )}
              </>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => viewLink && openEdit(viewLink)}
              >
                <Text style={styles.cancelBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: "#dc2626" }]}
                onPress={() => viewLink && handleDelete(viewLink.id)}
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
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  linkCard: {
    backgroundColor: "#0d1a0d",
    borderWidth: 1,
    borderColor: "#1a2e1a",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 10,
    flexDirection: "row",
  },
  linkImageContainer: { width: 80 },
  linkImage: { width: 80, height: 80 },
  linkImagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  linkImagePlaceholderText: { fontSize: 28, opacity: 0.3 },
  linkContent: { flex: 1, padding: 12 },
  linkTitle: { fontSize: 14, fontWeight: "700", color: "#fff", marginBottom: 4 },
  linkUrl: { fontSize: 11, color: "#39ff14", opacity: 0.6 },
  linkActions: { flexDirection: "row", marginTop: 6, gap: 6 },
  actionBtn: { padding: 2 },
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
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
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
  viewImage: { width: "100%", height: 160, borderRadius: 10, marginBottom: 12 },
  urlRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#1a2e1a",
  },
  urlText: { flex: 1, color: "#39ff14", fontSize: 13 },
  urlIcon: { color: "#39ff14", fontSize: 16, marginLeft: 6 },
  viewDesc: { color: "#888", fontSize: 13, marginBottom: 8 },
});
