import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { api, ApiError } from "../api/client";
import type { PaymentProvider, Transaction } from "../api/types";
import { colors, radius, spacing } from "../theme/colors";
import { PaymentMethodPicker } from "../components/PaymentMethodPicker";
import { PrimaryButton } from "../components/PrimaryButton";
import { formatCents } from "../utils/money";

const FEE_NOTE: Record<PaymentProvider, string> = {
  WISH_MONEY: "1.5% cash-in fee (min $1.00)",
  OMT: "1.5% cash-in fee (min $1.00)",
  CARD: "2.9% + $0.30 card processing fee",
  INTERNAL: "No fee",
};

export function AddMoneyScreen() {
  const navigation = useNavigation();
  const [provider, setProvider] = useState<PaymentProvider>("WISH_MONEY");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const amountCents = Math.round(parseFloat(amount || "0") * 100);
  const isValid = amountCents > 0;

  const onSubmit = async () => {
    setLoading(true);
    try {
      const result = await api.post<Transaction>("/payments/deposit", { provider, amountCents });
      Alert.alert(
        "Money added",
        `${formatCents(result.amountCents)} received via ${provider.replace("_", " ")}. Fee: ${formatCents(result.feeCents)}.`,
        [{ text: "Done", onPress: () => navigation.goBack() }],
      );
    } catch (err) {
      Alert.alert("Couldn't add money", err instanceof ApiError ? err.message : "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Amount (USD)</Text>
        <TextInput
          style={styles.amountInput}
          keyboardType="decimal-pad"
          placeholder="0.00"
          value={amount}
          onChangeText={setAmount}
        />

        <Text style={styles.label}>Pay with</Text>
        <PaymentMethodPicker value={provider} onChange={setProvider} />

        <View style={styles.feeBox}>
          <Text style={styles.feeText}>{FEE_NOTE[provider]}</Text>
        </View>

        <PrimaryButton label="Add Money" onPress={onSubmit} loading={loading} disabled={!isValid} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.sm },
  label: { fontSize: 13, fontWeight: "700", color: colors.textSecondary, marginTop: spacing.sm },
  amountInput: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.textPrimary,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
  feeBox: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm, borderWidth: 1, borderColor: colors.border },
  feeText: { fontSize: 12, color: colors.textSecondary },
});
