import { firestore } from '../server/firestore/collections';
import fs from 'fs';
import path from 'path';

async function run() {
  if (!firestore) return;
  const snapshot = await firestore.collection("news").get();
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const url = data.mainImage || data.image || data.featuredImage?.url;
    if (url && url.startsWith('/data/rss_images')) {
      const localPath = path.join(process.cwd(), 'public', url);
      if (fs.existsSync(localPath)) {
        const stats = fs.statSync(localPath);
        if (stats.size < 5000) {
          console.log(`Small image found: ${url} (${stats.size} bytes). Deleting news...`);
          await doc.ref.delete();
          await firestore.collection("rss_imports").doc(doc.id).delete();
          fs.unlinkSync(localPath);
        }
      } else {
        console.log(`Image missing: ${url}. Deleting news...`);
        await doc.ref.delete();
        await firestore.collection("rss_imports").doc(doc.id).delete();
      }
    } else {
        console.log(`No image or external image: ${url}. Deleting...`);
        await doc.ref.delete();
        await firestore.collection("rss_imports").doc(doc.id).delete();
    }
  }
}

run().catch(console.error);
