import axios from "axios";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const GYMPASS_API = "https://mobile-api.gympass.com/enduser/v1/frontdoor";
const DATA_DIR = path.join(__dirname, "..", "data");
const OUTPUT_FILE = path.join(DATA_DIR, "gympass-facilities.json");

// GraphQL query to search facilities with full address
const SEARCH_FACILITIES_QUERY = {
  operationName: "searchExploreApps",
  variables: {
    planId: "",
    customLocation: null,
    deviceLocation: null,
  },
  query: `query searchExploreApps($planId: ID!, $customLocation: PlansSummaryGeolocation, $deviceLocation: PlansSummaryGeolocation) @flow(name: "plan-management") {
    exploreSearch(
      entityType: facility
      limit: 50
      planId: $planId
      customLocation: $customLocation
      deviceLocation: $deviceLocation
    ) {
      searchId
      total: totalFacilities
      items: facilities {
        id
        name
        partnerLogo: imageUrl
        distance
        formattedDistance
        coverImage: partnerPhoto
        fullAddress
        rating
        activities {
          id
          name
          __typename
        }
        minPlan {
          id
          name
          __typename
        }
        exclusivity {
          isOnlyAt
          isContractual
          __typename
        }
        tags {
          slug
          __typename
        }
        isNew
        __typename
      }
      __typename
    }
  }`,
};

// Query to get all plan IDs
const PLANS_SUMMARY_QUERY = {
  operationName: "plansSummary",
  variables: {
    limit: 5,
  },
  query: `query plansSummary($customLocation: PlansSummaryGeolocation, $deviceLocation: PlansSummaryGeolocation, $limit: Int) @flow(name: "plan-management") {
    plansSummary(
      customLocation: $customLocation
      deviceLocation: $deviceLocation
      limit: $limit
    ) {
      searchId
      totalFacilities
      plans {
        planId
        totalFacilities
        __typename
      }
      __typename
    }
  }`,
};

class GympassScraper {
  constructor(bearerToken, googleMapsApiKey = null) {
    this.bearerToken = bearerToken;
    this.googleMapsApiKey = googleMapsApiKey;
    this.facilities = new Map();
    this.planNames = new Map();
  }

