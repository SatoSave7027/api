import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const useSecure = Platform.OS === "ios" || Platform.OS === "android";

export async function setItem(key: string, value: string): Promise<void> {
  if (useSecure) {
    await SecureStore.setItemAsync(key, value);
  } else {
    await AsyncStorage.setItem(key, value);
  }
}

export async function getItem(key: string): Promise<string | null> {
  if (useSecure) {
    return SecureStore.getItemAsync(key);
  }
  return AsyncStorage.getItem(key);
}

export async function removeItem(key: string): Promise<void> {
  if (useSecure) {
    await SecureStore.deleteItemAsync(key);
  } else {
    await AsyncStorage.removeItem(key);
  }
}
