
import { firestore, FieldValue } from "../firestore/collections";
import { sendPushNotification } from "./notificationService";
import { notifyGoogleIndexing } from "../../src/utils/googleIndexing";

export const adminProcessMatchResult = async (matchId: string, actualScore: { home: number, away: number }) => {
    const predictionsSnap = await firestore.collection('predictions').where('matchId', '==', matchId).get();
    for (const doc of predictionsSnap.docs) {
        const pred = doc.data();
        let points = 0;
        if (pred.predictionType === 'SCORE') {
            const predScore = pred.predictionValue.split('-').map(Number);
            if (predScore[0] === actualScore.home && predScore[1] === actualScore.away) points = 10;
        } else if (pred.predictionType === 'WINNER') {
            const actualWinner = actualScore.home > actualScore.away ? 'HOME' : actualScore.home < actualScore.away ? 'AWAY' : 'DRAW';
            if (pred.predictionValue === actualWinner) points = 3;
        }
        if (points > 0) {
            await doc.ref.update({ pointsEarned: points });
            await firestore.collection('user_points').doc(pred.userId).set({
                totalPoints: FieldValue.increment(points)
            }, { merge: true });
        }
    }
};

export const syncMatchesForNotifications = async () => {
  try {
    if (!firestore) return;

    await firestore.runTransaction(async (transaction: any) => {
      const statesDocRef = firestore.collection('system_state').doc('match_states');
      const statesDoc = await transaction.get(statesDocRef);
      const lastProcessedMatchStates: Record<string, string> = statesDoc.exists ? statesDoc.data()!.states : {};
      const newMatchStates = { ...lastProcessedMatchStates };

      const snapshot = await firestore.collection('matches')
        .where('status', 'in', ['LIVE', 'FINISHED'])
        .limit(50)
        .get();

      for (const snapshotDoc of snapshot.docs) {
        const match = snapshotDoc.data();
        const matchId = snapshotDoc.id;
        const prevState = lastProcessedMatchStates[matchId];

        if (match.status === 'LIVE' && match.utcDate) {
          const startTime = new Date(match.utcDate).getTime();
          const now = Date.now();
          const durationMinutes = (now - startTime) / (1000 * 60);

          if (!isNaN(startTime) && durationMinutes > 110) {
            transaction.update(snapshotDoc.ref, {
              status: 'FINISHED',
              isLive: false,
              updatedAt: new Date().toISOString()
            });
            match.status = 'FINISHED';
          }
        }

        const currentState = `${match.status}-${match.minute}-${match.homeScore}-${match.awayScore}`;
        
        // Notification logic: Detect goal or status change
        if (prevState && prevState !== currentState) {
          const [prevStatus, prevMinute, prevHome, prevAway] = prevState.split('-');
          
          // 1. Detect Goal
          const homeGoal = Number(match.homeScore) > Number(prevHome);
          const awayGoal = Number(match.awayScore) > Number(prevAway);
          
          if (homeGoal || awayGoal) {
            const scoringTeam = homeGoal ? match.homeTeamName : match.awayTeamName;
            const scoreText = `${match.homeScore} - ${match.awayScore}`;
            const title = `⚽ هدف! ${scoringTeam}`;
            const body = `${match.homeTeamName} ${scoreText} ${match.awayTeamName}\nالدقيقة: ${match.minute || 'غير محددة'}`;
            const topic = `match_${matchId}`;
            
            // Send to match followers
            sendPushNotification(title, body, `/match/${matchId}`, matchId, topic);
            
            // Also send to "all_users" if it's a high-profile match (optional logic)
          }

          // 2. Detect Match Start
          if (prevStatus === 'SCHEDULED' && match.status === 'LIVE') {
            sendPushNotification(
              `⏱️ انطلاق المباراة!`,
              `بدأت مباراة ${match.homeTeamName} ضد ${match.awayTeamName} الآن`,
              `/match/${matchId}`,
              matchId,
              `match_${matchId}`
            );
          }

          // 3. Detect Match End
          if (prevStatus === 'LIVE' && match.status === 'FINISHED') {
            sendPushNotification(
              `🏁 نهاية المباراة`,
              `انتهت مباراة ${match.homeTeamName} ضد ${match.awayTeamName} بنتيجة ${match.homeScore}-${match.awayScore}`,
              `/match/${matchId}`,
              matchId,
              `match_${matchId}`
            );
          }
        }
        
        newMatchStates[matchId] = currentState;
      }

      transaction.set(statesDocRef, { states: newMatchStates }, { merge: true });
    });
    
    // Note: Notifications are moved out of the transaction as they are external side-effects.
    // They will be implemented as a separate step.
    
  } catch (err: any) {
    const isQuota = err.message?.toLowerCase().includes('quota') || 
                    err.message?.toLowerCase().includes('exhausted') || 
                    err.code === 8 ||
                    err.code === 'resource-exhausted';
    if (isQuota) {
      console.warn('[syncMatchesForNotifications] Firestore Quota limit exceeded. Gracefully bypassing match state sync for notifications.');
    } else {
      console.error('[CRITICAL] Match Sync For Notifications Error:', err);
    }
  }
};
