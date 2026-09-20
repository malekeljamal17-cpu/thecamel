import React, { useCallback, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api, ApiError } from "../api/client";
import type { InsurancePolicy, PolicyType } from "../api/types";
import { colors, radius, spacing } from "../theme/colors";
import { PrimaryButton } from "../components/PrimaryButton";
import { formatCents } from "../utils/money";

const POLICY_TYPES: PolicyType[] = ["LIFE", "SAVINGS_PLAN", "LIFE_AND_SAVINGS"];

export function InsuranceScreen() {
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [provider, setProvider] = useState("");
  const [policyType, setPolicyType] = useState<PolicyType>("LIFE_AND_SAVINGS");
  const [coverage, setCoverage] = useState("");
  const [premium, setPremium] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setPolicies(await api.get<InsurancePolicy[]>("/insurance"));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onPropose = async () => {
    const coverageAmountCents = Math.round(parseFloat(coverage || "0") * 100);
    const premiumAmountCents = Math.round(parseFloat(premium || "0") * 100);
    if (!provider || coverageAmountCents <= 0 || premiumAmountCents <= 0) return;

    setBusy(true);
    try {
      await api.post("/insurance", { provider, policyType, coverageAmountCents, premiumAmountCents });
      setProvider("");
      setCoverage("");
      setPremium("");
      setShowForm(false);
      await load();
    } catch (err) {
      Alert.alert("Couldn't add policy", err instanceof ApiError ? err.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const onPayPremium = async (policyId: string) => {
    setBusy(true);
    try {
      await api.post(`/insurance/${policyId}/pay-premium`);
      Alert.alert("Premium paid", "Your policy premium was deducted from your wallet.");
    } catch (err) {
      Alert.alert("Payment failed", err instanceof ApiError ? err.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.intro}>
        <Text style={styles.introTitle}>Life & Savings-Plan Insurance</Text>
        <Text style={styles.introBody}>
          Add a policy any time and optionally link it to a savings goal — its coverage counts toward that goal's target
          and helps you get there faster.
        </Text>
        <PrimaryButton label={showForm ? "Cancel" : "+ Propose a Policy"} variant="secondary" onPress={() => setShowForm((s) => !s)} />
      </View>

      {showForm && (
        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="Insurance provider (e.g. Bankers Assurance)" value={provider} onChangeText={setProvider} />
          <View style={styles.typeRow}>
            {POLICY_TYPES.map((t) => (
              <Text key={t} onPress={() => setPolicyType(t)} style={[styles.typeChip, policyType === t && styles.typeChipSelected]}>
                {t.replace("_", " ")}
              </Text>
            ))}
          </View>
          <TextInput style={styles.input} placeholder="Coverage amount (USD)" keyboardType="decimal-pad" value={coverage} onChangeText={setCoverage} />
          <TextInput style={styles.input} placeholder="Monthly premium (USD)" keyboardType="decimal-pad" value={premium} onChangeText={setPremium} />
          <PrimaryButton label="Propose Policy" onPress={onPropose} loading={busy} />
        </View>
      )}

      <FlatList
        data={policies}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No policies yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.policyCard}>
            <Text style={styles.policyTitle}>{item.provider}</Text>
            <Text style={styles.policySubtitle}>
              {item.policyType.replace("_", " ")} · {item.status} · coverage {formatCents(item.coverageAmountCents)}
            </Text>
            <Text style={styles.policySubtitle}>
              Premium: {formatCents(item.premiumAmountCents)} / {item.premiumFrequency.toLowerCase()}
              {item.goalId ? " · linked to a goal" : ""}
            </Text>
            <PrimaryButton label="Pay Premium" variant="secondary" onPress={() => onPayPremium(item.id)} loading={busy} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  intro: { padding: spacing.lg, gap: spacing.sm },
  introTitle: { fontSize: 18, fontWeight: "800", color: colors.textPrimary },
  introBody: { fontSize: 13, color: colors.textSecondary },
  form: { paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.md },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, backgroundColor: colors.surface },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  typeChip: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    overflow: "hidden",
  },
  typeChipSelected: { color: "#fff", backgroundColor: colors.primary, borderColor: colors.primary },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm },
  empty: { color: colors.textSecondary, textAlign: "center", marginTop: spacing.xl },
  policyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
    marginBottom: spacing.sm,
  },
  policyTitle: { fontSize: 15, fontWeight: "800", color: colors.textPrimary },
  policySubtitle: { fontSize: 12, color: colors.textSecondary },
});
