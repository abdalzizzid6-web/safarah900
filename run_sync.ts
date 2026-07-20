import { syncMatchesFromAPI } from "./server/services/syncService";
async function run() {
  console.log("Running sync...");
  const result = await syncMatchesFromAPI();
  console.log("Sync result:", result);
  process.exit(0);
}
run();
