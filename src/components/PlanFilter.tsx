import { PLAN_COLORS, PLAN_ORDER, getIncludedPlans } from "../types/gympass";
import { Layers, Square } from "lucide-react";

interface PlanFilterProps {
  selectedPlan: string;
  onPlanChange: (plan: string) => void;
  facilityCounts: Record<string, number>;
  isCumulativeMode: boolean;
  onModeChange: (isCumulative: boolean) => void;
}

const ALL_PLANS = PLAN_ORDER;

export function PlanFilter({
  selectedPlan,
  onPlanChange,
  facilityCounts,
  isCumulativeMode,
  onModeChange,
}: PlanFilterProps) {
  const selectPlan = (plan: string) => {
    onPlanChange(plan);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="mb-3">
        <h3 className="font-semibold text-gray-800">Select Plan Tier</h3>
        <p className="text-xs text-gray-500 mt-1">
          Click to view facilities for a specific tier
        </p>
      </div>

      <div className="mb-3 flex gap-2">
        <button
          onClick={() => onModeChange(true)}
          className={`
            flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
            ${
              isCumulativeMode
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }
          `}
        >
          <Layers size={16} />
          Cumulative
        </button>
        <button
          onClick={() => onModeChange(false)}
          className={`
            flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
            ${
              !isCumulativeMode
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }
          `}
        >
          <Square size={16} />
          Exclusive
        </button>
      </div>

      <div className="space-y-2">
        {ALL_PLANS.map((plan) => {
          // Calculate count based on mode
          const count = isCumulativeMode
            ? getIncludedPlans(plan).reduce(
                (sum, p) => sum + (facilityCounts[p] || 0),
                0,
              )
            : facilityCounts[plan] || 0;
          const isSelected = selectedPlan === plan;

          return (
            <button
              key={plan}
              onClick={() => selectPlan(plan)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                ${
                  isSelected
                    ? "bg-gray-50 ring-2 ring-offset-1"
                    : "hover:bg-gray-50"
                }
              `}
              style={
                {
                  "--tw-ring-color": isSelected ? PLAN_COLORS[plan] : undefined,
                } as React.CSSProperties
              }
            >
              <div
                className={`
                  w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center
                  ${isSelected ? "border-transparent" : "border-gray-300"}
                `}
                style={{
                  backgroundColor: isSelected ? PLAN_COLORS[plan] : undefined,
                }}
              >
                {isSelected && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
              <span className="font-medium text-gray-700 flex-1 text-left">
                {plan}
              </span>
              <span className="text-sm text-gray-500">{count}</span>
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: PLAN_COLORS[plan] }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
