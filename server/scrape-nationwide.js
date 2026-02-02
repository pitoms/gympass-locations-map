import axios from "axios";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { US_LOCATIONS } from "./us-locations.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const GYMPASS_API = "https://mobile-api.gympass.com/enduser/v1/frontdoor";
const DATA_DIR = path.join(__dirname, "..", "data");
const OUTPUT_FILE = path.join(DATA_DIR, "gympass-facilities.json");

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

class NationwideScraper {
  constructor(bearerToken, googleMapsApiKey = null) {
    this.bearerToken = bearerToken;
    this.googleMapsApiKey = googleMapsApiKey;
    this.facilities = new Map();
    this.processedLocations = 0;
    this.totalLocations = US_LOCATIONS.length;
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
      return null;
    }
  }

  async geocodeAddress(address) {
    if (!this.googleMapsApiKey) {
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
      return null;
    }
  }

  async fetchPlanIds(location) {
    const query = {
      ...PLANS_SUMMARY_QUERY,
      variables: {
        ...PLANS_SUMMARY_QUERY.variables,
        customLocation: { latitude: location.lat, longitude: location.lng },
        deviceLocation: { latitude: location.lat, longitude: location.lng },
      },
    };

    const response = await this.makeRequest([query]);
    if (!response || !response[0]?.data?.plansSummary) {
      return [];
    }

    return response[0].data.plansSummary.plans.map((p) => p.planId);
  }

  async searchFacilitiesByPlan(planId, location) {
    const query = {
      ...SEARCH_FACILITIES_QUERY,
      variables: {
        planId,
        customLocation: { latitude: location.lat, longitude: location.lng },
        deviceLocation: { latitude: location.lat, longitude: location.lng },
      },
    };

    const response = await this.makeRequest([query]);
    return response?.[0]?.data?.exploreSearch;
  }

  async scrapeLocation(location) {
    console.log(
      `\n[${this.processedLocations + 1}/${this.totalLocations}] Scraping ${location.city}...`,
    );

    const planIds = await this.fetchPlanIds(location);
    if (planIds.length === 0) {
      console.log(`  No plans found for ${location.city}`);
      return;
    }

    let locationFacilityCount = 0;

    for (const planId of planIds) {
      const searchResult = await this.searchFacilitiesByPlan(planId, location);

      if (!searchResult || !searchResult.items) {
        continue;
      }

      for (const facility of searchResult.items) {
        if (!this.facilities.has(facility.id)) {
          let geocoded = null;
          if (facility.fullAddress && this.googleMapsApiKey) {
            geocoded = await this.geocodeAddress(facility.fullAddress);
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
            latitude: geocoded?.latitude,
            longitude: geocoded?.longitude,
            city: geocoded?.city,
            state: geocoded?.state,
            zipCode: geocoded?.zipCode,
          });

          locationFacilityCount++;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    console.log(
      `  ✓ Found ${locationFacilityCount} new facilities in ${location.city}`,
    );
    console.log(`  Total unique facilities: ${this.facilities.size}`);

    this.processedLocations++;

    // Save progress every 10 locations
    if (this.processedLocations % 10 === 0) {
      await this.saveData();
      console.log(
        `  💾 Progress saved (${this.processedLocations}/${this.totalLocations} locations)`,
      );
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
      locationsScraped: this.processedLocations,
    };

    await fs.writeFile(OUTPUT_FILE, JSON.stringify(data, null, 2));
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
    console.warn(
      "Warning: GOOGLE_MAPS_API_KEY not found - facilities will not have coordinates",
    );
  }

  const scraper = new NationwideScraper(token, googleMapsKey);

  console.log("🇺🇸 Starting nationwide Gympass scrape...");
  console.log(`📍 Scraping ${US_LOCATIONS.length} major US cities\n`);

  for (const location of US_LOCATIONS) {
    await scraper.scrapeLocation(location);
  }

  await scraper.saveData();

  console.log("\n✅ Nationwide scraping complete!");
  console.log(`📊 Total facilities found: ${scraper.facilities.size}`);
  console.log(
    `📍 Locations scraped: ${scraper.processedLocations}/${scraper.totalLocations}`,
  );
}

main().catch(console.error);
