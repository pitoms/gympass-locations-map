import cron from "node-cron";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🕐 Gympass Scraper Scheduler Started");
console.log("📅 Schedule: Daily at 3:00 AM EST");
console.log("🔄 Next run will scrape all 63 US cities\n");

// Schedule to run daily at 3:00 AM EST
// Cron format: minute hour day month dayOfWeek
cron.schedule(
  "0 3 * * *",
  () => {
    console.log(
      `\n⏰ [${new Date().toISOString()}] Starting scheduled nationwide scrape...`,
    );

    const scraperPath = path.join(__dirname, "scrape-nationwide.js");
    const scraper = spawn("node", [scraperPath], {
      stdio: "inherit",
      cwd: path.join(__dirname, ".."),
    });

    scraper.on("close", (code) => {
      if (code === 0) {
        console.log(
          `✅ [${new Date().toISOString()}] Scheduled scrape completed successfully`,
        );
      } else {
        console.error(
          `❌ [${new Date().toISOString()}] Scheduled scrape failed with code ${code}`,
        );
      }
    });

    scraper.on("error", (error) => {
      console.error(`❌ [${new Date().toISOString()}] Scraper error:`, error);
    });
  },
  {
    timezone: "America/New_York",
  },
);

// Keep the process running
process.on("SIGINT", () => {
  console.log("\n👋 Scheduler stopped");
  process.exit(0);
});

console.log("✅ Scheduler is running. Press Ctrl+C to stop.\n");
