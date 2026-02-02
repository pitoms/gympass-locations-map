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

// GraphQL queries
const PLANS_SUMMARY_QUERY = {
  operationName: "plansSummary",
  variables: {
    limit: 100,
  },
  query: `query plansSummary($customLocation: PlansSummaryGeolocation, $deviceLocation: PlansSummaryGeolocation, $limit: Int) @flow(name: "plan-management") {
    plansSummary(
      customLocation: $customLocation
      deviceLocation: $deviceLocation
      limit: $limit
    ) {
      searchId
      totalFacilities
      searchType
      searchRadius {
        formattedValue
        value
        __typename
      }
      plans {
        planId
        totalApps
        totalFacilities
        newFacilitiesCount
        facilities {
          id
          name
          imageUrl
          minPlan {
            id
            __typename
          }
          __typename
        }
        apps {
          id
          name
          slug
          imageUrl
          minPlan {
            id
            __typename
          }
          __typename
        }
        __typename
      }
      __typename
    }
  }`,
};

// Placeholder - we need to capture the actual facility details query from browser
// Look for this in Network tab when clicking on a gym
const FACILITY_DETAILS_QUERY = {
  operationName: "facilityDetails",
  variables: {
    facilityId: "",
  },
  query: `query facilityDetails($facilityId: ID!) {
    facility(id: $facilityId) {
      id
      name
      address {
        street
        city
        state
        zipCode
        country
        latitude
        longitude
        __typename
      }
      phone
      amenities
      hours
      imageUrl
      __typename
    }
  }`,
};

class GympassScraper {
  constructor(bearerToken) {
    this.bearerToken = bearerToken;
    this.facilities = new Map();
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

  async fetchPlansSummary(location = null) {
    const query = { ...PLANS_SUMMARY_QUERY };

    if (location) {
      query.variables.customLocation = {
        latitude: location.lat,
        longitude: location.lng,
      };
    }

    const response = await this.makeRequest([query]);
    return response[0]?.data?.plansSummary;
  }

  async fetchFacilityDetails(facilityId) {
    const query = {
      ...FACILITY_DETAILS_QUERY,
      variables: { facilityId },
    };

    const response = await this.makeRequest([query]);
    return response[0]?.data?.facility;
  }

  async scrapeFacilitiesByLocation(location) {
    console.log(
      `Scraping facilities for location: ${location?.zipCode || "default"}`,
    );

    const summary = await this.fetchPlansSummary(location);

    if (!summary || !summary.plans) {
      console.log("No plans found for this location");
      return;
    }

    console.log(`Found ${summary.totalFacilities} total facilities`);
    console.log(`Plans available: ${summary.plans.length}`);

    for (const plan of summary.plans) {
      console.log(
        `\nProcessing plan ${plan.planId}: ${plan.totalFacilities} facilities`,
      );

      for (const facility of plan.facilities || []) {
        if (!this.facilities.has(facility.id)) {
          // Fetch detailed info for this facility
          try {
            const details = await this.fetchFacilityDetails(facility.id);

            if (details && details.address) {
              this.facilities.set(facility.id, {
                id: facility.id,
                name: facility.name,
                imageUrl: facility.imageUrl,
                minPlanId: facility.minPlan?.id,
                address: details.address.street,
                city: details.address.city,
                state: details.address.state,
                zipCode: details.address.zipCode,
                latitude: details.address.latitude,
                longitude: details.address.longitude,
                phone: details.phone,
                amenities: details.amenities || [],
                hours: details.hours,
              });

              console.log(
                `  ✓ ${facility.name} - ${details.address.city}, ${details.address.state}`,
              );
            }
          } catch (error) {
            console.error(
              `  ✗ Failed to fetch details for ${facility.name}:`,
              error.message,
            );
          }

          // Rate limiting - wait 100ms between requests
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
    }
  }

  async saveData() {
    await fs.mkdir(DATA_DIR, { recursive: true });

    const data = {
      facilities: Array.from(this.facilities.values()),
      lastUpdated: new Date().toISOString(),
      totalCount: this.facilities.size,
    };

    await fs.writeFile(OUTPUT_FILE, JSON.stringify(data, null, 2));
    console.log(`\n✓ Saved ${data.totalCount} facilities to ${OUTPUT_FILE}`);
  }
}

// Test with current location first
async function testScraper() {
  const token = process.env.GYMPASS_BEARER_TOKEN;

  if (!token) {
    console.error("Error: GYMPASS_BEARER_TOKEN not found in .env file");
    process.exit(1);
  }

  const scraper = new GympassScraper(token);

  console.log("Testing Gympass scraper...\n");

  // Test with default location first
  await scraper.scrapeFacilitiesByLocation(null);

  await scraper.saveData();
}

testScraper().catch(console.error);
