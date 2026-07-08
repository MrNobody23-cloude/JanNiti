import { Client, Language, AddressType, type GeocodeResult } from "@googlemaps/google-maps-services-js";
import { env } from "@/config/env";

export interface GeocodingResult {
  lat: number;
  lng: number;
  formattedAddress: string;
  placeId: string;
  components: {
    village?: string;
    subDistrict?: string;
    district?: string;
    state?: string;
    country?: string;
    pincode?: string;
  };
  confidence: "high" | "medium" | "low";
}

export interface ReverseGeocodingResult {
  formattedAddress: string;
  placeId: string;
  components: {
    village?: string;
    subDistrict?: string;
    district?: string;
    state?: string;
    pincode?: string;
  };
}

/**
 * Geocoding service using Google Maps API.
 * Converts addresses to coordinates and vice versa for mapping citizen submissions.
 */
export class GeocodingService {
  private client: Client;

  constructor() {
    this.client = new Client({});
  }

  /**
   * Convert an address/location string to coordinates.
   */
  async geocode(address: string, regionBias?: string): Promise<GeocodingResult | null> {
    try {
      const response = await this.client.geocode({
        params: {
          address,
          key: env.GOOGLE_MAPS_API_KEY,
          region: regionBias ?? "in", // Default bias to India
          language: "en",
        },
      });

      if (response.data.results.length === 0) {
        return null;
      }

      const result = response.data.results[0];
      return this.mapGeocodeResult(result);
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    }
  }

  /**
   * Convert coordinates to a human-readable address.
   */
  async reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodingResult | null> {
    try {
      const response = await this.client.reverseGeocode({
        params: {
          latlng: { lat, lng },
          key: env.GOOGLE_MAPS_API_KEY,
          language: Language.en,
          result_type: [AddressType.locality, AddressType.sublocality, AddressType.political],
        },
      });

      if (response.data.results.length === 0) {
        return null;
      }

      const result = response.data.results[0];
      const components = this.extractAddressComponents(result);

      return {
        formattedAddress: result.formatted_address,
        placeId: result.place_id,
        components,
      };
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return null;
    }
  }

  /**
   * Geocode with constituency context (appends district/state for better accuracy).
   */
  async geocodeInConstituency(params: {
    locationText: string;
    district: string;
    state: string;
  }): Promise<GeocodingResult | null> {
    const { locationText, district, state } = params;

    // Try with full context first
    const fullAddress = `${locationText}, ${district}, ${state}, India`;
    const result = await this.geocode(fullAddress);

    if (result && result.confidence !== "low") {
      return result;
    }

    // Fallback: try with just district and state
    const fallbackAddress = `${locationText}, ${state}, India`;
    return this.geocode(fallbackAddress);
  }

  /**
   * Calculate distance between two points (Haversine formula).
   */
  calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Find submissions within a radius of a point.
   * Returns a SQL-compatible bounding box for initial filtering.
   */
  getBoundingBox(lat: number, lng: number, radiusKm: number): {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  } {
    const latDelta = radiusKm / 111.32; // 1 degree lat ≈ 111.32 km
    const lngDelta = radiusKm / (111.32 * Math.cos(this.toRad(lat)));

    return {
      minLat: lat - latDelta,
      maxLat: lat + latDelta,
      minLng: lng - lngDelta,
      maxLng: lng + lngDelta,
    };
  }

  /**
   * Batch geocode multiple addresses.
   */
  async batchGeocode(
    addresses: Array<{ id: string; address: string }>
  ): Promise<Map<string, GeocodingResult | null>> {
    const results = new Map<string, GeocodingResult | null>();

    // Process sequentially to respect rate limits
    for (const item of addresses) {
      const result = await this.geocode(item.address);
      results.set(item.id, result);

      // Rate limiting: Google allows 50 QPS, but we'll be conservative
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return results;
  }

  private mapGeocodeResult(result: GeocodeResult): GeocodingResult {
    const { lat, lng } = result.geometry.location;
    const components = this.extractAddressComponents(result);

    // Determine confidence based on location type
    let confidence: "high" | "medium" | "low" = "medium";
    if (result.geometry.location_type === "ROOFTOP") {
      confidence = "high";
    } else if (result.geometry.location_type === "GEOMETRIC_CENTER") {
      confidence = "medium";
    } else if (result.geometry.location_type === "APPROXIMATE") {
      confidence = "low";
    }

    return {
      lat,
      lng,
      formattedAddress: result.formatted_address,
      placeId: result.place_id,
      components,
      confidence,
    };
  }

  private extractAddressComponents(result: GeocodeResult): GeocodingResult["components"] {
    const components: GeocodingResult["components"] = {};

    for (const component of result.address_components) {
      const types = component.types as string[];
      if (types.includes("locality") || types.includes("village")) {
        components.village = component.long_name;
      }
      if (types.includes("administrative_area_level_3")) {
        components.subDistrict = component.long_name;
      }
      if (types.includes("administrative_area_level_2")) {
        components.district = component.long_name;
      }
      if (types.includes("administrative_area_level_1")) {
        components.state = component.long_name;
      }
      if (types.includes("country")) {
        components.country = component.long_name;
      }
      if (types.includes("postal_code")) {
        components.pincode = component.long_name;
      }
    }

    return components;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

// Singleton instance
export const geocodingService = new GeocodingService();
