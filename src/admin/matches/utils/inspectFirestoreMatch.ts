import { db } from '../../../firebase';
import { collection, query, limit, getDocs } from 'firebase/firestore';

/**
 * Diagnostic utility to inspect the raw structure of a match document in Firestore.
 * This helps identify if fields like homeTeamId or awayTeamId are missing or nested differently.
 */
export async function inspectFirestoreMatch() {
  console.group("🔍 Firestore Match Inspection");
  try {
    const q = query(collection(db, 'matches'), limit(1));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.warn("No matches found in Firestore 'matches' collection.");
      console.groupEnd();
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    
    console.log("Match ID:", doc.id);
    console.log("Raw Data:", data);
    
    const analysis = {
      hasHomeTeam: 'homeTeam' in data,
      hasAwayTeam: 'awayTeam' in data,
      hasHomeTeamId: 'homeTeamId' in data,
      hasAwayTeamId: 'awayTeamId' in data,
      homeTeamType: typeof data.homeTeam,
      awayTeamType: typeof data.awayTeam,
      homeTeamStructure: data.homeTeam && typeof data.homeTeam === 'object' ? Object.keys(data.homeTeam) : 'N/A',
      awayTeamStructure: data.awayTeam && typeof data.awayTeam === 'object' ? Object.keys(data.awayTeam) : 'N/A',
    };

    console.table(analysis);
    
    if (data.homeTeam && typeof data.homeTeam === 'object') {
      console.log("homeTeam details:", data.homeTeam);
    }
    if (data.awayTeam && typeof data.awayTeam === 'object') {
      console.log("awayTeam details:", data.awayTeam);
    }

    console.groupEnd();
    return {
      id: doc.id,
      raw: data,
      analysis
    };
  } catch (error) {
    console.error("❌ Firestore Inspection Failed:", error);
    console.groupEnd();
    throw error;
  }
}
