
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const app = initializeApp();
const firestore = getFirestore(app);

async function checkNews() {
  const snapshot = await firestore.collection('news').limit(1).get();
  snapshot.forEach(doc => {
    console.log('News Data:', JSON.stringify(doc.data(), null, 2));
  });
}
checkNews();
