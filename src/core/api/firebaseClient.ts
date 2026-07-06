import { getFirestore } from 'firebase/firestore';
import { db } from '../../firebase'; // Reuse existing db

export default {
  db: db,
  // Future methods for Firebase specific interactions
};
