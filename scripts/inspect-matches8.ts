import { firestore } from '../server/firestore/collections';

async function run() {
  if (!firestore) return;
  const snapshot = await firestore.collection("matches").get();
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (typeof data.homeTeam === 'string') {
       console.log(`Match ${doc.id}: homeTeam is string: "${data.homeTeam}"`);
    }
  }
}

run().catch(console.error);
