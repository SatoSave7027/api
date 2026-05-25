import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth-context";

export default function IndexScreen() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      router.replace("/tabs/notes");
    } else {
      router.replace("/auth");
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#080f08",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ActivityIndicator size="large" color="#39ff14" />
    </View>
  );
}
