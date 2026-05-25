import { Tabs } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { Text } from "react-native";

export default function TabsLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/auth");
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: "#080f08",
          borderTopColor: "#1a2e1a",
          paddingBottom: 4,
        },
        tabBarActiveTintColor: "#39ff14",
        tabBarInactiveTintColor: "#444",
        headerStyle: { backgroundColor: "#080f08" },
        headerTintColor: "#39ff14",
        headerTitleStyle: { color: "#fff", fontWeight: "700" },
        sceneStyle: { backgroundColor: "#080f08" },
      }}
    >
      <Tabs.Screen
        name="notes"
        options={{
          title: "Notes",
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size - 4, color }}>📝</Text>
          ),
          headerTitle: "SatoSave Vault",
          headerRight: () => <LogoutButton />,
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: "Contacts",
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size - 4, color }}>👤</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="links"
        options={{
          title: "Links",
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size - 4, color }}>🔗</Text>
          ),
        }}
      />
    </Tabs>
  );
}

function LogoutButton() {
  const { logout } = useAuth();
  const router = useRouter();

  return (
    <Text
      style={{
        color: "#666",
        fontSize: 13,
        paddingRight: 16,
      }}
      onPress={async () => {
        await logout();
        router.replace("/auth");
      }}
    >
      Sign out
    </Text>
  );
}
