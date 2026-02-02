import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useAdvancedMarkerRef,
} from "@vis.gl/react-google-maps";
import { useState } from "react";
import type { GympassFacility } from "../types/gympass";
import { PLAN_COLORS } from "../types/gympass";

interface GoogleMapProps {
  facilities: GympassFacility[];
  selectedPlans: string[];
  center?: { lat: number; lng: number };
  zoom?: number;
}

function MarkerWithInfoWindow({ facility }: { facility: GympassFacility }) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [infoWindowOpen, setInfoWindowOpen] = useState(false);

  const color = PLAN_COLORS[facility.minPlanName] || "#6b7280";

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: facility.latitude!, lng: facility.longitude! }}
        onMouseEnter={() => setInfoWindowOpen(true)}
        onMouseLeave={() => setInfoWindowOpen(false)}
      >
        <div
          style={{
            backgroundColor: color,
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            border: "3px solid white",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: "10px",
              height: "10px",
              backgroundColor: "white",
              borderRadius: "50%",
            }}
          />
        </div>
      </AdvancedMarker>

      {infoWindowOpen && (
        <InfoWindow
          anchor={marker}
          onCloseClick={() => setInfoWindowOpen(false)}
          headerDisabled
        >
          <div className="p-2 max-w-[240px]">
            <h3 className="font-bold text-sm mb-1">{facility.name}</h3>

            <div className="flex items-center gap-1 mb-1">
              <span
                className="px-2 py-0.5 rounded-full text-white text-xs font-medium"
                style={{ backgroundColor: color }}
              >
                {facility.minPlanName}
              </span>
              {facility.rating > 0 && (
                <span className="text-xs text-gray-600">
                  ⭐ {facility.rating.toFixed(1)}
                </span>
              )}
            </div>

            <p className="text-gray-600 text-xs mb-1">{facility.fullAddress}</p>

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
        </InfoWindow>
      )}
    </>
  );
}

export function GoogleMap({
  facilities,
  selectedPlans,
  center = { lat: 40.7128, lng: -74.006 },
  zoom = 11,
}: GoogleMapProps) {
  const filteredFacilities = facilities.filter(
    (facility) =>
      facility.latitude &&
      facility.longitude &&
      selectedPlans.includes(facility.minPlanName),
  );

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={center}
        defaultZoom={zoom}
        mapId="gympass-map"
        style={{ width: "100%", height: "600px" }}
        gestureHandling="greedy"
        disableDefaultUI={false}
        clickableIcons={false}
      >
        {filteredFacilities.map((facility) => (
          <MarkerWithInfoWindow key={facility.id} facility={facility} />
        ))}
      </Map>
    </APIProvider>
  );
}
