import { firestore } from '../server/firestore/collections';

async function run() {
  if (!firestore) return;
  const snapshot = await firestore.collection("news").limit(1).get();
  console.log(`News count: ${snapshot.size}`);
}

run().catch(console.error);
