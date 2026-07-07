import { firestore } from '../server/firestore/collections';

async function run() {
  if (!firestore) return;
  const snapshot = await firestore.collection("matches").limit(1).get();
  for (const doc of snapshot.docs) {
    console.log(JSON.stringify(doc.data(), null, 2));
  }
}

run().catch(console.error);
