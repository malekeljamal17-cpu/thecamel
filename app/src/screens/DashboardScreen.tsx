import React, { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../api/client";
import type { DashboardResponse } from "../api/types";
import { colors, radius, spacing } from "../theme/colors";
import { BalanceCard } from "../components/BalanceCard";
import { LevelProgress } from "../components/LevelProgress";
import { BadgeRow } from "../components/BadgeRow";
import { GoalCard } from "../components/GoalCard";
import { PrimaryButton } from "../components/PrimaryButton";
import { formatCents } from "../utils/money";

export function DashboardScreen() {
  const navigation = useNavigation<any>();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const result = await api.get<DashboardResponse>("/dashboard");
    setData(result);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (!data) return <SafeAreaView style={styles.container} />;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.greeting}>Hi, {data.user.fullName.split(" ")[0]} 👋</Text>

        <BalanceCard balanceCents={data.wallet.balanceCents} currency={data.wallet.currency} tier={data.user.tier} />

        <View style={styles.quickActions}>
          <View style={{ flex: 1 }}>
            <PrimaryButton label="Add Money" onPress={() => navigation.navigate("AddMoney")} />
          </View>
          <View style={{ flex: 1 }}>
            <PrimaryButton label="Book Advisor" variant="secondary" onPress={() => navigation.navigate("Premium")} />
          </View>
        </View>

        {data.user.kycStatus !== "VERIFIED" && (
          <View style={styles.kycBanner}>
            <Text style={styles.kycText}>Verify your identity to unlock higher limits and premium sessions.</Text>
          </View>
        )}

        {data.upcomingBooking && (
          <View style={styles.bookingBanner}>
            <Text style={styles.bookingTitle}>📅 Upcoming session</Text>
            <Text style={styles.bookingSubtitle}>
              {data.upcomingBooking.topic} — {new Date(data.upcomingBooking.scheduledAt).toLocaleString()}
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Your progress</Text>
        <LevelProgress gamification={data.gamification} />

        <Text style={styles.sectionTitle}>Badges</Text>
        <BadgeRow badges={data.gamification.badges} />

        <View style={styles.goalsHeader}>
          <Text style={styles.sectionTitle}>Goals</Text>
          <Text style={styles.linkText} onPress={() => navigation.navigate("Goals")}>
            See all
          </Text>
        </View>
        {data.goals.slice(0, 2).map((goal) => (
          <GoalCard key={goal.id} goal={goal} onPress={() => navigation.navigate("GoalDetail", { goalId: goal.id })} />
        ))}
        {data.goals.length === 0 && (
          <Text style={styles.emptyGoals}>No goals yet — set one from the Goals tab to start earning points.</Text>
        )}

        <View style={styles.insuranceCta}>
          <Text style={styles.insuranceTitle}>🛡️ Protect your goals</Text>
          <Text style={styles.insuranceBody}>
            Add a life or savings-plan insurance policy at any time and link it to a goal — its coverage counts toward
            reaching that goal faster.
          </Text>
          <PrimaryButton label="Explore insurance" variant="secondary" onPress={() => navigation.navigate("Insurance")} />
        </View>

        <Text style={styles.footerNote}>
          Total held: {formatCents(data.wallet.balanceCents, data.wallet.currency)}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  greeting: { fontSize: 20, fontWeight: "800", color: colors.textPrimary },
  quickActions: { flexDirection: "row", gap: spacing.sm },
  kycBanner: { backgroundColor: "#FEF3C7", borderRadius: radius.md, padding: spacing.md },
  kycText: { color: "#92400E", fontSize: 13, fontWeight: "600" },
  bookingBanner: { backgroundColor: "#ECFDF5", borderRadius: radius.md, padding: spacing.md },
  bookingTitle: { fontWeight: "800", color: colors.primaryDark },
  bookingSubtitle: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: colors.textPrimary, marginTop: spacing.xs },
  goalsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  linkText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
  emptyGoals: { color: colors.textSecondary, fontSize: 13 },
  insuranceCta: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  insuranceTitle: { fontWeight: "800", color: colors.textPrimary },
  insuranceBody: { color: colors.textSecondary, fontSize: 12 },
  footerNote: { textAlign: "center", color: colors.textSecondary, fontSize: 11, marginTop: spacing.md },
});
