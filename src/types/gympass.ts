export interface GympassFacility {
  id: string;
  name: string;
  imageUrl: string;
  coverImage: string;
  fullAddress: string;
  rating: number;
  distance: number;
  formattedDistance: string;
  minPlanId: string;
  minPlanName: string;
  activities: string[];
  isNew: boolean;
  tags: string[];
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface GympassData {
  facilities: GympassFacility[];
  lastUpdated: string;
  totalCount: number;
  hasCoordinates: number;
}

export const PLAN_COLORS: Record<string, string> = {
  Starter: "#10b981", // emerald
  "Starter+": "#14b8a6", // teal
  Basic: "#22c55e", // green
  Bronze: "#a16207", // yellow-700
  Silver: "#71717a", // zinc
  Gold: "#eab308", // yellow
  Platinum: "#3b82f6", // blue
  Diamond: "#8b5cf6", // violet
  Titanium: "#6366f1", // indigo
};

export const PLAN_ORDER = [
  "Starter",
  "Starter+",
  "Basic",
  "Bronze",
  "Silver",
  "Gold",
  "Platinum",
  "Diamond",
  "Titanium",
];

// Helper function to get all plans at or below a given tier
export function getIncludedPlans(selectedPlan: string): string[] {
  const selectedIndex = PLAN_ORDER.indexOf(selectedPlan);
  if (selectedIndex === -1) return [selectedPlan];

  // Return all plans from index 0 up to and including the selected plan
  return PLAN_ORDER.slice(0, selectedIndex + 1);
}

export const PLAN_IDS: Record<string, string> = {
  "1772f94a-c4f2-4664-8729-4db50623192e": "Starter",
  "ec756780-0cae-42bd-87d0-f0a6c9788596": "Essential",
  "a9fcddb3-dfdc-428b-a8f6-68e992995392": "Premium",
};
