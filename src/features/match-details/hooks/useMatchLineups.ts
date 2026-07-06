// src/features/match-details/hooks/useMatchLineups.ts
import { useQuery } from '@tanstack/react-query';
import { fetchMatch } from '../repositories/matchRepository';

export const useMatchLineups = (id: string) => {
    return useQuery({
        queryKey: ['match-lineups', id],
        queryFn: async () => {
            const match = await fetchMatch(id);
            return match?.lineups || null;
        },
        enabled: !!id
    });
};
