"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGoogleMaps } from "@/components/maps/google-maps-provider";
import { useFetch } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { MapPin, Layers, Loader2 } from "lucide-react";
import { useState, useCallback, useRef } from "react";

const STATUS_COLORS: Record<string, string> = {
  proposed: "#F59E0B",
  approved: "#3B82F6",
  in_progress: "#8B5CF6",
  completed: "#22C55E",
  on_hold: "#6B7280",
  cancelled: "#EF4444",
  pending: "#F59E0B",
  verified: "#3B82F6",
  clustered: "#8B5CF6",
  prioritized: "#6366F1",
  rejected: "#EF4444",
};

const SECTOR_COLORS: Record<string, string> = {
  healthcare: "#EF4444",
  education: "#3B82F6",
  water_sanitation: "#06B6D4",
  roads_transport: "#8B5CF6",
  agriculture: "#22C55E",
  energy_digital: "#F97316",
  housing: "#F59E0B",
  environment: "#10B981",
  social_welfare: "#EC4899",
  skill_youth: "#14B8A6",
};

const mapContainerStyle = {
  width: "100%",
  height: "560px",
  borderRadius: "12px",
};

const center = { lat: 25.3176, lng: 82.9739 }; // Varanasi

interface SubmissionPoint {
  id: string;
  lat: number;
  lng: number;
  title: string;
  sector: string;
  status: string;
  urgency: number;
  upvotes: number;
}

export default function MapIntelligencePage() {
  const { isLoaded, loadError } = useGoogleMaps();
  const [colorBy, setColorBy] = useState<"status" | "sector">("sector");
  const [selected, setSelected] = useState<SubmissionPoint | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const { data: geoData, loading } = useFetch<any>("/api/maps/hotspots", {
    params: { type: "submissions" },
  });

  const features: any[] = geoData?.features ?? [];
  const points: SubmissionPoint[] = features.map((f: any) => ({
    id: f.properties.id,
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
    title: f.properties.title ?? "Untitled",
    sector: f.properties.sector ?? "other",
    status: f.properties.status ?? "pending",
    urgency: f.properties.urgency ?? 0.5,
    upvotes: f.properties.upvotes ?? 0,
  }));

  // Sector/status counts for legend
  const counts: Record<string, number> = {};
  points.forEach(p => {
    const key = colorBy === "sector" ? p.sector : p.status;
    counts[key] = (counts[key] ?? 0) + 1;
  });

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const getMarkerColor = (point: SubmissionPoint) => {
    return colorBy === "sector"
      ? SECTOR_COLORS[point.sector] ?? "#6B7280"
      : STATUS_COLORS[point.status] ?? "#6B7280";
  };

  if (loadError) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-red-500">Failed to load Google Maps: {loadError.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 dark:bg-cyan-900/30">
            <MapPin className="h-5 w-5 text-cyan-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Map Intelligence</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {points.length} geo-located submissions across Varanasi constituency
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={colorBy === "sector" ? "primary" : "secondary"} size="sm" onClick={() => setColorBy("sector")}>
            By Sector
          </Button>
          <Button variant={colorBy === "status" ? "primary" : "secondary"} size="sm" onClick={() => setColorBy("status")}>
            By Status
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Legend */}
        <div className="space-y-4">
          <Card className="animate-slide-up">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary-500" />
                <CardTitle>{colorBy === "sector" ? "Sectors" : "Status"}</CardTitle>
              </div>
            </CardHeader>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {Object.entries(colorBy === "sector" ? SECTOR_COLORS : STATUS_COLORS)
                .filter(([key]) => (counts[key] ?? 0) > 0)
                .sort((a, b) => (counts[b[0]] ?? 0) - (counts[a[0]] ?? 0))
                .map(([key, color]) => (
                  <div key={key} className="flex items-center gap-3 rounded-lg p-2 hover:bg-[var(--bg-secondary)]">
                    <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-xs font-medium text-[var(--text-primary)] flex-1 capitalize">
                      {key.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-[var(--text-tertiary)]">{counts[key] ?? 0}</span>
                  </div>
                ))}
            </div>
          </Card>

          {/* Selected point info */}
          {selected && (
            <Card className="animate-scale-in border-primary-200 dark:border-primary-800">
              <CardHeader>
                <CardTitle className="text-sm">Selected Submission</CardTitle>
              </CardHeader>
              <div className="space-y-2">
                <p className="text-sm font-medium text-[var(--text-primary)]">{selected.title}</p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="info" size="sm">{selected.sector.replace(/_/g, " ")}</Badge>
                  <Badge variant="default" size="sm">{selected.status.replace(/_/g, " ")}</Badge>
                </div>
                <p className="text-xs text-[var(--text-tertiary)]">
                  Urgency: {(selected.urgency * 100).toFixed(0)}% · Upvotes: {selected.upvotes}
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)]">
                  {selected.lat.toFixed(4)}, {selected.lng.toFixed(4)}
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Map */}
        <div className="lg:col-span-3">
          <Card className="animate-slide-up overflow-hidden">
            {(loading || !isLoaded) && (
              <div className="flex items-center justify-center h-[560px]">
                <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
                <span className="ml-2 text-sm text-[var(--text-tertiary)]">Loading map...</span>
              </div>
            )}

            {isLoaded && !loading && (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={center}
                zoom={11}
                onLoad={onMapLoad}
                options={{
                  disableDefaultUI: false,
                  zoomControl: true,
                  streetViewControl: false,
                  mapTypeControl: false,
                  fullscreenControl: true,
                }}
              >
                {points.map((point) => (
                  <Marker
                    key={point.id}
                    position={{ lat: point.lat, lng: point.lng }}
                    onClick={() => setSelected(point)}
                    icon={{
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: 7 + point.urgency * 4,
                      fillColor: getMarkerColor(point),
                      fillOpacity: 0.8,
                      strokeColor: "#ffffff",
                      strokeWeight: 1.5,
                    }}
                    title={point.title}
                  />
                ))}

                {selected && (
                  <InfoWindow
                    position={{ lat: selected.lat, lng: selected.lng }}
                    onCloseClick={() => setSelected(null)}
                  >
                    <div style={{ maxWidth: 250, padding: 4 }}>
                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{selected.title}</h3>
                      <p style={{ margin: "4px 0", fontSize: 12, color: "#666" }}>
                        {selected.sector.replace(/_/g, " ")} · {selected.status.replace(/_/g, " ")}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: "#999" }}>
                        Urgency: {(selected.urgency * 100).toFixed(0)}% · {selected.upvotes} upvotes
                      </p>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
