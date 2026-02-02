import { Check } from "lucide-react";
import type { PlanTier } from "../types/gym";
import { PLAN_TIER_COLORS, PLAN_TIER_LABELS } from "../types/gym";

interface TierFilterProps {
  selectedTiers: PlanTier[];
  onTierChange: (tiers: PlanTier[]) => void;
}

const ALL_TIERS: PlanTier[] = ["basic", "standard", "premium"];

export function TierFilter({ selectedTiers, onTierChange }: TierFilterProps) {
  const toggleTier = (tier: PlanTier) => {
    if (selectedTiers.includes(tier)) {
      onTierChange(selectedTiers.filter((t) => t !== tier));
    } else {
      onTierChange([...selectedTiers, tier]);
    }
  };

  const selectAll = () => onTierChange([...ALL_TIERS]);
  const clearAll = () => onTierChange([]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">Plan Tiers</h3>
        <div className="flex gap-2 text-xs">
          <button
            onClick={selectAll}
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            All
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={clearAll}
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            None
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {ALL_TIERS.map((tier) => (
          <button
            key={tier}
            onClick={() => toggleTier(tier)}
            className={`
              w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all
              ${
                selectedTiers.includes(tier)
                  ? "bg-gray-100 ring-2 ring-offset-1"
                  : "hover:bg-gray-50"
              }
            `}
            style={{
              ringColor: selectedTiers.includes(tier)
                ? PLAN_TIER_COLORS[tier]
                : undefined,
            }}
          >
            <div
              className={`
                w-5 h-5 rounded flex items-center justify-center
                ${selectedTiers.includes(tier) ? "text-white" : "border-2 border-gray-300"}
              `}
              style={{
                backgroundColor: selectedTiers.includes(tier)
                  ? PLAN_TIER_COLORS[tier]
                  : undefined,
              }}
            >
              {selectedTiers.includes(tier) && <Check size={14} />}
            </div>
            <span className="font-medium text-gray-700">
              {PLAN_TIER_LABELS[tier]}
            </span>
            <div
              className="w-3 h-3 rounded-full ml-auto"
              style={{ backgroundColor: PLAN_TIER_COLORS[tier] }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
