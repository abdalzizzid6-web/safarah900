import { firestore } from '../server/firestore/collections';

async function run() {
  if (!firestore) return;
  const snapshot = await firestore.collection("matches").get();
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (String(data.homeTeam) === '[object Object]') {
       console.log(`Match ${doc.id} homeTeam stringifies to [object Object]`);
    }
  }
}

run().catch(console.error);
