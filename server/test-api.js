import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const GYMPASS_API = "https://mobile-api.gympass.com/enduser/v1/frontdoor";

async function testAPI() {
  const token = process.env.GYMPASS_BEARER_TOKEN;

  if (!token) {
    console.error("Error: GYMPASS_BEARER_TOKEN not found in .env file");
    process.exit(1);
  }

  console.log("Testing Gympass API with your token...\n");
  console.log("Token (first 50 chars):", token.substring(0, 50) + "...\n");

  // Test the exact query from your browser
  const query = {
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

  try {
    console.log("Making request to:", GYMPASS_API);
    console.log("Query:", query.operationName);
    console.log("Variables:", JSON.stringify(query.variables, null, 2));
    console.log("\nSending request...\n");

    const response = await axios.post(GYMPASS_API, [query], {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "*/*",
        Origin: "https://plan-management.gympass.com",
        Referer: "https://plan-management.gympass.com/",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        timezone: "America/New_York",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
      },
    });

    console.log("✓ SUCCESS! Status:", response.status);
    console.log("\nResponse data:");
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("✗ FAILED!");
    console.error("Status:", error.response?.status);
    console.error("Status Text:", error.response?.statusText);
    console.error("\nError Response:");
    console.error(JSON.stringify(error.response?.data, null, 2));
    console.error("\nFull Error:", error.message);
  }
}

testAPI();
