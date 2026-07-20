import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ScrollView, 
  Pressable, 
  ActivityIndicator, 
  RefreshControl,
  Image,
  Platform 
} from 'react-native';
import { RotateCcw, Flame, Radio } from 'lucide-react-native';
import MatchCard from '../../components/MatchCard';
import { auth, db } from '../../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getBackendUrl = () => {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }
  return 'https://ais-dev-7yjy6apxcqr3vnxii4n4s5-425742923336.europe-west1.run.app';
};

const mapRawMatchesToApp = (rawList: any[]) => {
  return rawList.map((raw: any, index: number) => {
    const fixture = raw.fixture || {};
    const teams = raw.teams || {};
    const goals = raw.goals || {};
    const leagueObj = raw.league || {};
    
    const isLive = ['1H', '2H', 'ET', 'P', 'LIVE', 'HT'].includes((fixture.status?.short || '').toUpperCase());
    
    return {
      id: fixture.id ? `apf-${fixture.id}` : `local-${index}`,
      homeTeam: {
        id: teams.home?.id || 0,
        name: teams.home?.name || 'فريق مضيف',
        logo: teams.home?.logo || 'https://media.api-sports.io/football/teams/unknown.png'
      },
      awayTeam: {
        id: teams.away?.id || 0,
        name: teams.away?.name || 'فريق ضيف',
        logo: teams.away?.logo || 'https://media.api-sports.io/football/teams/unknown.png'
      },
      score: {
        home: goals.home !== undefined ? goals.home : null,
        away: goals.away !== undefined ? goals.away : null
      },
      homeScore: goals.home !== undefined ? goals.home : undefined,
      awayScore: goals.away !== undefined ? goals.away : undefined,
      minute: fixture.status?.elapsed || undefined,
      isLive,
      status: {
        short: fixture.status?.short || 'NS',
        long: fixture.status?.long || 'Not Started',
        elapsed: fixture.status?.elapsed || 0
      },
      league: {
        id: leagueObj.id || 0,
        name: leagueObj.name || 'الدوري',
        logo: leagueObj.logo || 'https://media.api-sports.io/football/leagues/unknown.png'
      },
      channel: raw.channel || "SSC Sports 1 HD",
      commentator: raw.commentator || "جاري التحديد",
      startTime: fixture.date || new Date().toISOString()
    };
  });
};

