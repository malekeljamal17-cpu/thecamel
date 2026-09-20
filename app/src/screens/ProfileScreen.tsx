import React, { useCallback, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { api, ApiError } from "../api/client";
import type { AuthUser } from "../api/types";
import { colors, radius, spacing } from "../theme/colors";
import { PrimaryButton } from "../components/PrimaryButton";

export function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const [freshUser, setFreshUser] = useState<AuthUser | null>(user);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const me = await api.get<AuthUser>("/auth/me");
    setFreshUser(me);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onSubmitKyc = async () => {
    setBusy(true);
    try {
      const updated = await api.post<AuthUser>("/auth/kyc/submit");
      setFreshUser(updated);
      refreshUser(updated);
      Alert.alert("Verified", "Your identity has been verified.");
    } catch (err) {
      Alert.alert("Couldn't verify", err instanceof ApiError ? err.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const displayUser = freshUser ?? user;
  if (!displayUser) return <SafeAreaView style={styles.container} />;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.content}>
        <Text style={styles.avatar}>🧑‍💼</Text>
        <Text style={styles.name}>{displayUser.fullName}</Text>
        <Text style={styles.email}>{displayUser.email}</Text>

        <View style={styles.card}>
          <Row label="KYC status" value={displayUser.kycStatus} />
          <Row label="Membership tier" value={displayUser.tier} />
          {displayUser.phone && <Row label="Phone" value={displayUser.phone} />}
        </View>

        {displayUser.kycStatus !== "VERIFIED" && (
          <PrimaryButton label="Verify my identity" onPress={onSubmitKyc} loading={busy} />
        )}

        <PrimaryButton label="Log out" variant="secondary" onPress={logout} />
      </View>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, alignItems: "center", gap: spacing.sm },
  avatar: { fontSize: 56 },
  name: { fontSize: 20, fontWeight: "800", color: colors.textPrimary },
  email: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.md },
  card: { width: "100%", backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.sm },
  row: { flexDirection: "row", justifyContent: "space-between" },
  rowLabel: { color: colors.textSecondary, fontSize: 13 },
  rowValue: { color: colors.textPrimary, fontWeight: "700", fontSize: 13 },
});
