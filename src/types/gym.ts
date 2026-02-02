export type PlanTier = "basic" | "standard" | "premium";

export interface Gym {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  planTiers: PlanTier[];
  amenities: string[];
  phone?: string;
  hours?: string;
}

export interface GymData {
  gyms: Gym[];
  lastUpdated: string;
  totalCount: number;
}

export const PLAN_TIER_COLORS: Record<PlanTier, string> = {
  basic: "#22c55e", // green
  standard: "#3b82f6", // blue
  premium: "#a855f7", // purple
};

export const PLAN_TIER_LABELS: Record<PlanTier, string> = {
  basic: "Basic",
  standard: "Standard",
  premium: "Premium",
};
