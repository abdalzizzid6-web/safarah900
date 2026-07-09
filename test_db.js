const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'ai-studio-safarah90-8063f3e8-1dda-4447-afcd-1abf0dc4041d'
});
const db = admin.firestore();
async function run() {
  const providersSnap = await db.collection('api_providers').get();
  providersSnap.forEach(doc => {
    console.log(doc.id, doc.data());
  });
}
run();
