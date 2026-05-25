import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AvatarPicker } from "./AvatarPicker";
import { Button } from "./Button";
import { Field } from "./Field";
import { colors, spacing } from "../lib/theme";

export type LinkFormValues = {
  title: string;
  url: string;
  description: string;
  image_url: string | null;
  image_path: string | null;
};

export function LinkForm({
  initial,
  submitLabel,
  submitting,
  onSubmit,
  onDelete,
}: {
  initial: LinkFormValues;
  submitLabel: string;
  submitting: boolean;
  onSubmit: (values: LinkFormValues) => Promise<void> | void;
  onDelete?: () => void;
}) {
  const [values, setValues] = useState<LinkFormValues>(initial);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof LinkFormValues>(
    key: K,
    value: LinkFormValues[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    setError(null);
    if (!values.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!values.url.trim()) {
      setError("URL is required.");
      return;
    }
    await onSubmit(values);
  }

  return (
    <View>
      <AvatarPicker
        url={values.image_url}
        fallback="🔗"
        onChange={({ url, storagePath }) => {
          update("image_url", url);
          update("image_path", storagePath);
        }}
      />
      <Field
        label="Title"
        value={values.title}
        onChangeText={(value) => update("title", value)}
        maxLength={200}
      />
      <Field
        label="URL"
        value={values.url}
        onChangeText={(value) => update("url", value)}
        keyboardType="url"
        autoCapitalize="none"
        maxLength={2048}
        placeholder="https://example.com"
      />
      <Field
        label="Description"
        value={values.description}
        onChangeText={(value) => update("description", value)}
        multiline
        style={{ minHeight: 100, textAlignVertical: "top" }}
        maxLength={2000}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
        <Button label={submitLabel} loading={submitting} onPress={handleSubmit} />
        {onDelete ? (
          <Button label="Delete link" variant="danger" onPress={onDelete} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  error: {
    backgroundColor: colors.dangerSoft,
    color: colors.danger,
    padding: spacing.sm,
    borderRadius: 12,
    fontSize: 13,
  },
});
