import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";
dotenv.config();

const app = initializeApp({
  credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'))
});
const db = getFirestore(app);

async function check() {
  const snapshot = await db.collection('matches').where('competitionId', '==', 'WC').limit(5).get();
  console.log('Matches count:', snapshot.size);
  snapshot.forEach(doc => console.log(doc.id, doc.data()));
}
check();
