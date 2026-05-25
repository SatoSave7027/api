import { useRouter } from "expo-router";
import { useRef, useEffect } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../../components/Button";
import { useToast } from "../../components/Toast";
import { useAuth } from "../../lib/auth";
import { colors, radii, spacing } from "../../lib/theme";

const sections: { route: "/(app)/notes" | "/(app)/contacts" | "/(app)/links"; title: string; description: string; icon: string }[] = [
  {
    route: "/(app)/notes",
    title: "Notes",
    description: "Encrypted text snippets.",
    icon: "✎",
  },
  {
    route: "/(app)/contacts",
    title: "Contacts",
    description: "People that matter.",
    icon: "☎",
  },
  {
    route: "/(app)/links",
    title: "Links",
    description: "Bookmarks with previews.",
    icon: "⇪",
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { notify } = useToast();
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [fade]);

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Animated.View style={{ opacity: fade }}>
          <Text style={styles.greeting}>Welcome back{user ? `,` : ""}</Text>
          {user ? <Text style={styles.email}>{user.email}</Text> : null}
          <Text style={styles.subtitle}>Pick a section to open.</Text>

          <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
            {sections.map((section) => (
              <Pressable
                key={section.route}
                onPress={() => router.push(section.route)}
                style={({ pressed }) => [
                  styles.tile,
                  pressed && { transform: [{ scale: 0.98 }] },
                ]}
              >
                <View style={styles.tileIcon}>
                  <Text style={{ color: colors.neon, fontSize: 22 }}>
                    {section.icon}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tileTitle}>{section.title}</Text>
                  <Text style={styles.tileDesc}>{section.description}</Text>
                </View>
                <Text style={{ color: colors.neon }}>›</Text>
              </Pressable>
            ))}
          </View>

          <View style={{ marginTop: spacing.xxl }}>
            <Button
              label="Logout"
              variant="ghost"
              onPress={async () => {
                await logout();
                notify("Signed out.", "success");
                router.replace("/(auth)/login");
              }}
            />
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  greeting: { color: colors.text, fontSize: 26, fontWeight: "700" },
  email: { color: colors.neon, marginTop: 2, fontSize: 14 },
  subtitle: { color: colors.textMuted, marginTop: spacing.sm, fontSize: 13 },
  tile: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  tileIcon: {
    width: 46,
    height: 46,
    borderRadius: radii.lg,
    backgroundColor: colors.neonSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  tileTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  tileDesc: { color: colors.textMuted, marginTop: 2, fontSize: 12 },
});
