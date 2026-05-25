import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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
import type { Note } from "../../../lib/types";

export default function NotesIndex() {
  const router = useRouter();
  const { notify } = useToast();
  const [items, setItems] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(showSpinner = true) {
    if (showSpinner) setLoading(true);
    try {
      setItems(await api.notes.list());
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
          title="Notes"
          subtitle="Encrypted thoughts and todos."
          right={
            <Button
              label="+ New"
              onPress={() => router.push("/(app)/notes/new")}
            />
          }
        />
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.neon} />
          </View>
        ) : items.length === 0 ? (
          <EmptyState
            icon="✎"
            title="No notes yet"
            description="Tap + New to capture your first encrypted thought."
            action={
              <Button
                label="Create note"
                onPress={() => router.push("/(app)/notes/new")}
              />
            }
          />
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
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
                style={styles.row}
                onPress={() => router.push(`/(app)/notes/${item.id}`)}
              >
                <Text style={styles.title} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.preview} numberOfLines={3}>
                  {item.content || "(empty)"}
                </Text>
                <Text style={styles.meta}>
                  Updated {new Date(item.updated_at).toLocaleString()}
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
  row: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  title: { color: colors.text, fontWeight: "700", fontSize: 16 },
  preview: { color: colors.textMuted, marginTop: 6, fontSize: 13 },
  meta: { color: colors.textFaint, marginTop: 8, fontSize: 11 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
