"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { LinkForm } from "@/components/LinkForm";
import { Card, PageTitle } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { ApiError, api } from "@/lib/api";

export default function NewLinkPage() {
  const router = useRouter();
  const { notify } = useToast();
  const [submitting, setSubmitting] = useState(false);

  return (
    <div>
      <PageTitle title="New link" />
      <Card>
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
          onCancel={() => router.back()}
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
              router.replace(`/dashboard/links/${created.id}`);
            } catch (error) {
              const message =
                error instanceof ApiError
                  ? error.message
                  : "Failed to save link.";
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
