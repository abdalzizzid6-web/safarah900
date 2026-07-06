
import { messaging, firestore } from "../firestore/collections";

export async function sendPushNotification(title: string, body: string, link: string = '/#live', matchId: string = 'general', targetTopic: string = 'all_users') {
  if (!messaging) {
    console.warn("Skipping notification: Firebase messaging (Admin) not initialized.");
    return;
  }
  
  // Topic prioritization: if it's a specific match topic, use it. Default to all_users.
  const topic = targetTopic;

  const message = {
    notification: { title, body },
    data: { 
      link, 
      matchId,
      click_action: 'FLUTTER_NOTIFICATION_CLICK', // For mobile compatibility
    },
    topic
  };

  try {
    const response = await messaging.send(message);
    console.log(`Successfully sent push notification to topic ${topic}:`, response);
    
    await firestore.collection('notifications_history').add({
      title,
      body,
      link,
      matchId,
      topic,
      timestamp: new Date().toISOString(),
      status: 'SENT'
    });
  } catch (error: any) {
    console.error(`Error sending push notification to topic ${topic}:`, error);
  }
}
