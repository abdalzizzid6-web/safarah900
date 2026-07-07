import { firestore } from '../server/firestore/collections';

async function run() {
  if (!firestore) return;
  const snapshot = await firestore.collection("matches").get();
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.homeName !== undefined) {
       console.log(`Match ${doc.id}: homeName =`, data.homeName);
    }
  }
}

run().catch(console.error);
