import { Stack } from "expo-router";

import { colors } from "../../lib/theme";

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { color: colors.text },
        headerTintColor: colors.neon,
        contentStyle: { backgroundColor: colors.bg },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="home" options={{ title: "SatoSave Vault" }} />
      <Stack.Screen name="notes/index" options={{ title: "Notes" }} />
      <Stack.Screen name="notes/new" options={{ title: "New note" }} />
      <Stack.Screen name="notes/[id]" options={{ title: "Note" }} />
      <Stack.Screen
        name="contacts/index"
        options={{ title: "Contacts" }}
      />
      <Stack.Screen
        name="contacts/new"
        options={{ title: "New contact" }}
      />
      <Stack.Screen name="contacts/[id]" options={{ title: "Contact" }} />
      <Stack.Screen name="links/index" options={{ title: "Links" }} />
      <Stack.Screen name="links/new" options={{ title: "New link" }} />
      <Stack.Screen name="links/[id]" options={{ title: "Link" }} />
    </Stack>
  );
}
