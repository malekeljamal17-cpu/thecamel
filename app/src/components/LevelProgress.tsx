import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../theme/colors";
import type { Gamification } from "../api/types";

export function LevelProgress({ gamification }: { gamification: Gamification }) {
  const { level, points, nextLevelCeiling, progressPercent, currentStreakDays } = gamification;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.levelText}>Level {level}</Text>
        <Text style={styles.pointsText}>{points} pts</Text>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(progressPercent, 100)}%` }]} />
      </View>

      <View style={styles.row}>
        <Text style={styles.subtext}>
          {nextLevelCeiling ? `${nextLevelCeiling - points} pts to level ${level + 1}` : "Max level reached"}
        </Text>
        {currentStreakDays > 0 && <Text style={styles.streak}>🔥 {currentStreakDays}-day streak</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xs },
  levelText: { fontSize: 16, fontWeight: "800", color: colors.textPrimary },
  pointsText: { fontSize: 14, fontWeight: "700", color: colors.gold },
  track: { height: 10, borderRadius: radius.pill, backgroundColor: colors.border, overflow: "hidden", marginVertical: spacing.xs },
  fill: { height: "100%", backgroundColor: colors.gold, borderRadius: radius.pill },
  subtext: { fontSize: 12, color: colors.textSecondary },
  streak: { fontSize: 12, fontWeight: "700", color: colors.textPrimary },
});
