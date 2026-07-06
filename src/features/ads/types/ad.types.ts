import { Ad, AdType, AdSlot } from '../../../types';

export type { Ad, AdType, AdSlot };

export interface AdStats {
  views: number;
  clicks: number;
  ctr: number;
}

export interface AdSlotStats {
  name: string;
  views: number;
  clicks: number;
  ctr: number;
}
