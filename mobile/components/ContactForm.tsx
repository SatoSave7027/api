import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "./Button";
import { AvatarPicker } from "./AvatarPicker";
import { Field } from "./Field";
import { colors, spacing } from "../lib/theme";

export type ContactFormValues = {
  name: string;
  phone: string;
  telegram_username: string;
  description: string;
  avatar_url: string | null;
  avatar_path: string | null;
};

export function ContactForm({
  initial,
  submitLabel,
  submitting,
  onSubmit,
  onDelete,
}: {
  initial: ContactFormValues;
  submitLabel: string;
  submitting: boolean;
  onSubmit: (values: ContactFormValues) => Promise<void> | void;
  onDelete?: () => void;
}) {
  const [values, setValues] = useState<ContactFormValues>(initial);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof ContactFormValues>(
    key: K,
    value: ContactFormValues[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    setError(null);
    if (!values.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!values.phone.trim() && !values.telegram_username.trim()) {
      setError("Provide either a phone or a Telegram username.");
      return;
    }
    await onSubmit(values);
  }

  return (
    <View>
      <AvatarPicker
        url={values.avatar_url}
        fallback={values.name.slice(0, 2).toUpperCase() || "?"}
        onChange={({ url, storagePath }) => {
          update("avatar_url", url);
          update("avatar_path", storagePath);
        }}
      />
      <Field
        label="Name"
        value={values.name}
        onChangeText={(value) => update("name", value)}
        maxLength={120}
      />
      <Field
        label="Phone"
        value={values.phone}
        onChangeText={(value) => update("phone", value)}
        keyboardType="phone-pad"
        maxLength={40}
        placeholder="+1 555 010 0123"
      />
      <Field
        label="Telegram username"
        value={values.telegram_username}
        onChangeText={(value) => update("telegram_username", value)}
        maxLength={64}
        autoCapitalize="none"
        placeholder="@username"
      />
      <Field
        label="Description"
        value={values.description}
        onChangeText={(value) => update("description", value)}
        multiline
        maxLength={2000}
        style={{ minHeight: 100, textAlignVertical: "top" }}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
        <Button label={submitLabel} loading={submitting} onPress={handleSubmit} />
        {onDelete ? (
          <Button label="Delete contact" variant="danger" onPress={onDelete} />
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
