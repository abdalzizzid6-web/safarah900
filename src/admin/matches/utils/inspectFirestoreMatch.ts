import { repositories } from '../../../core/repository';

/**
 * Diagnostic utility to inspect the raw structure of a match document in Firestore.
 * This helps identify if fields like homeTeamId or awayTeamId are missing or nested differently.
 */
export async function inspectFirestoreMatch() {
  console.group("🔍 Firestore Match Inspection");
  try {
    const matches = await repositories.matches.getMatches({ limit: 1 });
    
    if (matches.length === 0) {
      console.warn("No matches found in Firestore 'matches' collection.");
      console.groupEnd();
      return null;
    }

    const data = matches[0] as any;
    
    console.log("Match ID:", data.id);
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
    
    console.groupEnd();
    return data;
  } catch (error) {
    console.error("Failed to inspect Firestore match:", error);
    console.groupEnd();
    return null;
  }
}
