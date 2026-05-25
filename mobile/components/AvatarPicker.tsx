import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { ApiError, api } from "../lib/api";
import { colors, radii, spacing } from "../lib/theme";
import { Button } from "./Button";
import { useToast } from "./Toast";

type Props = {
  url: string | null;
  fallback: string;
  onChange: (next: { url: string | null; storagePath: string | null }) => void;
};

export function AvatarPicker({ url, fallback, onChange }: Props) {
  const { notify } = useToast();
  const [uploading, setUploading] = useState(false);

  async function handlePick() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      notify("Permission denied for photos.", "error");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      const filename = asset.fileName || `image_${Date.now()}.jpg`;
      const type = asset.mimeType || "image/jpeg";
      const uploaded = await api.uploads.upload(asset.uri, filename, type);
      onChange({ url: uploaded.url, storagePath: uploaded.storage_path });
      notify("Image uploaded.", "success");
    } catch (error) {
      notify(
        error instanceof ApiError ? error.message : "Upload failed.",
        "error"
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        {url ? (
          <Image source={{ uri: url }} style={styles.image} />
        ) : (
          <Text style={styles.fallback}>{fallback}</Text>
        )}
      </View>
      <View style={styles.actions}>
        <Button
          label={url ? "Change image" : "Upload image"}
          variant="ghost"
          loading={uploading}
          onPress={handlePick}
        />
        {url ? (
          <Button
            label="Remove"
            variant="danger"
            onPress={() => onChange({ url: null, storagePath: null })}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: radii.xl,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  image: { width: "100%", height: "100%" },
  fallback: { color: colors.neon, fontSize: 24, fontWeight: "700" },
  actions: { flex: 1, gap: spacing.sm },
});
