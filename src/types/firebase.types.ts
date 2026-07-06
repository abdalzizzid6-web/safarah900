// src/types/firebase.types.ts
import { DocumentData } from 'firebase/firestore';

export type FirestoreDocument<T> = T & { id: string };
export type FirestoreData<T> = DocumentData & T;
