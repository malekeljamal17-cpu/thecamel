import React, { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api, ApiError } from "../api/client";
import type { Goal, InsurancePolicy } from "../api/types";
import { colors, radius, spacing } from "../theme/colors";
import { PrimaryButton } from "../components/PrimaryButton";
import { formatCents } from "../utils/money";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "GoalDetail">;

interface Projection {
  remainingCents: number;
  linkedPolicyContributionCents: number;
  remainingAfterPolicyCents: number;
  onTrack: boolean | null;
}

export function GoalDetailScreen({ route, navigation }: Props) {
  const { goalId } = route.params;
  const [goal, setGoal] = useState<Goal | null>(null);
  const [projection, setProjection] = useState<Projection | null>(null);
  const [linkablePolicies, setLinkablePolicies] = useState<InsurancePolicy[]>([]);
  const [contribution, setContribution] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [g, p, policies] = await Promise.all([
      api.get<Goal>(`/goals/${goalId}`),
      api.get<Projection>(`/goals/${goalId}/projection`),
      api.get<InsurancePolicy[]>("/insurance"),
    ]);
    setGoal(g);
    setProjection(p);
    setLinkablePolicies(policies.filter((policy) => !policy.goalId));
  }, [goalId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onContribute = async () => {
    const amountCents = Math.round(parseFloat(contribution || "0") * 100);
    if (amountCents <= 0) return;

    setBusy(true);
    try {
      await api.post(`/goals/${goalId}/contribute`, { amountCents });
      setContribution("");
      await load();
    } catch (err) {
      Alert.alert("Couldn't add contribution", err instanceof ApiError ? err.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const onLinkPolicy = async (policyId: string) => {
    setBusy(true);
    try {
      await api.post(`/insurance/${policyId}/link-goal`, { goalId });
      await load();
    } catch (err) {
      Alert.alert("Couldn't link policy", err instanceof ApiError ? err.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!goal || !projection) return <View style={styles.container} />;

  const progress = Math.min(Math.round((goal.currentAmountCents / goal.targetAmountCents) * 100), 100);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{goal.name}</Text>
      <Text style={styles.amounts}>
        {formatCents(goal.currentAmountCents)} of {formatCents(goal.targetAmountCents)} ({progress}%)
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Add a contribution</Text>
        <View style={styles.contributeRow}>
          <TextInput
            style={styles.input}
            placeholder="Amount (USD)"
            keyboardType="decimal-pad"
            value={contribution}
            onChangeText={setContribution}
          />
          <PrimaryButton label="Add" onPress={onContribute} loading={busy} disabled={!contribution} />
        </View>
      </View>

      {goal.linkedPolicy ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🛡️ Protected by insurance</Text>
          <Text style={styles.cardBody}>
            {goal.linkedPolicy.provider} — {goal.linkedPolicy.policyType.replace("_", " ")}, coverage{" "}
            {formatCents(goal.linkedPolicy.coverageAmountCents)}
          </Text>
        </View>
      ) : linkablePolicies.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Link an insurance policy</Text>
          <Text style={styles.cardBody}>
            Linking a life/savings-plan policy counts its coverage toward this goal's target.
          </Text>
          {linkablePolicies.map((policy) => (
            <View key={policy.id} style={styles.policyRow}>
              <Text style={styles.policyLabel}>
                {policy.provider} · {formatCents(policy.coverageAmountCents)}
              </Text>
              <PrimaryButton label="Link" onPress={() => onLinkPolicy(policy.id)} loading={busy} />
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>No insurance linked yet</Text>
          <Text style={styles.cardBody}>You can add a life or savings-plan policy at any time from the Insurance tab.</Text>
          <PrimaryButton label="Explore Insurance" variant="secondary" onPress={() => navigation.navigate("Insurance")} />
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Projection</Text>
        <Text style={styles.cardBody}>Remaining to save: {formatCents(projection.remainingCents)}</Text>
        {projection.linkedPolicyContributionCents > 0 && (
          <Text style={styles.cardBody}>
            Insurance contributes: {formatCents(projection.linkedPolicyContributionCents)} → remaining after policy:{" "}
            {formatCents(projection.remainingAfterPolicyCents)}
          </Text>
        )}
        {projection.onTrack !== null && (
          <Text style={[styles.trackBadge, projection.onTrack ? styles.onTrack : styles.offTrack]}>
            {projection.onTrack ? "✅ On track" : "⚠️ Behind schedule"}
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  title: { fontSize: 22, fontWeight: "800", color: colors.textPrimary },
  amounts: { fontSize: 14, color: colors.textSecondary },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.xs },
  cardTitle: { fontSize: 14, fontWeight: "800", color: colors.textPrimary },
  cardBody: { fontSize: 13, color: colors.textSecondary },
  contributeRow: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  input: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.sm, backgroundColor: colors.background },
  policyRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.xs },
  policyLabel: { fontSize: 13, color: colors.textPrimary, flex: 1 },
  trackBadge: { fontSize: 12, fontWeight: "700", marginTop: spacing.xs },
  onTrack: { color: colors.success },
  offTrack: { color: colors.danger },
});
