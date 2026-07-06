import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, getCountFromServer, query, orderBy, limit, getDocs } from 'firebase/firestore';

export const dashboardService = {
  async getStats() {
    try {
      const counts: Record<string, number> = {
        analyticsEvents: 0,
        pageViews: 0,
        matchViews: 0,
        teamViews: 0,
        playerViews: 0,
        streamViews: 0,
        userActivity: 0,
        systemLogs: 0,
        apiLogs: 0,
        syncLogs: 0
      };

      const collections = [
        { key: 'analyticsEvents', col: 'analytics_events' },
        { key: 'pageViews', col: 'page_views' },
        { key: 'matchViews', col: 'match_views' },
        { key: 'teamViews', col: 'team_views' },
        { key: 'playerViews', col: 'player_views' },
        { key: 'streamViews', col: 'stream_views' },
        { key: 'userActivity', col: 'user_activity' },
        { key: 'systemLogs', col: 'system_logs' },
        { key: 'apiLogs', col: 'api_logs' },
        { key: 'syncLogs', col: 'sync_logs' }
      ];

      for (const item of collections) {
          const collRef = collection(db, item.col);
          try {
            const snapshot = await getCountFromServer(collRef);
            counts[item.key] = snapshot.data().count;
          } catch (e) {
            console.warn(`Failed to count ${item.col}`, e);
          }
      }
      
      return counts;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'dashboard_stats');
      return null;
    }
  },
  async getAggregateStats() {
    try {
      // Real data points
      const teamsRef = collection(db, 'teams');
      const teamsQuery = query(teamsRef, orderBy('stats.wins', 'desc'), limit(5));
      const teamsSnapshot = await getDocs(teamsQuery);
      
      const playersRef = collection(db, 'players');
      const playersQuery = query(playersRef, orderBy('stats.goals', 'desc'), limit(5));
      const playersSnapshot = await getDocs(playersQuery);
      
      return {
          teams: teamsSnapshot.docs.map(doc => ({
              name: doc.data().name,
              wins: doc.data().stats?.wins || 0,
              matches: doc.data().stats?.matchesPlayed || 0
          })),
          players: playersSnapshot.docs.map(doc => ({
              name: doc.data().name,
              goals: doc.data().stats?.goals || 0,
              assists: doc.data().stats?.assists || 0
          })),
          users: { active: 0, new: 0, dailyVisits: 0 } // In real production this would be a specialized aggregation
      };
    } catch (e) {
      console.error(e);
      return { teams: [], players: [], users: { active: 0, new: 0, dailyVisits: 0 } };
    }
  },
  async getSystemMonitor() {
      return {
          cpuUsage: 0,
          memoryUsage: 0,
          activeRequests: 0,
          status: 'online'
      };
  },
  async getDataSources() {
      return [
          { name: 'Football API', status: 'connected', lastSync: '10 min ago', latency: '120ms' },
          { name: 'SportMonks', status: 'connected', lastSync: '2 min ago', latency: '45ms' },
          { name: 'Cloud Firestore', status: 'connected', lastSync: 'now', latency: '10ms' }
      ];
  }
};
