import { StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing } from "../lib/theme";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.desc}>{description}</Text>
      {action ? <View style={{ marginTop: spacing.md }}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    gap: 6,
  },
  icon: {
    color: colors.neon,
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  desc: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
    maxWidth: 320,
  },
});