export default function LiveMatchesScreen() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userFavorites, setUserFavorites] = useState<string[]>([]);
  const [uid, setUid] = useState<string | null>(null);

  // Read current Auth status and load user preferences from Firestore or storage
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        fetchFavorites(user.uid);
      } else {
        setUid(null);
        try {
          const storedFavs = await AsyncStorage.getItem('local_favorites_matches');
          if (storedFavs) {
            setUserFavorites(JSON.parse(storedFavs));
          }
        } catch (e) {
          console.warn(e);
        }
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    fetchLiveMatches();
  }, []);

  const fetchFavorites = async (userId: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        setUserFavorites(data.favoriteMatches || []);
      }
    } catch (e) {
      console.warn("Failed fetching Firestore user preferences", e);
    }
  };

  const handleToggleFavorite = async (matchId: string) => {
    let updatedFavs = [...userFavorites];
    if (updatedFavs.includes(matchId)) {
      updatedFavs = updatedFavs.filter(id => id !== matchId);
    } else {
      updatedFavs.push(matchId);
    }
    setUserFavorites(updatedFavs);

    if (uid) {
      try {
        const userRef = doc(db, 'users', uid);
        await setDoc(userRef, { favoriteMatches: updatedFavs }, { merge: true });
      } catch (e) {
        console.error("Firestore update failed", e);
      }
    } else {
      try {
        await AsyncStorage.setItem('local_favorites_matches', JSON.stringify(updatedFavs));
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const fetchLiveMatches = async () => {
    setLoading(true);
    try {
      const baseUrl = getBackendUrl();
      const response = await fetch(`${baseUrl}/api/football-api/fixtures`);
      if (response.ok) {
        const data = await response.json();
        const rawList = data.response || data.data || [];
        if (Array.isArray(rawList) && rawList.length > 0) {
          const mapped = mapRawMatchesToApp(rawList);
          // Only filter LIVE matches
          const liveOnly = mapped.filter(m => {
            const statusShort = m.status?.short || (m.isLive ? 'LIVE' : '');
            return m.isLive || ['LIVE', '1H', '2H', 'HT', 'ET', 'P', 'PEN'].includes(statusShort.toUpperCase());
          });
          setMatches(liveOnly);
        }
      }
    } catch (error) {
      console.log("Network direct fetch failed:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLiveMatches();
  };

  // Group Matches by League for clean and high professional rendering
  const groupMatchesByLeague = (matchList: any[]) => {
    const groups: { [key: string]: { league: any; fixtures: any[] } } = {};
    matchList.forEach(m => {
      const name = m.league?.name || m.league || "البطولات الأخرى";
      const id = m.league?.id || 'oth';
      const key = `${id}_${name}`;
      if (!groups[key]) {
        groups[key] = {
          league: {
            name,
            logo: m.league?.logo || m.leagueLogo || 'https://media.api-sports.io/football/leagues/39.png'
          },
          fixtures: []
        };
      }
      groups[key].fixtures.push(m);
    });
    return Object.values(groups);
  };

  const groupedData = groupMatchesByLeague(matches);

  return (
    <View style={styles.container}>
      {/* Live Badge and Header */}
      <View style={styles.liveHeader}>
        <View style={styles.liveRow}>
          <View style={styles.liveDot} />
          <Text style={styles.liveTitle}>المباريات المباشرة الآن</Text>
        </View>
        <Text style={styles.liveSub}>تابع جميع أحداث ومجريات اللقاءات الحية لحظة بلحظة</Text>
      </View>

      {/* Main List Rendering */}
      {loading && !refreshing ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>جاري جلب البث المباشر المتاح...</Text>
        </View>
      ) : groupedData.length === 0 ? (
        <ScrollView 
          contentContainerStyle={styles.emptyCenter}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
        >
          <Radio size={48} color="#ef4444" style={{ marginBottom: 12, opacity: 0.8 }} />
          <Text style={styles.emptyTitle}>لا توجد مباريات مباشرة حالياً</Text>
          <Text style={styles.emptySub}>لا توجد مواجهات تجرى في هذا الوقت. اسحب للأسفل لتحديث الصفحة.</Text>
        </ScrollView>
      ) : (
        <FlatList
          data={groupedData}
          keyExtractor={(item) => item.league.name}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={['#10b981']} 
              thumbColor="#10b981"
              tintColor="#10b981"
            />
          }
          renderItem={({ item }) => (
            <View style={styles.leagueSection}>
              {/* League Header */}
              <View style={styles.leagueHeaderRow}>
                <Image source={{ uri: item.league.logo }} style={styles.leagueSectionLogo} />
                <Text style={styles.leagueHeaderText}>{item.league.name}</Text>
              </View>

              {/* Match Cards inside League */}
              {item.fixtures.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  isBookmarked={userFavorites.includes(match.id)}
                  onToggleBookmark={() => handleToggleFavorite(match.id)}
                />
              ))}
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  liveHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#0c1223',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  liveRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  liveTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'right',
  },
  liveSub: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'right',
    marginTop: 4,
  },
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#10b981',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '800',
  },
  emptyCenter: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4,
  },
  emptySub: {
    color: '#6b7280',
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 18,
  },
  leagueSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  leagueHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'rgba(12, 18, 35, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  leagueSectionLogo: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginLeft: 8,
    resizeMode: 'contain',
  },
  leagueHeaderText: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '900',
    flex: 1,
    textAlign: 'right',
  }
});
