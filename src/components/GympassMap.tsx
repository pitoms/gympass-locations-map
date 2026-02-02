import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { GympassFacility } from "../types/gympass";
import { PLAN_COLORS } from "../types/gympass";

interface GympassMapProps {
  facilities: GympassFacility[];
  selectedPlans: string[];
  center?: [number, number];
  zoom?: number;
}

const createMarkerIcon = (planName: string): L.DivIcon => {
  const color = PLAN_COLORS[planName] || "#6b7280";

  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: ${color};
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 12px;
          height: 12px;
          background-color: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

export function GympassMap({
  facilities,
  selectedPlans,
  center = [40.7128, -74.006],
  zoom = 11,
}: GympassMapProps) {
  const filteredFacilities = facilities.filter(
    (facility) =>
      facility.latitude &&
      facility.longitude &&
      selectedPlans.includes(facility.minPlanName),
  );

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="w-full h-full"
      style={{ minHeight: "600px" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {filteredFacilities.map((facility) => (
        <Marker
          key={facility.id}
          position={[facility.latitude!, facility.longitude!]}
          icon={createMarkerIcon(facility.minPlanName)}
          eventHandlers={{
            mouseover: (e) => {
              e.target.openPopup();
            },
            mouseout: (e) => {
              e.target.closePopup();
            },
          }}
        >
          <Popup
            maxWidth={240}
            closeButton={false}
            autoPan={false}
            keepInView={false}
          >
            <div className="p-2">
              <h3 className="font-bold text-sm mb-1">{facility.name}</h3>

              <div className="flex items-center gap-1 mb-1">
                <span
                  className="px-2 py-0.5 rounded-full text-white text-xs font-medium"
                  style={{
                    backgroundColor:
                      PLAN_COLORS[facility.minPlanName] || "#6b7280",
                  }}
                >
                  {facility.minPlanName}
                </span>
                {facility.rating > 0 && (
                  <span className="text-xs text-gray-600">
                    ⭐ {facility.rating.toFixed(1)}
                  </span>
                )}
              </div>

              <p className="text-gray-600 text-xs mb-1">
                {facility.fullAddress}
              </p>

              {facility.activities.length > 0 && (
                <div className="mt-1 pt-1 border-t border-gray-200">
                  <div className="flex flex-wrap gap-1">
                    {facility.activities.slice(0, 3).map((activity, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.5 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        {activity}
                      </span>
                    ))}
                    {facility.activities.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{facility.activities.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
