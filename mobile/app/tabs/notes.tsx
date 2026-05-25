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
  ScrollView,
  RefreshControl,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  Layout,
} from "react-native-reanimated";
import { Note } from "@/lib/types";
import { notesApi } from "@/lib/api";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function NotesTab() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [viewNote, setViewNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchNotes = useCallback(async () => {
    try {
      const res = await notesApi.list();
      setNotes(res.data);
    } catch {
      setNotes([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const openCreate = () => {
    setEditNote(null);
    setTitle("");
    setContent("");
    setError("");
    setModalVisible(true);
  };

  const openEdit = (note: Note) => {
    setEditNote(note);
    setTitle(note.title);
    setContent(note.content);
    setError("");
    setViewModalVisible(false);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required");
      return;
    }
    setError("");
    setIsSaving(true);
    try {
      if (editNote) {
        await notesApi.update(editNote.id, { title, content });
      } else {
        await notesApi.create({ title, content });
      }
      setModalVisible(false);
      await fetchNotes();
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
      await notesApi.delete(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      setViewModalVisible(false);
    } catch {}
  };

  const renderNote = ({ item, index }: { item: Note; index: number }) => (
    <AnimatedTouchable
      entering={FadeIn.delay(index * 50)}
      layout={Layout}
      style={styles.noteCard}
      onPress={() => {
        setViewNote(item);
        setViewModalVisible(true);
      }}
      activeOpacity={0.85}
    >
      <Text style={styles.noteTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.noteContent} numberOfLines={3}>
        {item.content}
      </Text>
      <View style={styles.noteFooter}>
        <Text style={styles.noteDate}>
          {new Date(item.updated_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </Text>
        <View style={styles.noteActions}>
          <TouchableOpacity
            onPress={() => openEdit(item)}
            style={styles.actionBtn}
          >
            <Text style={styles.editText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDelete(item.id)}
            style={styles.actionBtn}
          >
            <Text style={styles.deleteText}>🗑️</Text>
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
        <Text style={styles.sectionTitle}>Notes</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={openCreate}
          activeOpacity={0.85}
        >
          <Text style={styles.addButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {notes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyTitle}>No notes yet</Text>
          <Text style={styles.emptyDesc}>Create your first encrypted note</Text>
          <TouchableOpacity style={styles.addButton} onPress={openCreate}>
            <Text style={styles.addButtonText}>+ Create Note</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          renderItem={renderNote}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchNotes();
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
                {editNote ? "Edit Note" : "New Note"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Note title"
              placeholderTextColor="#444"
              autoFocus
            />
            <Text style={styles.inputLabel}>Content</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={content}
              onChangeText={setContent}
              placeholder="Write your note..."
              placeholderTextColor="#444"
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
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
                  <Text style={styles.saveBtnText}>
                    {editNote ? "Save" : "Create"}
                  </Text>
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
                {viewNote?.title}
              </Text>
              <TouchableOpacity onPress={() => setViewModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.viewContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.viewText}>{viewNote?.content}</Text>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => viewNote && openEdit(viewNote)}
              >
                <Text style={styles.cancelBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: "#dc2626" }]}
                onPress={() => viewNote && handleDelete(viewNote.id)}
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
  container: {
    flex: 1,
    backgroundColor: "#080f08",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#080f08",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
  },
  addButton: {
    backgroundColor: "#39ff14",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: "#39ff14",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  addButtonText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 14,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  noteCard: {
    backgroundColor: "#0d1a0d",
    borderWidth: 1,
    borderColor: "#1a2e1a",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 6,
  },
  noteContent: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
    marginBottom: 10,
  },
  noteFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  noteDate: {
    fontSize: 11,
    color: "#333",
  },
  noteActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    padding: 4,
  },
  editText: {
    fontSize: 14,
  },
  deleteText: {
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  emptyIcon: {
    fontSize: 64,
    opacity: 0.2,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 14,
    color: "#555",
    marginBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
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
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  closeBtn: {
    color: "#555",
    fontSize: 18,
    padding: 4,
  },
  inputLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#1a2e1a",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#fff",
    fontSize: 15,
    marginBottom: 12,
  },
  textArea: {
    height: 120,
    paddingTop: 12,
  },
  error: {
    color: "#f87171",
    fontSize: 13,
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1a2e1a",
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#888",
    fontSize: 15,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: "#39ff14",
    alignItems: "center",
  },
  btnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "700",
  },
  viewContent: {
    maxHeight: 300,
    backgroundColor: "#111",
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#1a2e1a",
  },
  viewText: {
    color: "#ccc",
    fontSize: 15,
    lineHeight: 22,
  },
});
