import { firestore } from '../server/firestore/collections';

async function run() {
  if (!firestore) return;
  const snapshot = await firestore.collection("matches").get();
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (typeof data.homeName === 'object') {
       console.log(`Match ${doc.id}: homeName is an object!`, data.homeName);
    }
    if (typeof data.homeTeam === 'object' && typeof data.homeTeam?.name === 'object') {
       console.log(`Match ${doc.id}: homeTeam.name is an object!`, data.homeTeam?.name);
    }
  }
}

run().catch(console.error);
