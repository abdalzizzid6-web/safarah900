import { firestore, isFirestoreQuotaExceeded, setFirestoreQuotaExceeded, isFirebaseQuotaError } from "../firestore/collections";
import { 
  getCachedTeamsAndPlayers, 
  getCachedLeagues, 
  cachedLiveMatches, 
  lastLiveMatchesFetch, 
  LIVE_MATCHES_TTL,
  setCachedLiveMatches
} from "./rssCache";

export async function findSmartLinks(detected: { teams: string[]; players: string[]; league: string }) {
  const links: { matchId?: string; teamIds: string[]; playerIds: string[]; competitionId?: string; worldCupPageLinked?: boolean } = {
    teamIds: [],
    playerIds: [],
  };

  if (!firestore || isFirestoreQuotaExceeded) return links;

  const { teams: allTeams, players: allPlayers } = await getCachedTeamsAndPlayers();

  // 1. Match Teams
  if (detected.teams && detected.teams.length > 0) {
    for (const dt of detected.teams) {
      const search = dt.toLowerCase().trim();
      const match = allTeams.find(t => 
        t.name.toLowerCase().includes(search) || 
        t.arabicName.toLowerCase().includes(search) ||
        search.includes(t.name.toLowerCase()) ||
        search.includes(t.arabicName.toLowerCase())
      );
      if (match) {
        links.teamIds.push(match.id);
      }
    }
    links.teamIds = Array.from(new Set(links.teamIds));
  }

  // 2. Match Players
  if (detected.players && detected.players.length > 0) {
    for (const dp of detected.players) {
      const search = dp.toLowerCase().trim();
      const match = allPlayers.find(p => 
        p.name.toLowerCase().includes(search) || 
        p.arabicName.toLowerCase().includes(search) ||
        search.includes(p.name.toLowerCase()) ||
        search.includes(p.arabicName.toLowerCase())
      );
      if (match) {
        links.playerIds.push(match.id);
      }
    }
    links.playerIds = Array.from(new Set(links.playerIds));
  }

  // 3. Match Competitions / Leagues
  if (detected.league) {
    try {
      const allLeagues = await getCachedLeagues();
      const search = detected.league.toLowerCase().trim();
      for (const league of allLeagues) {
        const name = league.name.toLowerCase();
        const arName = league.arabicName.toLowerCase();
        if (name.includes(search) || arName.includes(search) || search.includes(name) || search.includes(arName)) {
          links.competitionId = league.id;
          break;
        }
      }
    } catch (err: any) {
      if (isFirebaseQuotaError(err)) {
        setFirestoreQuotaExceeded(true);
      } else {
        console.error("Match league link failed:", err);
      }
    }
  }

  // 4. Match matches
  if (links.teamIds.length > 0) {
    try {
      const targetTeamId = links.teamIds[0];
      const now = Date.now();
      
      let localMatches: any[] = cachedLiveMatches || [];
      // Use in-memory cache for live matches during sync cycle
      if (!cachedLiveMatches || now - lastLiveMatchesFetch > LIVE_MATCHES_TTL) {
        const matchesSnap = await firestore.collection('matches')
          .where('isLive', '==', true)
          .limit(20)
          .get();
        localMatches = matchesSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
        setCachedLiveMatches(localMatches, now);
      }
      
      let matchResult = localMatches.find((m: any) => m.homeTeamId === targetTeamId || m.awayTeamId === targetTeamId);
      
      if (matchResult) {
        links.matchId = matchResult.id;
      } else {
        // Only if not found in live, check recent (limit this to avoid too many reads)
        const recentSnap = await firestore.collection('matches')
          .orderBy('utcDate', 'desc')
          .limit(10)
          .get();
        for (const doc of recentSnap.docs) {
          const m = doc.data();
          if (m.homeTeamId === targetTeamId || m.awayTeamId === targetTeamId) {
            links.matchId = doc.id;
            break;
          }
        }
      }
    } catch (err: any) {
      if (isFirebaseQuotaError(err)) {
        setFirestoreQuotaExceeded(true);
      } else {
        console.error("Smart linking match failed:", err);
      }
    }
  }

  // 5. World cup page
  const textStr = detected.league || "";
  if (textStr.includes("كأس العالم") || textStr.includes("World Cup")) {
    links.worldCupPageLinked = true;
  }

  return links;
}
