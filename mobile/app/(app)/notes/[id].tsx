import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../../../components/Button";
import { Field } from "../../../components/Field";
import { useToast } from "../../../components/Toast";
import { ApiError, api } from "../../../lib/api";
import { colors, spacing } from "../../../lib/theme";

export default function NoteDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { notify } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await api.notes.get(id);
        setTitle(data.title);
        setContent(data.content);
      } catch (error) {
        notify(
          error instanceof ApiError ? error.message : "Failed to load.",
          "error"
        );
        router.replace("/(app)/notes");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, notify, router]);

  async function handleSave() {
    if (!id) return;
    if (!title.trim()) {
      notify("Title is required.", "error");
      return;
    }
    setSaving(true);
    try {
      await api.notes.update(id, { title: title.trim(), content });
      notify("Note updated.", "success");
    } catch (error) {
      notify(
        error instanceof ApiError ? error.message : "Failed to save.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    if (!id) return;
    Alert.alert("Delete this note?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.notes.delete(id);
            notify("Note deleted.", "success");
            router.replace("/(app)/notes");
          } catch (error) {
            notify(
              error instanceof ApiError ? error.message : "Failed to delete.",
              "error"
            );
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.neon} />
      </View>
    );
  }

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Field
          label="Title"
          value={title}
          onChangeText={setTitle}
          maxLength={255}
        />
        <Field
          label="Content"
          value={content}
          onChangeText={setContent}
          multiline
          style={{ minHeight: 240, textAlignVertical: "top" }}
        />
        <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
          <Button label="Save changes" onPress={handleSave} loading={saving} />
          <Button label="Delete note" variant="danger" onPress={confirmDelete} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
});
