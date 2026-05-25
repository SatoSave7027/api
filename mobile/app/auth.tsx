import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from "react-native-reanimated";
import { authApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type Step = "email" | "otp";

export default function AuthScreen() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const handleRequestCode = async () => {
    if (!email.trim()) return;
    setError("");
    setIsLoading(true);
    try {
      await authApi.requestCode(email.trim());
      setStep("otp");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Failed to send code";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!otp.trim()) return;
    setError("");
    setIsLoading(true);
    try {
      const res = await authApi.verifyCode(email.trim(), otp.trim().toUpperCase());
      await login(res.data.access_token, res.data.refresh_token);
      router.replace("/tabs/notes");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Invalid or expired code";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
          <Text style={styles.logo}>🛡️</Text>
          <Text style={styles.title}>SatoSave Vault</Text>
          <Text style={styles.subtitle}>Secure personal data vault</Text>
        </Animated.View>

        <View style={styles.card}>
          {step === "email" ? (
            <Animated.View
              key="email-step"
              entering={SlideInRight.duration(300)}
              exiting={SlideOutLeft.duration(300)}
            >
              <Text style={styles.stepTitle}>Enter your email</Text>
              <Text style={styles.stepDesc}>
                We'll send you a 6-character login code
              </Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#444"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleRequestCode}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.buttonText}>Send Code</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <Animated.View
              key="otp-step"
              entering={SlideInRight.duration(300)}
              exiting={SlideOutLeft.duration(300)}
            >
              <Text style={styles.stepTitle}>Check your email</Text>
              <Text style={styles.stepDesc}>
                Code sent to{" "}
                <Text style={styles.accentText}>{email}</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.otpInput]}
                value={otp}
                onChangeText={(t) => setOtp(t.toUpperCase())}
                placeholder="A1B2C3"
                placeholderTextColor="#444"
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={6}
                autoFocus
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleVerifyCode}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.buttonText}>Verify &amp; Sign In</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  setStep("email");
                  setOtp("");
                  setError("");
                }}
              >
                <Text style={styles.backButtonText}>Use different email</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080f08",
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logo: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#0d1a0d",
    borderWidth: 1,
    borderColor: "#1a2e1a",
    borderRadius: 20,
    padding: 24,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 6,
  },
  stepDesc: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  accentText: {
    color: "#39ff14",
  },
  input: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#1a2e1a",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#fff",
    fontSize: 16,
    marginBottom: 16,
  },
  otpInput: {
    textAlign: "center",
    fontSize: 28,
    letterSpacing: 12,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  error: {
    color: "#f87171",
    fontSize: 13,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#39ff14",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    shadowColor: "#39ff14",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "700",
  },
  backButton: {
    marginTop: 16,
    alignItems: "center",
  },
  backButtonText: {
    color: "#555",
    fontSize: 14,
  },
});
