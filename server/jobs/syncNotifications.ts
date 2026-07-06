
import { syncMatchesForNotifications } from "../services/matchService";
import { isFirestoreQuotaExceeded } from "../firestore/collections";

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
