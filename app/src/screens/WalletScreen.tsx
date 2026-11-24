import React, { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../api/client";
import type { Transaction, Wallet } from "../api/types";
import { colors, radius, spacing } from "../theme/colors";
import { BalanceCard } from "../components/BalanceCard";
import { PrimaryButton } from "../components/PrimaryButton";
import { formatCents } from "../utils/money";
import { FEATURES } from "../config/features";

const TYPE_LABEL: Record<string, string> = {
  DEPOSIT: "Deposit",
  WITHDRAWAL: "Withdrawal",
  TRANSFER: "Transfer",
  FEE: "Fee",
  GOAL_CONTRIBUTION: "Goal progress logged",
  PREMIUM_SESSION: "Coaching session",
  POLICY_PREMIUM: "Insurance premium",
};

const PROVIDER_LABEL: Record<string, string> = {
  CARD: "Card",
  WISH_MONEY: "Wish Money",
  OMT: "OMT",
  INTERNAL: "Camel Finance",
};

export function WalletScreen() {
  const navigation = useNavigation<any>();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const load = useCallback(async () => {
    const [w, tx] = await Promise.all([
      api.get<Wallet>("/wallet"),
      api.get<Transaction[]>("/wallet/transactions"),
    ]);
    setWallet(w);
    setTransactions(tx);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Wallet</Text>
        {FEATURES.walletEnabled ? (
          <>
            {wallet && <BalanceCard balanceCents={wallet.balanceCents} currency={wallet.currency} tier="FREE" />}
            <View style={styles.actions}>
              <View style={{ flex: 1 }}>
                <PrimaryButton label="Add Money" onPress={() => navigation.navigate("AddMoney")} />
              </View>
            </View>
          </>
        ) : (
          <View style={styles.comingSoonCard}>
            <Text style={styles.comingSoonTitle}>🏦 Coming soon, with a licensed partner</Text>
            <Text style={styles.comingSoonBody}>
              Camel Finance doesn't hold a wallet balance yet — we're partnering with a licensed bank first so your
              money is never in our hands without the right license. Coaching sessions are still paid directly by
              card below.
            </Text>
          </View>
        )}
        <Text style={styles.sectionTitle}>Recent activity</Text>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No transactions yet.</Text>}
        renderItem={({ item }) => {
          const isCredit = item.type === "DEPOSIT";
          return (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{TYPE_LABEL[item.type] ?? item.type}</Text>
                <Text style={styles.rowSubtitle}>
                  {PROVIDER_LABEL[item.provider] ?? item.provider} · {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.amount, isCredit ? styles.credit : styles.debit]}>
                  {isCredit ? "+" : "-"}
                  {formatCents(item.amountCents, item.currency)}
                </Text>
                {item.feeCents > 0 && <Text style={styles.fee}>fee {formatCents(item.feeCents, item.currency)}</Text>}
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, gap: spacing.md },
  title: { fontSize: 22, fontWeight: "800", color: colors.textPrimary },
  actions: { flexDirection: "row", gap: spacing.sm },
  comingSoonCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.xs },
  comingSoonTitle: { fontWeight: "800", color: colors.textPrimary, fontSize: 15 },
  comingSoonBody: { color: colors.textSecondary, fontSize: 12.5, lineHeight: 18 },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: colors.textPrimary },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  empty: { color: colors.textSecondary, textAlign: "center", marginTop: spacing.xl },
  row: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  rowTitle: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  rowSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  amount: { fontSize: 14, fontWeight: "800" },
  credit: { color: colors.success },
  debit: { color: colors.textPrimary },
  fee: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },
});
