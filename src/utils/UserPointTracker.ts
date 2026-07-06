import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit,
  serverTimestamp 
} from 'firebase/firestore';

// Point values for different engagement activities
export const POINT_VALUES = {
  NEWS_READ: 5,         // Points for reading a news article
  MATCH_CHECK: 2,       // Points for checking match details
  CONTEST_PARTICIPATION: 15, // Points for contributing a prediction or vote
};

export interface UserProgress {
  uid: string;
  points: number;
  level: number;
  rankTitle: string;
  newsCount: number;
  matchesCount: number;
  contestsCount: number;
  lastUpdated?: string;
}

// Map points to levels: Level = Math.floor(sqrt(points / 10)) + 1
export function calculateLevel(points: number): number {
  if (points <= 0) return 1;
  return Math.floor(Math.sqrt(points / 10)) + 1;
}

// Map level/points to authentic, high-quality Arabic competitive ranks
export function getRankTitle(points: number): string {
  if (points < 50) return 'مشجع مستجد ⚽';
  if (points < 150) return 'مشجع وفي 🔥';
  if (points < 300) return 'خبير كروي 🧠';
  if (points < 500) return 'محلل ذهبي 👑';
  return 'صافرة بلاتين 🏆';
}

/**
 * Tracks an engagement activity and synchronizes with the Firestore database if logged in.
 * Fallbacks to localStorage for guest users to support seamless state preservation.
 */
