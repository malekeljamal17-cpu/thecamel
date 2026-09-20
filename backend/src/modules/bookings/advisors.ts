export interface AdvisorSeed {
  name: string;
  title: string;
  bio: string;
  specialties: string;
}

export const ADVISOR_CATALOG: AdvisorSeed[] = [
  {
    name: "Nadine Khoury",
    title: "Certified Financial Planner",
    bio: "12 years advising Lebanese households on budgeting, debt payoff and dollar/LBP diversification.",
    specialties: "budgeting,debt,currency-risk",
  },
  {
    name: "Rami Abou Fakher",
    title: "Insurance & Retirement Specialist",
    bio: "Helps clients structure life and savings-plan policies alongside their long-term goals.",
    specialties: "insurance,retirement,goal-planning",
  },
  {
    name: "Sarah Matta",
    title: "Small Business & Freelancer Advisor",
    bio: "Focuses on cash-flow planning for freelancers and small business owners receiving payments via Wish Money/OMT.",
    specialties: "cash-flow,freelance,remittances",
  },
];
