import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../theme/colors";
import type { Goal } from "../api/types";
import { formatCents } from "../utils/money";

const CATEGORY_ICON: Record<string, string> = {
  EMERGENCY_FUND: "🛟",
  SAVINGS: "🐫",
  TRAVEL: "✈️",
  EDUCATION: "🎓",
  RETIREMENT: "🌴",
  HOME_PURCHASE: "🏠",
  INSURANCE_LINKED: "🛡️",
  OTHER: "📌",
};

export function GoalCard({ goal, onPress }: { goal: Goal; onPress: () => void }) {
  const progress = Math.min(Math.round((goal.currentAmountCents / goal.targetAmountCents) * 100), 100);

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.icon}>{CATEGORY_ICON[goal.category] ?? "📌"}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{goal.name}</Text>
          <Text style={styles.amounts}>
            {formatCents(goal.currentAmountCents)} of {formatCents(goal.targetAmountCents)}
          </Text>
        </View>
        {goal.linkedPolicy && <Text style={styles.shield}>🛡️</Text>}
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.progressLabel}>{progress}% there</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  icon: { fontSize: 24 },
  name: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
  amounts: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  shield: { fontSize: 16 },
  track: { height: 8, borderRadius: radius.pill, backgroundColor: colors.border, overflow: "hidden", marginTop: spacing.sm },
  fill: { height: "100%", backgroundColor: colors.primary, borderRadius: radius.pill },
  progressLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 4, textAlign: "right" },
});
