import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";
dotenv.config();

const app = initializeApp({
  credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'))
});
const db = getFirestore(app);

async function list() {
  const collections = await db.listCollections();
  collections.forEach(col => console.log('Collection:', col.id));
}
list();
