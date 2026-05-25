import { useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors, radii, spacing } from "../lib/theme";

type Variant = "primary" | "ghost" | "danger";

type Props = {
  label: string;
  onPress?: (event: GestureResponderEvent) => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  loading,
  disabled,
  style,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const isDisabled = loading || disabled;

  function animateTo(value: number) {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      friction: 6,
      tension: 220,
    }).start();
  }

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => animateTo(0.97)}
        onPressOut={() => animateTo(1)}
        disabled={isDisabled}
        style={[styles.base, styles[variant], isDisabled && styles.disabled]}
      >
        <View style={styles.row}>
          {loading && (
            <ActivityIndicator
              size="small"
              color={variant === "primary" ? colors.bg : colors.neon}
            />
          )}
          <Text style={[styles.text, styles[`${variant}Text` as const]]}>
            {label}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  text: {
    fontSize: 15,
    fontWeight: "700",
  },
  primary: {
    backgroundColor: colors.neon,
    shadowColor: colors.neon,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  primaryText: {
    color: colors.bg,
  },
  ghost: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghostText: {
    color: colors.neon,
  },
  danger: {
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  dangerText: {
    color: colors.danger,
  },
  disabled: {
    opacity: 0.5,
  },
});
