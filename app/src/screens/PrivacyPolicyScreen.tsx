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
        Until you delete your account, at which point everything you own is permanently deleted (see "Your rights").
        We don't currently have a separate shorter retention schedule — if Lebanese financial recordkeeping rules
        require certain transaction records to be kept longer once wallet/KYC features are live, that requirement
        will be added here and will override your deletion request only to that limited extent.
      </Section>

      <Section title="Your rights">
        Under Law 81/2018 you can see everything we hold on you and delete your account entirely, both from the
        Profile tab — look for "Export my data" and "Delete my account." We don't have a dedicated data protection
        authority in Lebanon to complain to; disputes go through the ordinary courts (Art. 102).
      </Section>

      <Section title="Where this is hosted">
        During development, this runs on infrastructure you control directly. Before this app is used by anyone
        other than its developers, this section will name the actual hosting provider and country, since that's a
        cross-border transfer disclosure Law 81/2018 expects.
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
