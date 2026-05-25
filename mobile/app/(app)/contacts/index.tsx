import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../../../components/Button";
import { EmptyState } from "../../../components/EmptyState";
import { Header } from "../../../components/Header";
import { useToast } from "../../../components/Toast";
import { ApiError, api } from "../../../lib/api";
import { colors, radii, spacing } from "../../../lib/theme";
import type { Contact } from "../../../lib/types";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ContactsIndex() {
  const router = useRouter();
  const { notify } = useToast();
  const [items, setItems] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(showSpinner = true) {
    if (showSpinner) setLoading(true);
    try {
      setItems(await api.contacts.list());
    } catch (error) {
      notify(
        error instanceof ApiError ? error.message : "Failed to load.",
        "error"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: spacing.lg, flex: 1 }}>
        <Header
          title="Contacts"
          subtitle="Phone or Telegram required."
          right={
            <Button
              label="+ New"
              onPress={() => router.push("/(app)/contacts/new")}
            />
          }
        />
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.neon} />
          </View>
        ) : items.length === 0 ? (
          <EmptyState
            icon="☎"
            title="No contacts yet"
            description="Add the people that matter."
            action={
              <Button
                label="Add a contact"
                onPress={() => router.push("/(app)/contacts/new")}
              />
            }
          />
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={{ gap: spacing.md }}
            contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xxl }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  void load(false);
                }}
                tintColor={colors.neon}
              />
            }
            renderItem={({ item }) => (
              <Pressable
                style={styles.card}
                onPress={() => router.push(`/(app)/contacts/${item.id}`)}
              >
                <View style={styles.avatar}>
                  {item.avatar_url ? (
                    <Image
                      source={{ uri: item.avatar_url }}
                      style={{ width: "100%", height: "100%" }}
                    />
                  ) : (
                    <Text style={styles.initials}>{initials(item.name)}</Text>
                  )}
                </View>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.sub} numberOfLines={1}>
                  {item.phone ||
                    (item.telegram_username
                      ? `@${item.telegram_username.replace(/^@/, "")}`
                      : "")}
                </Text>
              </Pressable>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: "center",
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  initials: { color: colors.neon, fontWeight: "700", fontSize: 18 },
  name: { color: colors.text, fontWeight: "600", fontSize: 14 },
  sub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
