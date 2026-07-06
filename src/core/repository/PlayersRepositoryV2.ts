import { BaseRepository } from './BaseRepository';
import { PlayerDetail } from '../../services/playerMapper';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

export class PlayersRepositoryV2 extends BaseRepository<PlayerDetail> {
  constructor() {
    super('players');
  }

  async getPlayerDetails(playerId: string | number): Promise<PlayerDetail | null> {
    const apiId = String(playerId).replace('apf-', '');
    
    // 1. Direct Doc Access
    const pDoc = await getDoc(doc(db, this.collectionName, apiId));
    if (pDoc.exists()) {
      return { id: pDoc.id, ...pDoc.data() } as PlayerDetail;
    }

    // 2. Query by ID field
    const q = query(collection(db, this.collectionName), where('id', '==', apiId));
    const qSnap = await getDocs(q);
    if (!qSnap.empty) {
      return { id: qSnap.docs[0].id, ...qSnap.docs[0].data() } as PlayerDetail;
    }

    // 3. World Cup Fallback
    const wcQ = query(collection(db, 'world_cup_players'), where('id', '==', apiId));
    const wcSnap = await getDocs(wcQ);
    if (!wcSnap.empty) {
      return { id: wcSnap.docs[0].id, ...wcSnap.docs[0].data() } as PlayerDetail;
    }

    return null;
  }

  async getTeamPlayers(teamId: string | number): Promise<PlayerDetail[]> {
    const apiId = String(teamId).replace('apf-', '');
    
    // Try standard players collection
    const q = query(collection(db, this.collectionName), where('teamId', '==', apiId));
    const qSnap = await getDocs(q);
    let players = qSnap.docs.map(d => ({ ...d.data(), id: d.id } as PlayerDetail));

    // Fallback to world_cup_players
    if (players.length === 0) {
      const wcQ = query(collection(db, 'world_cup_players'), where('teamId', '==', apiId));
      const wcSnap = await getDocs(wcQ);
      players = wcSnap.docs.map(d => ({ ...d.data(), id: d.id } as PlayerDetail));
    }

    return players;
  }
}

export const playersRepositoryV2 = new PlayersRepositoryV2();
