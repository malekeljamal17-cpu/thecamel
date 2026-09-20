import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../theme/colors";
import type { PaymentProvider } from "../api/types";

const OPTIONS: { provider: PaymentProvider; label: string; icon: string; note: string }[] = [
  { provider: "WISH_MONEY", label: "Wish Money", icon: "💸", note: "Cash-in at any branch/agent" },
  { provider: "OMT", label: "OMT", icon: "🏧", note: "Cash-in at any branch/agent" },
  { provider: "CARD", label: "Debit / Credit Card", icon: "💳", note: "Visa, Mastercard" },
];

export function PaymentMethodPicker({ value, onChange }: { value: PaymentProvider; onChange: (p: PaymentProvider) => void }) {
  return (
    <View style={styles.list}>
      {OPTIONS.map((opt) => {
        const selected = value === opt.provider;
        return (
          <Pressable
            key={opt.provider}
            onPress={() => onChange(opt.provider)}
            style={[styles.option, selected && styles.optionSelected]}
          >
            <Text style={styles.icon}>{opt.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{opt.label}</Text>
              <Text style={styles.note}>{opt.note}</Text>
            </View>
            <View style={[styles.radio, selected && styles.radioSelected]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionSelected: { borderColor: colors.primary, backgroundColor: "#ECFDF5" },
  icon: { fontSize: 22 },
  label: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
  note: { fontSize: 12, color: colors.textSecondary },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border },
  radioSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
});
