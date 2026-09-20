import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, ApiError } from "../api/client";
import type { Advisor, Booking } from "../api/types";
import { colors, radius, spacing } from "../theme/colors";
import { PrimaryButton } from "../components/PrimaryButton";
import { formatCents } from "../utils/money";

const DURATIONS = [15, 30, 60] as const;

function nextDays(count: number): Date[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
}

export function PremiumBookingScreen() {
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [duration, setDuration] = useState<(typeof DURATIONS)[number]>(30);
  const [topic, setTopic] = useState("");
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [busy, setBusy] = useState(false);

  const days = useMemo(() => nextDays(7), []);

  const loadAdvisors = useCallback(async () => {
    const list = await api.get<Advisor[]>("/bookings/advisors");
    setAdvisors(list);
    setSelectedAdvisor((prev) => prev ?? list[0] ?? null);
  }, []);

  const loadBookings = useCallback(async () => {
    setMyBookings(await api.get<Booking[]>("/bookings"));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAdvisors();
      loadBookings();
    }, [loadAdvisors, loadBookings]),
  );

  useEffect(() => {
    if (!selectedAdvisor) return;
    const dateIso = selectedDate.toISOString().slice(0, 10);
    api
      .get<string[]>(`/bookings/advisors/${selectedAdvisor.id}/slots?date=${dateIso}`)
      .then((result) => {
        setSlots(result);
        setSelectedSlot(null);
      })
      .catch(() => setSlots([]));
  }, [selectedAdvisor, selectedDate]);

  const onRequestBooking = async () => {
    if (!selectedAdvisor || !selectedSlot || !topic) return;
    setBusy(true);
    try {
      await api.post("/bookings", { advisorId: selectedAdvisor.id, scheduledAt: selectedSlot, durationMinutes: duration, topic });
      setTopic("");
      setSelectedSlot(null);
      await loadBookings();
      Alert.alert("Session requested", "Confirm it below to lock in the slot and pay the advisory fee.");
    } catch (err) {
      Alert.alert("Couldn't book", err instanceof ApiError ? err.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const onConfirm = async (bookingId: string) => {
    setBusy(true);
    try {
      await api.post(`/bookings/${bookingId}/confirm`);
      await loadBookings();
    } catch (err) {
      Alert.alert("Couldn't confirm", err instanceof ApiError ? err.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const onCancel = async (bookingId: string) => {
    setBusy(true);
    try {
      await api.post(`/bookings/${bookingId}/cancel`);
      await loadBookings();
    } catch (err) {
      Alert.alert("Couldn't cancel", err instanceof ApiError ? err.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>⭐ Premium: talk to a human advisor</Text>
        <Text style={styles.subtitle}>Book a real financial advisor for the moments that need more than an app.</Text>

        <Text style={styles.sectionTitle}>1. Choose an advisor</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
          {advisors.map((advisor) => (
            <Text
              key={advisor.id}
              onPress={() => setSelectedAdvisor(advisor)}
              style={[styles.advisorChip, selectedAdvisor?.id === advisor.id && styles.chipSelected]}
            >
              {advisor.name}
            </Text>
          ))}
        </ScrollView>
        {selectedAdvisor && <Text style={styles.advisorBio}>{selectedAdvisor.title} — {selectedAdvisor.bio}</Text>}

        <Text style={styles.sectionTitle}>2. Pick a date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
          {days.map((d) => {
            const isSelected = d.toDateString() === selectedDate.toDateString();
            return (
              <Text key={d.toISOString()} onPress={() => setSelectedDate(d)} style={[styles.dateChip, isSelected && styles.chipSelected]}>
                {d.toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}
              </Text>
            );
          })}
        </ScrollView>

        <Text style={styles.sectionTitle}>3. Pick a time</Text>
        <View style={styles.slotGrid}>
          {slots.length === 0 && <Text style={styles.empty}>No slots available this day.</Text>}
          {slots.map((slot) => (
            <Text
              key={slot}
              onPress={() => setSelectedSlot(slot)}
              style={[styles.slotChip, selectedSlot === slot && styles.chipSelected]}
            >
              {new Date(slot).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
            </Text>
          ))}
        </View>

        <Text style={styles.sectionTitle}>4. Session length</Text>
        <View style={styles.slotGrid}>
          {DURATIONS.map((d) => (
            <Text key={d} onPress={() => setDuration(d)} style={[styles.slotChip, duration === d && styles.chipSelected]}>
              {d} min
            </Text>
          ))}
        </View>

        <TextInput style={styles.input} placeholder="What do you want to talk about?" value={topic} onChangeText={setTopic} />

        <PrimaryButton label="Request Session" onPress={onRequestBooking} loading={busy} disabled={!selectedSlot || !topic} />

        <Text style={styles.sectionTitle}>Your sessions</Text>
        {myBookings.length === 0 && <Text style={styles.empty}>No sessions booked yet.</Text>}
        {myBookings.map((booking) => (
          <View key={booking.id} style={styles.bookingCard}>
            <Text style={styles.bookingTitle}>{booking.topic}</Text>
            <Text style={styles.bookingSubtitle}>
              {new Date(booking.scheduledAt).toLocaleString()} · {booking.durationMinutes} min · {booking.status}
            </Text>
            <Text style={styles.bookingSubtitle}>Fee: {formatCents(booking.feeCents)}</Text>
            {booking.status === "REQUESTED" && (
              <View style={styles.bookingActions}>
                <View style={{ flex: 1 }}>
                  <PrimaryButton label="Confirm & Pay" onPress={() => onConfirm(booking.id)} loading={busy} />
                </View>
                <View style={{ flex: 1 }}>
                  <PrimaryButton label="Cancel" variant="secondary" onPress={() => onCancel(booking.id)} loading={busy} />
                </View>
              </View>
            )}
            {booking.status === "CONFIRMED" && booking.meetingLink && (
              <Text style={styles.meetingLink}>{booking.meetingLink}</Text>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xl },
  title: { fontSize: 18, fontWeight: "800", color: colors.textPrimary },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.sm },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: colors.textPrimary, marginTop: spacing.md },
  advisorChip: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  advisorBio: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  dateChip: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  slotGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  slotChip: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  chipSelected: { color: "#fff", backgroundColor: colors.primary, borderColor: colors.primary },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, backgroundColor: colors.surface, marginTop: spacing.sm },
  empty: { fontSize: 12, color: colors.textSecondary },
  bookingCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: 4 },
  bookingTitle: { fontWeight: "800", color: colors.textPrimary },
  bookingSubtitle: { fontSize: 12, color: colors.textSecondary },
  bookingActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  meetingLink: { fontSize: 12, color: colors.primary, marginTop: 4 },
});
