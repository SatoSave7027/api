import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LinkForm } from "../../../components/LinkForm";
import { useToast } from "../../../components/Toast";
import { ApiError, api } from "../../../lib/api";
import { colors, spacing } from "../../../lib/theme";

function storagePathFromUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).pathname.replace(/^\//, "");
  } catch {
    return null;
  }
}

export default function LinkDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { notify } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<{
    title: string;
    url: string;
    description: string;
    image_url: string | null;
    image_path: string | null;
  } | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await api.links.get(id);
        setValues({
          title: data.title,
          url: data.url,
          description: data.description ?? "",
          image_url: data.image_url,
          image_path: storagePathFromUrl(data.image_url),
        });
      } catch (error) {
        notify(
          error instanceof ApiError ? error.message : "Failed to load.",
          "error"
        );
        router.replace("/(app)/links");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, notify, router]);

  function confirmDelete() {
    if (!id) return;
    Alert.alert("Delete this link?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.links.delete(id);
            notify("Link deleted.", "success");
            router.replace("/(app)/links");
          } catch (error) {
            notify(
              error instanceof ApiError ? error.message : "Failed to delete.",
              "error"
            );
          }
        },
      },
    ]);
  }

  if (loading || !values) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.neon} />
      </View>
    );
  }

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <LinkForm
          initial={values}
          submitLabel="Save changes"
          submitting={saving}
          onDelete={confirmDelete}
          onSubmit={async (next) => {
            if (!id) return;
            setSaving(true);
            try {
              await api.links.update(id, {
                title: next.title.trim(),
                url: next.url.trim(),
                description: next.description.trim() || null,
                image_path: next.image_path,
              });
              setValues(next);
              notify("Link updated.", "success");
            } catch (error) {
              notify(
                error instanceof ApiError ? error.message : "Failed to save.",
                "error"
              );
            } finally {
              setSaving(false);
            }
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
});
