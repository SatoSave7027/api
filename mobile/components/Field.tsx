import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

import { colors, radii, spacing } from "../lib/theme";

type Props = TextInputProps & {
  label?: string;
  hint?: string;
  errorText?: string | null;
};

export function Field({ label, hint, errorText, style, ...rest }: Props) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        placeholderTextColor={colors.textFaint}
        {...rest}
        style={[styles.input, errorText ? styles.inputError : null, style]}
      />
      {errorText ? (
        <Text style={styles.error}>{errorText}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.neon,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 15,
  },
  inputError: {
    borderColor: colors.danger,
  },
  hint: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textFaint,
  },
  error: {
    marginTop: 4,
    fontSize: 12,
    color: colors.danger,
  },
});
