import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";
dotenv.config();

const projectId = "gen-lang-client-0959045190";
const databaseId = "ai-studio-safarah90-8063f3e8-1dda-4447-afcd-1abf0dc4041d";

const app = initializeApp({
  credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}')),
  projectId: projectId
});

const db = getFirestore(app, databaseId);

async function deleteMatches() {
  const collectionRef = db.collection('matches');
  const snapshot = await collectionRef.get();
  const batch = db.batch();
  
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  console.log(`Deleted ${snapshot.size} matches.`);
}

deleteMatches();