  async makeRequest(queries) {
    try {
      const response = await axios.post(GYMPASS_API, queries, {
        headers: {
          Authorization: `Bearer ${this.bearerToken}`,
          "Content-Type": "application/json",
          Accept: "*/*",
          Origin: "https://plan-management.gympass.com",
          Referer: "https://plan-management.gympass.com/",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          timezone: "America/New_York",
        },
      });
      return response.data;
    } catch (error) {
      console.error(
        "API Request failed:",
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  async geocodeAddress(address) {
    if (!this.googleMapsApiKey) {
      console.log("  ⚠ No Google Maps API key, skipping geocoding");
      return null;
    }

    try {
      const response = await axios.get(
        "https://maps.googleapis.com/maps/api/geocode/json",
        {
          params: {
            address: address,
            key: this.googleMapsApiKey,
          },
        },
      );

      if (response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        const location = result.geometry.location;

        // Extract address components
        const components = {};
        result.address_components.forEach((comp) => {
          if (comp.types.includes("postal_code")) {
            components.zipCode = comp.long_name;
          }
          if (comp.types.includes("locality")) {
            components.city = comp.long_name;
          }
          if (comp.types.includes("administrative_area_level_1")) {
            components.state = comp.short_name;
          }
          if (comp.types.includes("route")) {
            components.street = comp.long_name;
          }
          if (comp.types.includes("street_number")) {
            components.streetNumber = comp.long_name;
          }
        });

        return {
          latitude: location.lat,
          longitude: location.lng,
          formattedAddress: result.formatted_address,
          ...components,
        };
      }
      return null;
    } catch (error) {
      console.error(`  ✗ Geocoding failed for "${address}":`, error.message);
      return null;
    }
  }

  async fetchPlanIds() {
    console.log("Fetching available plan IDs...");
    const response = await this.makeRequest([PLANS_SUMMARY_QUERY]);
    const summary = response[0]?.data?.plansSummary;

    if (!summary || !summary.plans) {
      throw new Error("Failed to fetch plan IDs");
    }

    const planIds = summary.plans.map((p) => p.planId);
    console.log(
      `Found ${planIds.length} plans with ${summary.totalFacilities} total facilities\n`,
    );

    return planIds;
  }

  async searchFacilitiesByPlan(planId, location = null) {
    const query = {
      ...SEARCH_FACILITIES_QUERY,
      variables: {
        planId,
        customLocation: location,
        deviceLocation: location,
      },
    };

    const response = await this.makeRequest([query]);
    const searchResult = response[0]?.data?.exploreSearch;

    return searchResult;
  }

  async scrapeAllFacilities(location = null) {
    const planIds = await this.fetchPlanIds();

    for (const planId of planIds) {
      console.log(`\nScraping facilities for plan: ${planId}`);

      const searchResult = await this.searchFacilitiesByPlan(planId, location);

      if (!searchResult || !searchResult.items) {
        console.log("  No facilities found for this plan");
        continue;
      }

      console.log(
        `  Found ${searchResult.total} facilities (showing ${searchResult.items.length})`,
      );

      for (const facility of searchResult.items) {
        if (!this.facilities.has(facility.id)) {
          console.log(`  Processing: ${facility.name}`);

          // Geocode the address if we have Google Maps API
          let geocoded = null;
          if (facility.fullAddress && this.googleMapsApiKey) {
            geocoded = await this.geocodeAddress(facility.fullAddress);
            // Rate limit for Google Maps API
            await new Promise((resolve) => setTimeout(resolve, 100));
          }

          this.facilities.set(facility.id, {
            id: facility.id,
            name: facility.name,
            imageUrl: facility.partnerLogo,
            coverImage: facility.coverImage,
            fullAddress: facility.fullAddress,
            rating: facility.rating,
            distance: facility.distance,
            formattedDistance: facility.formattedDistance,
            minPlanId: facility.minPlan?.id,
            minPlanName: facility.minPlan?.name,
            activities: facility.activities?.map((a) => a.name) || [],
            isNew: facility.isNew,
            tags: facility.tags?.map((t) => t.slug) || [],
            // Geocoded data
            latitude: geocoded?.latitude,
            longitude: geocoded?.longitude,
            city: geocoded?.city,
            state: geocoded?.state,
            zipCode: geocoded?.zipCode,
          });

          console.log(`    ✓ ${facility.fullAddress}`);
          if (geocoded) {
            console.log(`    📍 ${geocoded.latitude}, ${geocoded.longitude}`);
          }
        }
      }

      // Rate limiting between plans
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  async saveData() {
    await fs.mkdir(DATA_DIR, { recursive: true });

    const data = {
      facilities: Array.from(this.facilities.values()),
      lastUpdated: new Date().toISOString(),
      totalCount: this.facilities.size,
      hasCoordinates: Array.from(this.facilities.values()).filter(
        (f) => f.latitude && f.longitude,
      ).length,
    };

    await fs.writeFile(OUTPUT_FILE, JSON.stringify(data, null, 2));
    console.log(`\n✓ Saved ${data.totalCount} facilities to ${OUTPUT_FILE}`);
    console.log(`  ${data.hasCoordinates} facilities have coordinates`);
  }
}

async function main() {
  const token = process.env.GYMPASS_BEARER_TOKEN;
  const googleMapsKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!token) {
    console.error("Error: GYMPASS_BEARER_TOKEN not found in .env file");
    process.exit(1);
  }

  if (!googleMapsKey) {
    console.warn("Warning: GOOGLE_MAPS_API_KEY not found in .env file");
    console.warn("Facilities will be saved without coordinates\n");
  }

  const scraper = new GympassScraper(token, googleMapsKey);

  console.log("Starting Gympass scraper...\n");

  await scraper.scrapeAllFacilities();
  await scraper.saveData();

  console.log("\n✓ Scraping complete!");
}

main().catch(console.error);
