"use client";

import { useState, useEffect } from "react";
import { Contact } from "@/lib/types";
import { contactsApi, uploadsApi } from "@/lib/api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { UserIcon } from "@heroicons/react/24/outline";

interface ContactFormProps {
  contact?: Contact | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ContactForm({ contact, onSuccess, onCancel }: ContactFormProps) {
  const [name, setName] = useState(contact?.name || "");
  const [phone, setPhone] = useState(contact?.phone || "");
  const [telegram, setTelegram] = useState(contact?.telegram_username || "");
  const [description, setDescription] = useState(contact?.description || "");
  const [avatarId, setAvatarId] = useState(contact?.avatar_id || "");
  const [avatarUrl, setAvatarUrl] = useState(contact?.avatar?.url || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setName(contact?.name || "");
    setPhone(contact?.phone || "");
    setTelegram(contact?.telegram_username || "");
    setDescription(contact?.description || "");
    setAvatarId(contact?.avatar_id || "");
    setAvatarUrl(contact?.avatar?.url || "");
  }, [contact]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await uploadsApi.upload(file);
      setAvatarId(res.data.id);
      setAvatarUrl(res.data.url);
    } catch {
      setError("Failed to upload avatar");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!phone && !telegram) {
      setError("At least phone or Telegram username is required");
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        name,
        phone: phone || undefined,
        telegram_username: telegram || undefined,
        description: description || undefined,
        avatar_id: avatarId || undefined,
      };
      if (contact) {
        await contactsApi.update(contact.id, payload);
      } else {
        await contactsApi.create(payload);
      }
      onSuccess();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex justify-center mb-2">
        <label className="cursor-pointer group">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#1a2e1a] group-hover:border-[#39ff14]/50 transition-colors relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[#39ff14]/10 flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-[#39ff14]/50" />
              </div>
            )}
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-[#39ff14] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
            disabled={isUploading}
          />
          <p className="text-xs text-gray-500 text-center mt-1 group-hover:text-[#39ff14] transition-colors">
            Upload photo
          </p>
        </label>
      </div>

      <Input
        id="contact-name"
        label="Name *"
        placeholder="Full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        autoFocus
      />
      <Input
        id="contact-phone"
        label="Phone"
        placeholder="+1 234 567 8900"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <Input
        id="contact-telegram"
        label="Telegram Username"
        placeholder="username (without @)"
        value={telegram}
        onChange={(e) => setTelegram(e.target.value)}
      />
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1.5">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional note about this contact..."
          rows={3}
          className="w-full bg-[#111] border border-[#1a2e1a] rounded-lg px-4 py-3
                     text-white placeholder-gray-600 resize-none
                     focus:outline-none focus:ring-2 focus:ring-[#39ff14] focus:border-transparent
                     transition-all duration-200"
        />
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button type="submit" className="flex-1" isLoading={isLoading}>
          {contact ? "Save Changes" : "Create Contact"}
        </Button>
      </div>
    </form>
  );
}
