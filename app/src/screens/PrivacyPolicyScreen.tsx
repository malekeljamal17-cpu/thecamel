import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../theme/colors";

/**
 * Written to actually answer Law 81/2018's requirements (Lebanon), not as
 * boilerplate: what's collected, why, who it's shared with, how long it's
 * kept, and how to exercise the access/erasure rights Articles 99/101
 * give a user. See docs/PRIVACY-AUDIT.md for the audit this came out of.
 */
export function PrivacyPolicyScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.updated}>Last updated when this screen was written — replace with a real date before launch.</Text>

      <Section title="What we collect">
        Your name, email, and optionally your phone number when you sign up. Your wallet balance and transaction
        history, once wallet features are live. The names and target amounts of goals you create, and any progress
        you log against them. Details of any insurance policy you ask us to refer you for (provider, coverage, and
        premium amounts — never health information; see "Insurance referrals" below). The topic you enter when
        booking a Money Coach session.
      </Section>

      <Section title="What we don't collect">
        We don't collect health, genetic, or sex-life data (Law 81/2018, Arts. 91/97 give this "sensitive data" extra
        protection) — but the goal name and coaching-session topic fields are free text, so please don't type
        anything like that into them. If you do, you can remove it at any time by deleting the goal/booking, or your
        whole account (see "Your rights" below).
      </Section>

      <Section title="Who we share it with">
        An insurer you ask us to refer you to, if you request a quote — we share only the policy details above, and
        the insurer then deals with you directly for underwriting and billing. A card processor, to charge Money
        Coach session fees. Once a licensed banking partner is integrated for wallet features (see
        docs/PHASED-LAUNCH.md in the project repo), that partner, for processing deposits and withdrawals. We do not
        sell your data, and we do not use it for marketing.
      </Section>

      <Section title="How long we keep it">
        Today, until you delete your account — Phase 1 (see docs/PHASED-LAUNCH.md in the project repo) doesn't
        involve a licensed banking relationship, so "Delete my account" erases everything immediately, with nothing
        held back. Law 81/2018 itself sets no fixed retention term (Art. 90 ties it to the purpose declared for the
        processing), so this immediate deletion is the real policy, not a placeholder.{"\n\n"}
        This will change for wallet data specifically once a licensed banking/e-wallet partner is integrated: Law
        44/2015 on Anti-Money Laundering, as implemented through Banque du Liban circulars, requires a regulated
        financial institution to keep customer account and transaction records for five years after the account
        closes. From that point on, deleting your account will anonymize your profile immediately but keep
        wallet/transaction records (not readable goal names or coaching-session topics, which are scrubbed) for that
        five-year window before they're purged for good.
      </Section>

      <Section title="Your rights">
        Under Law 81/2018 you can see everything we hold on you and delete your account entirely, both from the
        Profile tab — look for "Export my data" and "Delete my account." We don't have a dedicated data protection
        authority in Lebanon to complain to; disputes go through the ordinary courts (Art. 102).
      </Section>

      <Section title="Where this is hosted">
        During development, this runs on infrastructure you control directly — there's no real host to name yet, so
        we're not going to pretend there is one. Legal commentary is split on whether Law 81/2018 even directly
        regulates sending personal data outside Lebanon; some readings describe conditions (an adequately protective
        destination country, safeguards, your explicit consent, or government approval), others say the law is
        silent. Either way, once this runs on real infrastructure, this section will name the actual provider and
        country and will only use a host with real security/data-protection commitments — not just whatever's
        cheapest.
      </Section>

      <Section title="Questions">
        This is a development build without a support inbox yet — add a real contact method here before launch.
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionBody}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  updated: { fontSize: 11, color: colors.textSecondary, fontStyle: "italic" },
  section: { gap: 4 },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: colors.textPrimary },
  sectionBody: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
});
