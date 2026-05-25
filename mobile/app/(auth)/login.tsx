import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Field } from "../../components/Field";
import { useToast } from "../../components/Toast";
import { ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { colors, spacing } from "../../lib/theme";

type Stage = "email" | "code";

export default function LoginScreen() {
  const router = useRouter();
  const { requestCode, verifyCode } = useAuth();
  const { notify } = useToast();
  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(slide, {
        toValue: 0,
        useNativeDriver: true,
        friction: 6,
        tension: 180,
      }),
    ]).start();
  }, [fade, slide]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(
      () => setCooldown((value) => Math.max(0, value - 1)),
      1000
    );
    return () => clearInterval(id);
  }, [cooldown]);

  async function handleRequest() {
    if (!email.trim()) {
      notify("Enter your email.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await requestCode(email.trim());
      notify("Verification code sent.", "success");
      setStage("code");
      setCooldown(60);
    } catch (error) {
      notify(
        error instanceof ApiError ? error.message : "Failed to send code.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify() {
    if (code.trim().length < 4) {
      notify("Enter the code from your email.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await verifyCode(email.trim(), code.trim());
      notify("Welcome back.", "success");
      router.replace("/(app)/home");
    } catch (error) {
      notify(
        error instanceof ApiError ? error.message : "Verification failed.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={{
              opacity: fade,
              transform: [{ translateY: slide }],
              width: "100%",
            }}
          >
            <View style={styles.brandRow}>
              <View style={styles.logo} />
              <Text style={styles.brand}>SatoSave Vault</Text>
            </View>
            <Card style={{ marginTop: spacing.xl }}>
              <Text style={styles.title}>
                {stage === "email" ? "Sign in" : "Enter your code"}
              </Text>
              <Text style={styles.subtitle}>
                {stage === "email"
                  ? "Passwordless login. We send a one-time code to your email."
                  : `Code sent to ${email}. Codes expire shortly.`}
              </Text>

              {stage === "email" ? (
                <View style={{ marginTop: spacing.lg }}>
                  <Field
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="you@domain.com"
                  />
                  <Button
                    label="Send verification code"
                    onPress={handleRequest}
                    loading={submitting}
                  />
                </View>
              ) : (
                <View style={{ marginTop: spacing.lg }}>
                  <Field
                    label="Code"
                    value={code}
                    onChangeText={(value) =>
                      setCode(value.toUpperCase().replace(/\s/g, ""))
                    }
                    maxLength={12}
                    autoCapitalize="characters"
                    placeholder="ABC123"
                    style={{
                      textAlign: "center",
                      letterSpacing: 8,
                      fontSize: 20,
                    }}
                  />
                  <Button
                    label="Verify & sign in"
                    onPress={handleVerify}
                    loading={submitting}
                  />
                  <View style={styles.row}>
                    <Text
                      style={styles.link}
                      onPress={() => setStage("email")}
                    >
                      Use a different email
                    </Text>
                    <Text
                      style={[
                        styles.link,
                        { color: cooldown > 0 ? colors.textFaint : colors.neon },
                      ]}
                      onPress={async () => {
                        if (cooldown > 0) return;
                        try {
                          await requestCode(email.trim());
                          notify("Code re-sent.", "success");
                          setCooldown(60);
                        } catch (error) {
                          notify(
                            error instanceof ApiError
                              ? error.message
                              : "Failed to resend.",
                            "error"
                          );
                        }
                      }}
                    >
                      {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                    </Text>
                  </View>
                </View>
              )}
            </Card>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.neon,
  },
  brand: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  row: {
    marginTop: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  link: {
    color: colors.aqua,
    fontSize: 13,
  },
});
