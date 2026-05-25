"use client";

import { useState, useEffect } from "react";
import { Link as LinkType } from "@/lib/types";
import { linksApi, uploadsApi } from "@/lib/api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { PhotoIcon } from "@heroicons/react/24/outline";

interface LinkFormProps {
  link?: LinkType | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function LinkForm({ link, onSuccess, onCancel }: LinkFormProps) {
  const [title, setTitle] = useState(link?.title || "");
  const [url, setUrl] = useState(link?.url || "");
  const [description, setDescription] = useState(link?.description || "");
  const [imageId, setImageId] = useState(link?.image_id || "");
  const [imageUrl, setImageUrl] = useState(link?.image?.url || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setTitle(link?.title || "");
    setUrl(link?.url || "");
    setDescription(link?.description || "");
    setImageId(link?.image_id || "");
    setImageUrl(link?.image?.url || "");
  }, [link]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await uploadsApi.upload(file);
      setImageId(res.data.id);
      setImageUrl(res.data.url);
    } catch {
      setError("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const payload = {
        title,
        url,
        description: description || undefined,
        image_id: imageId || undefined,
      };
      if (link) {
        await linksApi.update(link.id, payload);
      } else {
        await linksApi.create(payload);
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
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1.5">
          Image (optional)
        </label>
        <label className="cursor-pointer block">
          <div
            className="h-32 border-2 border-dashed border-[#1a2e1a] rounded-xl overflow-hidden
                          hover:border-[#39ff14]/40 transition-colors relative flex items-center justify-center"
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-600 hover:text-[#39ff14]/60 transition-colors">
                <PhotoIcon className="w-8 h-8" />
                <span className="text-sm">Click to upload</span>
              </div>
            )}
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-[#39ff14] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
            disabled={isUploading}
          />
        </label>
      </div>

      <Input
        id="link-title"
        label="Title *"
        placeholder="Link title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        autoFocus
      />
      <Input
        id="link-url"
        label="URL *"
        type="url"
        placeholder="https://example.com"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        required
      />
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1.5">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description..."
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
          {link ? "Save Changes" : "Save Link"}
        </Button>
      </div>
    </form>
  );
}
