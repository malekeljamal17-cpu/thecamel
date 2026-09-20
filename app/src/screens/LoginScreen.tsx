import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";
import { colors, radius, spacing } from "../theme/colors";
import { PrimaryButton } from "../components/PrimaryButton";
import type { AuthStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState("demo@camelfinance.app");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
      <Text style={styles.logo}>🐫</Text>
      <Text style={styles.title}>Camel Finance</Text>
      <Text style={styles.subtitle}>Save, protect, and grow — built for Lebanon.</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />

        {error && <Text style={styles.error}>{error}</Text>}

        <PrimaryButton label="Log in" onPress={onSubmit} loading={loading} disabled={!email || !password} />
        <PrimaryButton label="Create an account" variant="secondary" onPress={() => navigation.navigate("Signup")} />
      </View>

      <Text style={styles.hint}>Demo account: demo@camelfinance.app / password123</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  logo: { fontSize: 56 },
  title: { fontSize: 26, fontWeight: "800", color: colors.textPrimary, marginTop: spacing.sm },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.lg },
  form: { width: "100%", gap: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    fontSize: 15,
  },
  error: { color: colors.danger, fontSize: 13 },
  hint: { color: colors.textSecondary, fontSize: 12, marginTop: spacing.lg, textAlign: "center" },
});
