import { firestore } from '../server/firestore/collections';

async function run() {
  if (!firestore) return;
  const snapshot = await firestore.collection("matches").limit(20).get();
  for (const doc of snapshot.docs) {
    const data = doc.data();
    console.log(`Match ${doc.id}: homeTeam.name =`, data.homeTeam?.name);
  }
}

run().catch(console.error);
