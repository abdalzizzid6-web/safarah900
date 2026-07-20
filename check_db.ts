import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";
dotenv.config();

const projectId = "gen-lang-client-0959045190";
const databaseId = "ai-studio-safarah90-8063f3e8-1dda-4447-afcd-1abf0dc4041d";

console.log(`Initializing with project ${projectId} and database ${databaseId}`);

const app = initializeApp({
  credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}')),
  projectId: projectId
});

const db = getFirestore(app, databaseId);

async function list() {
  try {
    console.log('Listing collections...');
    const collections = await db.listCollections();
    if (collections.length === 0) {
      console.log('No collections found.');
    } else {
      collections.forEach(col => console.log('Collection:', col.id));
    }
  } catch (e: any) {
    console.error('Error listing collections:', e.message, e.code, e.details);
  }
}
list();
