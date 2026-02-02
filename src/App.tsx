import { useState, useEffect } from "react";
import { GoogleMap } from "./components/GoogleMap";
import { PlanFilter } from "./components/PlanFilter";
import type { GympassData } from "./types/gympass";
import { getIncludedPlans } from "./types/gympass";
import { MapPin, RefreshCw } from "lucide-react";

function App() {
  const [data, setData] = useState<GympassData | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>("Starter");
  const [isCumulativeMode, setIsCumulativeMode] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/data/gympass-facilities.json");
      const jsonData = await response.json();
      setData(jsonData);
    } catch (error) {
      console.error("Failed to load gym data:", error);
    } finally {
      setLoading(false);
    }
  };

  const facilityCounts =
    data?.facilities.reduce(
      (acc, facility) => {
        const plan = facility.minPlanName;
        acc[plan] = (acc[plan] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ) || {};

  const includedPlans = isCumulativeMode
    ? getIncludedPlans(selectedPlan)
    : [selectedPlan];

  const filteredCount =
    data?.facilities.filter(
      (f) => f.latitude && f.longitude && includedPlans.includes(f.minPlanName),
    ).length || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading gym locations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-6">
        <header className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">
              Gympass Locations
            </h1>
          </div>
          <p className="text-gray-600">
            Explore {data?.totalCount || 0} gym facilities across different
            Gympass plan tiers
          </p>
          {data?.lastUpdated && (
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {new Date(data.lastUpdated).toLocaleString()}
            </p>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1 space-y-4">
            <PlanFilter
              selectedPlan={selectedPlan}
              onPlanChange={setSelectedPlan}
              facilityCounts={facilityCounts}
              isCumulativeMode={isCumulativeMode}
              onModeChange={setIsCumulativeMode}
            />

            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Statistics</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Facilities:</span>
                  <span className="font-medium">{data?.totalCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Showing:</span>
                  <span className="font-medium text-blue-600">
                    {filteredCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">With Coordinates:</span>
                  <span className="font-medium">
                    {data?.hasCoordinates || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> Data is scraped daily from Gympass.
                Facilities are shown based on their minimum required plan tier.
              </p>
            </div>
          </aside>

          <main className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {data && (
                <GoogleMap
                  facilities={data.facilities}
                  selectedPlans={includedPlans}
                  center={{ lat: 40.7128, lng: -74.006 }}
                  zoom={11}
                />
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
