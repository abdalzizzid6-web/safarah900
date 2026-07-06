import admin from 'firebase-admin';

admin.initializeApp({
  projectId: process.env.GOOGLE_CLOUD_PROJECT || "ai-studio-8063f3e8-1dda-4447-afcd-1abf0dc4041d"
});
const db = admin.firestore();

async function run() {
  const snapshot = await db.collection('match_ai_content').limit(5).get();
  snapshot.forEach(doc => {
    console.log("DOC ID:", doc.id);
    console.log(JSON.stringify(doc.data(), null, 2));
  });
}
run().catch(console.error).finally(() => process.exit(0));
