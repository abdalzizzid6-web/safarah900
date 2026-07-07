import { firestore } from '../server/firestore/collections';

async function run() {
  if (!firestore) return;
  const snapshot = await firestore.collection("matches").limit(5).get();
  for (const doc of snapshot.docs) {
    const data = doc.data();
    console.log(`Match ${doc.id}: homeName type is ${typeof data.homeName}, awayName type is ${typeof data.awayName}, homeTeam type is ${typeof data.homeTeam}`);
    if (typeof data.homeName === 'object') {
       console.log('homeName is', data.homeName);
    }
  }
}

run().catch(console.error);
