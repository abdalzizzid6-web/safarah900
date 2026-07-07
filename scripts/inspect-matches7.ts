import { firestore } from '../server/firestore/collections';

async function run() {
  if (!firestore) return;
  const snapshot = await firestore.collection("matches").get();
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (typeof data.homeTeam?.name === 'object' && data.homeTeam?.name !== null) {
       console.log(`Match ${doc.id}: homeTeam.name =`, data.homeTeam?.name);
    }
  }
}

run().catch(console.error);
