import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/lib/auth-context";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <StatusBar style="light" backgroundColor="#080f08" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: "#080f08" },
            headerTintColor: "#39ff14",
            headerTitleStyle: { color: "#fff", fontWeight: "700" },
            contentStyle: { backgroundColor: "#080f08" },
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="tabs" options={{ headerShown: false }} />
        </Stack>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
