"use client";

import { Autocomplete } from "@react-google-maps/api";
import { useGoogleMaps } from "./google-maps-provider";
import { MapPin, Loader2 } from "lucide-react";
import { useState, useRef, useCallback } from "react";

interface PlacesAutocompleteProps {
  onSelect: (place: { address: string; lat: number; lng: number }) => void;
  placeholder?: string;
  defaultValue?: string;
  className?: string;
}

export function PlacesAutocomplete({
  onSelect,
  placeholder = "Search for a location...",
  defaultValue = "",
  className,
}: PlacesAutocompleteProps) {
  const { isLoaded } = useGoogleMaps();
  const [value, setValue] = useState(defaultValue);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const onLoad = useCallback((autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
  }, []);

  const onPlaceChanged = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    if (place?.geometry?.location) {
      const address = place.formatted_address ?? place.name ?? "";
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      setValue(address);
      onSelect({ address, lat, lng });
    }
  }, [onSelect]);

  if (!isLoaded) {
    return (
      <div className={`flex items-center gap-2 h-9 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 ${className}`}>
        <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--text-tertiary)]" />
        <span className="text-sm text-[var(--text-tertiary)]">Loading maps...</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Autocomplete
        onLoad={onLoad}
        onPlaceChanged={onPlaceChanged}
        options={{
          componentRestrictions: { country: "in" },
          types: ["geocode", "establishment"],
        }}
      >
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full h-9 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </Autocomplete>
    </div>
  );
}
