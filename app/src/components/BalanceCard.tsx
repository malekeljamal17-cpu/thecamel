import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../theme/colors";
import { formatCents } from "../utils/money";

interface Props {
  balanceCents: number;
  currency: string;
  tier: string;
}

export function BalanceCard({ balanceCents, currency, tier }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Wallet balance</Text>
        <View style={styles.tierBadge}>
          <Text style={styles.tierText}>{tier === "PREMIUM" ? "⭐ Premium" : "Free"}</Text>
        </View>
      </View>
      <Text style={styles.balance}>{formatCents(balanceCents, currency)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { color: "#D1FAE5", fontSize: 13, fontWeight: "600" },
  tierBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  tierText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  balance: { color: "#fff", fontSize: 36, fontWeight: "800", marginTop: spacing.sm },
});
