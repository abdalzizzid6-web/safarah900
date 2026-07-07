import { firestore } from '../server/firestore/collections';

async function run() {
  if (!firestore) return;
  const snapshot = await firestore.collection("matches").limit(5).get();
  for (const doc of snapshot.docs) {
    const match = { id: doc.id, ...doc.data() } as any;
    const homeName = match.homeName || (typeof match.homeTeam === 'object' ? match.homeTeam?.name : match.homeTeam) || 'Unknown';
    const awayName = match.awayName || (typeof match.awayTeam === 'object' ? match.awayTeam?.name : match.awayTeam) || 'Unknown';
    const title = match.title || `${homeName} vs ${awayName}`;
    console.log(`Match ${doc.id}: homeName =`, homeName, `| title =`, title);
  }
}

run().catch(console.error);
