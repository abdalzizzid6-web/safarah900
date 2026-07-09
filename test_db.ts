import { firestore } from './src/lib/firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const providersSnap = await firestore.collection('api_providers').get();
  providersSnap.forEach(doc => {
    console.log(doc.id, doc.data());
  });
  
  const settingsSnap = await firestore.collection('system_settings').get();
  settingsSnap.forEach(doc => {
    console.log(doc.id, doc.data());
  });
}
run();
