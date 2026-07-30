
import { syncMatchesForNotifications } from "../services/matchService.js";
import { isFirestoreQuotaExceeded } from "../firestore/collections.js";

export function startNotificationJob() {
  
  // Initial run after 1 minute
  setTimeout(() => {
    if (isFirestoreQuotaExceeded) return;
    syncMatchesForNotifications().catch(err => console.error("[Job Manager] Notification Sync Error:", err));
  }, 60 * 1000);

  // Periodic run every 20 minutes
  setInterval(() => {
    if (isFirestoreQuotaExceeded) return;
    syncMatchesForNotifications().catch(err => console.error("[Job Manager] Notification Sync Error:", err));
  }, 20 * 60 * 1000);
}
