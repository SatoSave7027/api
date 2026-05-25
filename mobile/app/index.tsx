import { Redirect } from "expo-router";

import { useAuth } from "../lib/auth";

export default function Index() {
  const { user } = useAuth();
  if (user) return <Redirect href="/(app)/home" />;
  return <Redirect href="/(auth)/login" />;
}
