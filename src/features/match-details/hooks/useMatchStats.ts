// src/features/match-details/hooks/useMatchStats.ts
import { useQuery } from '@tanstack/react-query';
import { fetchMatch } from '../repositories/matchRepository';

export const useMatchStats = (id: string) => {
    return useQuery({
        queryKey: ['match-stats', id],
        queryFn: async () => {
            const match = await fetchMatch(id);
            return match?.stats || null;
        },
        enabled: !!id
    });
};
