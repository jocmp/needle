import { Cron } from "croner";
import { refreshAllFeeds } from "./services/feed-fetcher";

console.log("Worker starting...");

// Refresh all feeds every 15 minutes
const job = new Cron("*/15 * * * *", async () => {
  console.log(`[${new Date().toISOString()}] Starting feed refresh...`);
  try {
    await refreshAllFeeds();
    console.log(`[${new Date().toISOString()}] Feed refresh completed`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Feed refresh failed:`, error);
  }
});

console.log("Worker started. Next run:", job.nextRun()?.toISOString());

// Keep the process alive
process.on("SIGINT", () => {
  console.log("Worker shutting down...");
  job.stop();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Worker shutting down...");
  job.stop();
  process.exit(0);
});
