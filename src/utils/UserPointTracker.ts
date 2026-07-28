import { auth } from '../firebase';
import { repositories } from '../core/repository';

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

    try {
      // 1. Fetch current progress
      const userSnap = await repositories.users.getById(userId);
      let currentProgress = {
        points: 0,
        newsCount: 0,
        matchesCount: 0,
        contestsCount: 0,
        trackedIds: [] as string[]
      };

      if (userSnap) {
        currentProgress = {
          points: userSnap.points || 0,
          newsCount: userSnap.newsCount || 0,
          matchesCount: userSnap.matchesCount || 0,
          contestsCount: userSnap.contestsCount || 0,
          trackedIds: userSnap.trackedIds || []
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
        incrementFields.newsCount = (currentProgress.newsCount || 0) + 1;
      } else if (activityType === 'match') {
        incrementFields.matchesCount = (currentProgress.matchesCount || 0) + 1;
      } else if (activityType === 'contest') {
        incrementFields.contestsCount = (currentProgress.contestsCount || 0) + 1;
      }

      await repositories.users.update(userId, incrementFields);

      const oldLevel = calculateLevel(oldPoints);
      const newLevel = calculateLevel(newPoints);

      return {
        pointsAdded: pointsToAdd,
        newPoints,
        leveledUp: newLevel > oldLevel
      };
    } catch (error) {
      console.error('Failed to update user points in Firestore:', error);
    }
  }

  // Guest fallback in localStorage
  const guestPointsKey = 's90_guest_user_points';
  const currentGuestPoints = parseInt(localStorage.getItem(guestPointsKey) || '0', 10);
  oldPoints = currentGuestPoints;
  newPoints = currentGuestPoints + pointsToAdd;
  localStorage.setItem(guestPointsKey, newPoints.toString());

  const oldLevel = calculateLevel(oldPoints);
  const newLevel = calculateLevel(newPoints);

  return {
    pointsAdded: pointsToAdd,
    newPoints,
    leveledUp: newLevel > oldLevel
  };
}

/**
 * Retrieves the current user's total accumulated points.
 */
export async function getCurrentUserPoints(): Promise<number> {
  const user = auth.currentUser;
  if (user) {
    try {
      const userSnap = await repositories.users.getById(user.uid);
      if (userSnap) {
        return userSnap.points || 0;
      }
    } catch (e) {
      console.warn('Failed to fetch user points from Firestore:', e);
    }
  }

  const guestPoints = localStorage.getItem('s90_guest_user_points');
  return guestPoints ? parseInt(guestPoints, 10) : 0;
}

/**
 * Returns complete UserProgress info for the current user.
 */
export async function getUserProgress(): Promise<UserProgress> {
  const user = auth.currentUser;
  const points = await getCurrentUserPoints();
  const level = calculateLevel(points);
  const rankTitle = getRankTitle(points);

  if (user) {
    try {
      const userSnap = await repositories.users.getById(user.uid);
      if (userSnap) {
        return {
          uid: user.uid,
          points,
          level,
          rankTitle,
          newsCount: userSnap.newsCount || 0,
          matchesCount: userSnap.matchesCount || 0,
          contestsCount: userSnap.contestsCount || 0,
          lastUpdated: userSnap.updatedAt || new Date().toISOString()
        };
      }
    } catch (e) {
      console.warn('Failed to fetch full user progress:', e);
    }
  }

  return {
    uid: 'guest',
    points,
    level,
    rankTitle,
    newsCount: 0,
    matchesCount: 0,
    contestsCount: 0
  };
}

/**
 * Retrieves leaderboard of top users sorted by points.
 */
export async function getTopLeaderboard(limitSize = 10): Promise<UserProgress[]> {
  try {
    const users = await repositories.users.getAll();
    const sorted = [...users].sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, limitSize);
    return sorted.map(u => ({
      uid: u.id,
      points: u.points || 0,
      level: calculateLevel(u.points || 0),
      rankTitle: getRankTitle(u.points || 0),
      newsCount: u.newsCount || 0,
      matchesCount: u.matchesCount || 0,
      contestsCount: u.contestsCount || 0
    }));
  } catch (error) {
    console.warn('Failed to fetch leaderboard from Firestore:', error);
    return [];
  }
}
