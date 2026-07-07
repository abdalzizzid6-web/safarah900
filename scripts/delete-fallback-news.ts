import { firestore } from '../server/firestore/collections';

async function run() {
  if (!firestore) return;
  const snapshot = await firestore.collection("news").get();
  let deletedCount = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.mainImage === "/data/rss_fallback.jpg" || data.image === "/data/rss_fallback.jpg" || data.featuredImage?.url === "/data/rss_fallback.jpg") {
      await doc.ref.delete();
      deletedCount++;
      console.log(`Deleted ${doc.id} - fallback image`);
    }
  }
  
  const rssSnapshot = await firestore.collection("rss_imports").get();
  let rssDeletedCount = 0;
  for (const doc of rssSnapshot.docs) {
    const data = doc.data();
    if (data.imageUrl === "/data/rss_fallback.jpg" || data.mainImage === "/data/rss_fallback.jpg") {
      await doc.ref.delete();
      rssDeletedCount++;
      console.log(`Deleted RSS Import ${doc.id} - fallback image`);
    }
  }
  
  console.log(`Finished! Deleted ${deletedCount} news and ${rssDeletedCount} rss_imports.`);
}

run().catch(console.error);
