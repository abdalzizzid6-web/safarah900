import { firestore } from '../server/firestore/collections';

async function run() {
  if (!firestore) return;
  const snapshot = await firestore.collection("matches").limit(5).get();
  for (const doc of snapshot.docs) {
    const data = doc.data();
    console.log(`Match ${doc.id}: homeTeam.name type is ${typeof data.homeTeam?.name}`);
    if (typeof data.homeTeam?.name === 'object') {
       console.log('homeTeam.name is', data.homeTeam?.name);
    }
  }
}

run().catch(console.error);
