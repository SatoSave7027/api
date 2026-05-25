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
import type { LinkItem } from "../../../lib/types";

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function LinksIndex() {
  const router = useRouter();
  const { notify } = useToast();
  const [items, setItems] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(showSpinner = true) {
    if (showSpinner) setLoading(true);
    try {
      setItems(await api.links.list());
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
          title="Links"
          subtitle="Encrypted bookmarks."
          right={
            <Button
              label="+ New"
              onPress={() => router.push("/(app)/links/new")}
            />
          }
        />
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.neon} />
          </View>
        ) : items.length === 0 ? (
          <EmptyState
            icon="⇪"
            title="No links yet"
            description="Save a URL with a preview and description."
            action={
              <Button
                label="Save a link"
                onPress={() => router.push("/(app)/links/new")}
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
                onPress={() => router.push(`/(app)/links/${item.id}`)}
              >
                <View style={styles.thumb}>
                  {item.image_url ? (
                    <Image
                      source={{ uri: item.image_url }}
                      style={{ width: "100%", height: "100%" }}
                    />
                  ) : (
                    <Text style={{ color: colors.neon, fontSize: 22 }}>⇪</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.host}>{hostnameOf(item.url)}</Text>
                  {item.description ? (
                    <Text style={styles.desc} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}
                </View>
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
    flexDirection: "row",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: "center",
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: colors.text, fontWeight: "600", fontSize: 14 },
  host: { color: colors.aqua, fontSize: 11, marginTop: 2 },
  desc: { color: colors.textMuted, marginTop: 4, fontSize: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