export async function trackActivity(
  activityType: 'news' | 'match' | 'contest',
  activityId: string
): Promise<{ pointsAdded: number; newPoints: number; leveledUp: boolean }> {
  const pointsToAdd = 
    activityType === 'news' ? POINT_VALUES.NEWS_READ :
    activityType === 'match' ? POINT_VALUES.MATCH_CHECK :
    POINT_VALUES.CONTEST_PARTICIPATION;

  const user = auth.currentUser;
  const trackerKey = `s90_point_tracker_${activityType}_${activityId}`;
  
  // Prevent duplicate points for the exact same entity interaction
  const alreadyTracked = localStorage.getItem(trackerKey);
  if (alreadyTracked === 'true') {
    return { pointsAdded: 0, newPoints: await getCurrentUserPoints(), leveledUp: false };
  }

  // Mark as tracked locally
  localStorage.setItem(trackerKey, 'true');

  let oldPoints = 0;
  let newPoints = 0;

  if (user) {
    const userId = user.uid;
    const userDocRef = doc(db, 'users', userId);
    const publicPointsRef = doc(db, 'user_points', userId);

    try {
      // 1. Fetch current progress
      const userSnap = await getDoc(userDocRef);
      let currentProgress = {
        points: 0,
        newsCount: 0,
        matchesCount: 0,
        contestsCount: 0,
        trackedIds: [] as string[]
      };

      if (userSnap.exists()) {
        const data = userSnap.data();
        currentProgress = {
          points: data.points || 0,
          newsCount: data.newsCount || 0,
          matchesCount: data.matchesCount || 0,
          contestsCount: data.contestsCount || 0,
          trackedIds: data.trackedIds || []
        };
      }

      // Check double-tracking on server record as second guard
      const actCompositeId = `${activityType}_${activityId}`;
      if (currentProgress.trackedIds.includes(actCompositeId)) {
        return { pointsAdded: 0, newPoints: currentProgress.points, leveledUp: false };
      }

      oldPoints = currentProgress.points;
      newPoints = oldPoints + pointsToAdd;

      const incrementFields: Record<string, any> = {
        points: newPoints,
        level: calculateLevel(newPoints),
        rankTitle: getRankTitle(newPoints),
        trackedIds: [...currentProgress.trackedIds, actCompositeId],
        updatedAt: new Date().toISOString()
      };

      if (activityType === 'news') {
        incrementFields.newsCount = currentProgress.newsCount + 1;
      } else if (activityType === 'match') {
        incrementFields.matchesCount = currentProgress.matchesCount + 1;
      } else if (activityType === 'contest') {
        incrementFields.contestsCount = currentProgress.contestsCount + 1;
      }

      // 2. Save private/main user document
      await updateDoc(userDocRef, incrementFields).catch(async (err) => {
        // If document doesn't have partial properties, merge set
        await setDoc(userDocRef, incrementFields, { merge: true });
      });

      // 3. Save to public user_points ledger for leaderboard queries
      const displayName = user.displayName || user.email?.split('@')[0] || 'مشجع متميز';
      const photoURL = user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${userId}`;

      await setDoc(publicPointsRef, {
        userId,
        displayName,
        photoURL,
        points: newPoints,
        totalPoints: newPoints,
        level: calculateLevel(newPoints),
        rankTitle: getRankTitle(newPoints),
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Update local storage representation as well
      localStorage.setItem('s90_offline_points', String(newPoints));

    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
    }
  } else {
    // Guest user tracking
    const guestPointsStr = localStorage.getItem('s90_offline_points') || '0';
    oldPoints = parseInt(guestPointsStr, 10);
    newPoints = oldPoints + pointsToAdd;

    localStorage.setItem('s90_offline_points', String(newPoints));

    // Save interaction counters in local storage
    const metricKey = `s90_offline_count_${activityType}`;
    const currentCount = parseInt(localStorage.getItem(metricKey) || '0', 10);
    localStorage.setItem(metricKey, String(currentCount + 1));
  }

  const oldLevel = calculateLevel(oldPoints);
  const newLevel = calculateLevel(newPoints);
  const leveledUp = newLevel > oldLevel;

  // Let UI components know about point changes
  window.dispatchEvent(new CustomEvent('Safara 90_points_updated', {
    detail: { points: newPoints, pointsAdded: pointsToAdd, leveledUp }
  }));

  return { pointsAdded: pointsToAdd, newPoints, leveledUp };
}

/**
 * Returns current user total points from local/live state.
 */
export async function getCurrentUserPoints(): Promise<number> {
  const user = auth.currentUser;
  if (user) {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        return userSnap.data().points || 0;
      }
    } catch (e) {
      console.warn("Could not fetch user points from Firestore:", e);
    }
  }
  
  const offlinePoints = localStorage.getItem('s90_offline_points');
  return offlinePoints ? parseInt(offlinePoints, 10) : 0;
}

/**
 * Retrieves the complete UserProgress statistics object.
 */
export async function getUserProgress(): Promise<UserProgress> {
  const user = auth.currentUser;
  if (user) {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        const points = data.points || 0;
        return {
          uid: user.uid,
          points,
          level: data.level || calculateLevel(points),
          rankTitle: data.rankTitle || getRankTitle(points),
          newsCount: data.newsCount || 0,
          matchesCount: data.matchesCount || 0,
          contestsCount: data.contestsCount || 0,
        };
      }
    } catch (e) {
      console.warn("Error getting user stats from database:", e);
    }
  }

  // Guest progress
  const points = parseInt(localStorage.getItem('s90_offline_points') || '0', 10);
  const newsCount = parseInt(localStorage.getItem('s90_offline_count_news') || '0', 10);
  const matchesCount = parseInt(localStorage.getItem('s90_offline_count_match') || '0', 10);
  const contestsCount = parseInt(localStorage.getItem('s90_offline_count_contest') || '0', 10);

  return {
    uid: 'guest',
    points,
    level: calculateLevel(points),
    rankTitle: getRankTitle(points),
    newsCount,
    matchesCount,
    contestsCount,
  };
}

/**
 * Retrieves top users for competitive rankings from user_points collection.
 * If Firestore fails or is empty, returns a polished mock set with user dynamic position.
 */
export async function getLiveLeaderboard(): Promise<{ name: string; photoURL: string; points: number; rankTitle: string; isCurrentUser: boolean }[]> {
  const leaderList: { name: string; photoURL: string; points: number; rankTitle: string; isCurrentUser: boolean }[] = [];
  const user = auth.currentUser;

  try {
    const pointsCollRef = collection(db, 'user_points');
    const q = query(pointsCollRef, orderBy('points', 'desc'), limit(10));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      leaderList.push({
        name: data.displayName || 'مشجع وفي',
        photoURL: data.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${docSnap.id}`,
        points: data.points || 0,
        rankTitle: data.rankTitle || getRankTitle(data.points || 0),
        isCurrentUser: user ? docSnap.id === user.uid : false
      });
    });
  } catch (error) {
    console.warn("Fallback to premium offline leaderboard layout parsing standard rules:", error);
  }

  // No mock data if empty - only include current user's state
  if (leaderList.length === 0) {
    const userPoints = await getCurrentUserPoints();
    const guestProgress = await getUserProgress();

    const meRow = {
      name: user ? (user.displayName || 'أنت') : 'أنت (زائر)',
      photoURL: user?.photoURL || 'https://api.dicebear.com/7.x/initials/svg?seed=guest',
      points: userPoints,
      rankTitle: guestProgress.rankTitle,
      isCurrentUser: true
    };

    leaderList.push(meRow);
  }

  return leaderList.slice(0, 10);
}
