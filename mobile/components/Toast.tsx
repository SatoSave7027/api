import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing } from "../lib/theme";

type Kind = "success" | "error" | "info";

type Item = { id: number; kind: Kind; message: string };

type Ctx = { notify: (message: string, kind?: Kind) => void };

const ToastContext = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);
  const notify = useCallback(
    (message: string, kind: Kind = "info") => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setItems((prev) => [...prev, { id, kind, message }]);
      setTimeout(() => remove(id), 3800);
    },
    [remove]
  );
  const value = useMemo(() => ({ notify }), [notify]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <View pointerEvents="none" style={styles.layer}>
        {items.map((item) => (
          <ToastView key={item.id} item={item} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

function ToastView({ item }: { item: Item }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-12)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 6,
        tension: 180,
      }),
    ]).start();
  }, [opacity, translateY]);
  const tint =
    item.kind === "success"
      ? colors.neon
      : item.kind === "error"
      ? colors.danger
      : colors.aqua;
  return (
    <Animated.View
      style={[
        styles.toast,
        { borderColor: tint + "55", opacity, transform: [{ translateY }] },
      ]}
    >
      <Text style={{ color: tint, fontSize: 13 }}>{item.message}</Text>
    </Animated.View>
  );
}

export function useToast(): Ctx {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

const styles = StyleSheet.create({
  layer: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 8,
    pointerEvents: "none",
  },
  toast: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    marginBottom: 8,
    maxWidth: 340,
  },
});
