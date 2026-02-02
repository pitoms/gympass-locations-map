import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Gym, PlanTier } from "../types/gym";
import { PLAN_TIER_COLORS, PLAN_TIER_LABELS } from "../types/gym";

interface GymMapProps {
  gyms: Gym[];
  selectedTiers: PlanTier[];
  center?: [number, number];
  zoom?: number;
}

// Create custom marker icons for each tier
const createMarkerIcon = (tiers: PlanTier[]): L.DivIcon => {
  // Use the highest tier color
  const tierPriority: PlanTier[] = ["premium", "standard", "basic"];
  const highestTier = tierPriority.find((t) => tiers.includes(t)) || "basic";
  const color = PLAN_TIER_COLORS[highestTier];

  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

export function GymMap({
  gyms,
  selectedTiers,
  center = [39.8283, -98.5795],
  zoom = 4,
}: GymMapProps) {
  // Filter gyms based on selected tiers
  const filteredGyms = gyms.filter((gym) =>
    gym.planTiers.some((tier) => selectedTiers.includes(tier)),
  );

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="w-full h-full"
      style={{ minHeight: "500px" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {filteredGyms.map((gym) => (
        <Marker
          key={gym.id}
          position={[gym.latitude, gym.longitude]}
          icon={createMarkerIcon(gym.planTiers)}
        >
          <Popup>
            <div className="p-2 min-w-[200px]">
              <h3 className="font-bold text-lg mb-1">{gym.name}</h3>
              <p className="text-gray-600 text-sm mb-2">
                {gym.address}
                <br />
                {gym.city}, {gym.state} {gym.zipCode}
              </p>

              <div className="flex flex-wrap gap-1 mb-2">
                {gym.planTiers.map((tier) => (
                  <span
                    key={tier}
                    className="px-2 py-0.5 rounded-full text-white text-xs font-medium"
                    style={{ backgroundColor: PLAN_TIER_COLORS[tier] }}
                  >
                    {PLAN_TIER_LABELS[tier]}
                  </span>
                ))}
              </div>

              {gym.amenities.length > 0 && (
                <div className="text-xs text-gray-500 mb-2">
                  <strong>Amenities:</strong> {gym.amenities.join(", ")}
                </div>
              )}

              {gym.phone && (
                <p className="text-xs text-gray-500">
                  <strong>Phone:</strong> {gym.phone}
                </p>
              )}

              {gym.hours && (
                <p className="text-xs text-gray-500">
                  <strong>Hours:</strong> {gym.hours}
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
