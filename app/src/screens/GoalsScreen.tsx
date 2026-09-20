import React, { useCallback, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, ApiError } from "../api/client";
import type { Goal, GoalCategory } from "../api/types";
import { colors, radius, spacing } from "../theme/colors";
import { GoalCard } from "../components/GoalCard";
import { PrimaryButton } from "../components/PrimaryButton";

const CATEGORIES: GoalCategory[] = ["SAVINGS", "EMERGENCY_FUND", "TRAVEL", "EDUCATION", "RETIREMENT", "OTHER"];

export function GoalsScreen() {
  const navigation = useNavigation<any>();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<GoalCategory>("SAVINGS");
  const [targetAmount, setTargetAmount] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setGoals(await api.get<Goal[]>("/goals"));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onCreate = async () => {
    const targetAmountCents = Math.round(parseFloat(targetAmount || "0") * 100);
    if (!name || targetAmountCents <= 0) return;

    setCreating(true);
    try {
      await api.post("/goals", { name, category, targetAmountCents });
      setName("");
      setTargetAmount("");
      setShowForm(false);
      await load();
    } catch (err) {
      Alert.alert("Couldn't create goal", err instanceof ApiError ? err.message : "Please try again.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Goals</Text>
        <PrimaryButton label={showForm ? "Cancel" : "+ New Goal"} variant="secondary" onPress={() => setShowForm((s) => !s)} />
      </View>

      {showForm && (
        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="Goal name (e.g. Umrah trip)" value={name} onChangeText={setName} />
          <TextInput
            style={styles.input}
            placeholder="Target amount (USD)"
            keyboardType="decimal-pad"
            value={targetAmount}
            onChangeText={setTargetAmount}
          />
          <View style={styles.categoryRow}>
            {CATEGORIES.map((c) => (
              <Text
                key={c}
                onPress={() => setCategory(c)}
                style={[styles.categoryChip, category === c && styles.categoryChipSelected]}
              >
                {c.replace("_", " ")}
              </Text>
            ))}
          </View>
          <PrimaryButton label="Create Goal" onPress={onCreate} loading={creating} />
        </View>
      )}

      <FlatList
        data={goals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Set your first goal to start tracking progress.</Text>}
        renderItem={({ item }) => (
          <GoalCard goal={item} onPress={() => navigation.navigate("GoalDetail", { goalId: item.id })} />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.lg },
  title: { fontSize: 22, fontWeight: "800", color: colors.textPrimary },
  form: { paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.md },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, backgroundColor: colors.surface },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  categoryChip: {
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
  categoryChipSelected: { color: "#fff", backgroundColor: colors.primary, borderColor: colors.primary },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  empty: { color: colors.textSecondary, textAlign: "center", marginTop: spacing.xl },
});
