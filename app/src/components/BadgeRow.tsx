import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../theme/colors";
import type { Badge } from "../api/types";

export function BadgeRow({ badges }: { badges: Badge[] }) {
  if (badges.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyText}>Complete actions like your first deposit or goal to start earning badges.</Text>
      </View>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {badges.map((badge) => (
        <View key={badge.code} style={styles.badge}>
          <Text style={styles.icon}>{badge.icon}</Text>
          <Text style={styles.name}>{badge.name}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingVertical: spacing.xs },
  badge: {
    width: 88,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  icon: { fontSize: 28 },
  name: { fontSize: 11, fontWeight: "600", color: colors.textPrimary, textAlign: "center", marginTop: 4 },
  emptyCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderStyle: "dashed" },
  emptyText: { color: colors.textSecondary, fontSize: 12 },
});
