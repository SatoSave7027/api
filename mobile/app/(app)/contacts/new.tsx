import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ContactForm } from "../../../components/ContactForm";
import { useToast } from "../../../components/Toast";
import { ApiError, api } from "../../../lib/api";
import { colors, spacing } from "../../../lib/theme";

export default function NewContact() {
  const router = useRouter();
  const { notify } = useToast();
  const [submitting, setSubmitting] = useState(false);

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <ContactForm
          initial={{
            name: "",
            phone: "",
            telegram_username: "",
            description: "",
            avatar_url: null,
            avatar_path: null,
          }}
          submitLabel="Save contact"
          submitting={submitting}
          onSubmit={async (values) => {
            setSubmitting(true);
            try {
              const created = await api.contacts.create({
                name: values.name.trim(),
                phone: values.phone.trim() || null,
                telegram_username: values.telegram_username.trim() || null,
                description: values.description.trim() || null,
                avatar_path: values.avatar_path,
              });
              notify("Contact saved.", "success");
              router.replace(`/(app)/contacts/${created.id}`);
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
