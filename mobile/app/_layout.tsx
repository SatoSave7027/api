import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ToastProvider } from "../components/Toast";
import { AuthProvider, useAuth } from "../lib/auth";
import { colors } from "../lib/theme";

function RouteGuard() {
  const { user, hydrated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (user && inAuthGroup) {
      router.replace("/(app)/home");
    }
  }, [hydrated, user, segments, router]);

  if (!hydrated) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.bg,
        }}
      >
        <ActivityIndicator color={colors.neon} />
      </View>
    );
  }
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <AuthProvider>
          <ToastProvider>
            <StatusBar style="light" />
            <RouteGuard />
          </ToastProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
