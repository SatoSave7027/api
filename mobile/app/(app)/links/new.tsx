import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LinkForm } from "../../../components/LinkForm";
import { useToast } from "../../../components/Toast";
import { ApiError, api } from "../../../lib/api";
import { colors, spacing } from "../../../lib/theme";

export default function NewLink() {
  const router = useRouter();
  const { notify } = useToast();
  const [submitting, setSubmitting] = useState(false);
  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <LinkForm
          initial={{
            title: "",
            url: "",
            description: "",
            image_url: null,
            image_path: null,
          }}
          submitLabel="Save link"
          submitting={submitting}
          onSubmit={async (values) => {
            setSubmitting(true);
            try {
              const created = await api.links.create({
                title: values.title.trim(),
                url: values.url.trim(),
                description: values.description.trim() || null,
                image_path: values.image_path,
              });
              notify("Link saved.", "success");
              router.replace(`/(app)/links/${created.id}`);
            } catch (error) {
              notify(
                error instanceof ApiError ? error.message : "Failed to save.",
                "error"
              );
            } finally {
              setSubmitting(false);
            }
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
