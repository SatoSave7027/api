"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ContactForm } from "@/components/ContactForm";
import { Card, PageTitle } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { ApiError, api } from "@/lib/api";

export default function NewContactPage() {
  const router = useRouter();
  const { notify } = useToast();
  const [submitting, setSubmitting] = useState(false);

  return (
    <div>
      <PageTitle
        title="New contact"
        subtitle="Either phone or Telegram is required."
      />
      <Card>
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
          onCancel={() => router.back()}
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
              router.replace(`/dashboard/contacts/${created.id}`);
            } catch (error) {
              const message =
                error instanceof ApiError
                  ? error.message
                  : "Failed to save contact.";
              notify(message, "error");
            } finally {
              setSubmitting(false);
            }
          }}
        />
      </Card>
    </div>
  );
}
