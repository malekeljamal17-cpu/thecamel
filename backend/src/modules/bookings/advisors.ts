export interface AdvisorSeed {
  name: string;
  title: string;
  bio: string;
  specialties: string;
}

/**
 * These are budgeting/money coaches, not investment advisors or insurance
 * brokers — titles and bios are written to stay on that side of the line.
 * A session can touch "should I set up an emergency fund before an Umrah
 * trip goal" but never "which fund/policy should I buy," which would need
 * its own license. See docs/PHASED-LAUNCH.md.
 */
export const ADVISOR_CATALOG: AdvisorSeed[] = [
  {
    name: "Nadine Khoury",
    title: "Budgeting & Debt Coach",
    bio: "12 years coaching Lebanese households on budgeting, debt payoff and planning around dollar/LBP volatility.",
    specialties: "budgeting,debt,currency-risk",
  },
  {
    name: "Rami Abou Fakher",
    title: "Goal-Planning Coach",
    bio: "Helps clients map long-term goals (retirement, a home, a child's education) and coordinates with whichever insurer or bank they already work with — doesn't sell or recommend specific policies.",
    specialties: "goal-planning,retirement,coordination",
  },
  {
    name: "Sarah Matta",
    title: "Cash-Flow Coach for Freelancers",
    bio: "Focuses on cash-flow planning for freelancers and small business owners receiving payments via Wish Money/OMT.",
    specialties: "cash-flow,freelance,remittances",
  },
];
