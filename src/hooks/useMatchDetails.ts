// src/hooks/useMatchDetails.ts
import { useMatchDetails as unifiedUseMatchDetails } from '../features/match-details/hooks/useMatch';

export function useMatchDetails(id: string | number | undefined) {
  return unifiedUseMatchDetails(id ? String(id) : '');
}
