import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../../../components/Button";
import { Field } from "../../../components/Field";
import { useToast } from "../../../components/Toast";
import { ApiError, api } from "../../../lib/api";
import { colors, spacing } from "../../../lib/theme";

export default function NewNote() {
  const router = useRouter();
  const { notify } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title.trim()) {
      notify("Title is required.", "error");
      return;
    }
    setSaving(true);
    try {
      const created = await api.notes.create({
        title: title.trim(),
        content,
      });
      notify("Note saved.", "success");
      router.replace(`/(app)/notes/${created.id}`);
    } catch (error) {
      notify(
        error instanceof ApiError ? error.message : "Failed to save.",
        "error"
      );
    } finally {
      setSaving(false);
    }
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
          style={{ minHeight: 200, textAlignVertical: "top" }}
        />
        <View style={{ marginTop: spacing.md }}>
          <Button label="Save note" onPress={handleSave} loading={saving} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
