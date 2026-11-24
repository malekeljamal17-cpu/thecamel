import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";
import { colors, radius, spacing } from "../theme/colors";
import { PrimaryButton } from "../components/PrimaryButton";
import type { AuthStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "Signup">;

export function SignupScreen({ navigation }: Props) {
  const { signup } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!privacyConsent) return;
    setError(null);
    setLoading(true);
    try {
      await signup({ fullName, email: email.trim(), password, phone: phone || undefined, privacyConsent: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Takes less than a minute.</Text>

        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="Full name" value={fullName} onChangeText={setFullName} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput style={styles.input} placeholder="Phone (optional, +961...)" value={phone} onChangeText={setPhone} />
          <TextInput style={styles.input} placeholder="Password (min. 8 characters)" secureTextEntry value={password} onChangeText={setPassword} />

          <Pressable style={styles.consentRow} onPress={() => setPrivacyConsent((v) => !v)}>
            <View style={[styles.checkbox, privacyConsent && styles.checkboxChecked]}>
              {privacyConsent && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.consentText}>
              I agree to the{" "}
              <Text style={styles.consentLink} onPress={() => navigation.navigate("PrivacyPolicy")}>
                Privacy Policy
              </Text>
            </Text>
          </Pressable>

          {error && <Text style={styles.error}>{error}</Text>}

          <PrimaryButton
            label="Sign up"
            onPress={onSubmit}
            loading={loading}
            disabled={!fullName || !email || password.length < 8 || !privacyConsent}
          />
          <PrimaryButton label="I already have an account" variant="secondary" onPress={() => navigation.navigate("Login")} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingTop: spacing.xl * 2 },
  title: { fontSize: 24, fontWeight: "800", color: colors.textPrimary },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.lg },
  form: { gap: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    fontSize: 15,
  },
  consentRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xs },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkmark: { color: "#fff", fontSize: 12, fontWeight: "800" },
  consentText: { fontSize: 13, color: colors.textSecondary, flex: 1 },
  consentLink: { color: colors.primary, fontWeight: "700", textDecorationLine: "underline" },
  error: { color: colors.danger, fontSize: 13 },
});
