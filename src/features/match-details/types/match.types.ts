// src/features/match-details/types/match.types.ts
import { Match as BaseMatch } from '../../../types';

export interface MatchDetails extends BaseMatch {
    // Extend base match if needed
}

export type LinkStatus = 'idle' | 'checking' | 'ok' | 'broken';
