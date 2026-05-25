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

import { ContactForm } from "../../../components/ContactForm";
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

export default function ContactDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { notify } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<{
    name: string;
    phone: string;
    telegram_username: string;
    description: string;
    avatar_url: string | null;
    avatar_path: string | null;
  } | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await api.contacts.get(id);
        setValues({
          name: data.name,
          phone: data.phone ?? "",
          telegram_username: data.telegram_username ?? "",
          description: data.description ?? "",
          avatar_url: data.avatar_url,
          avatar_path: storagePathFromUrl(data.avatar_url),
        });
      } catch (error) {
        notify(
          error instanceof ApiError ? error.message : "Failed to load.",
          "error"
        );
        router.replace("/(app)/contacts");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, notify, router]);

  function confirmDelete() {
    if (!id) return;
    Alert.alert("Delete this contact?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.contacts.delete(id);
            notify("Contact deleted.", "success");
            router.replace("/(app)/contacts");
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
        <ContactForm
          initial={values}
          submitLabel="Save changes"
          submitting={saving}
          onDelete={confirmDelete}
          onSubmit={async (next) => {
            if (!id) return;
            setSaving(true);
            try {
              await api.contacts.update(id, {
                name: next.name.trim(),
                phone: next.phone.trim() || null,
                telegram_username: next.telegram_username.trim() || null,
                description: next.description.trim() || null,
                avatar_path: next.avatar_path,
              });
              setValues(next);
              notify("Contact updated.", "success");
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
