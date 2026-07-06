// src/features/match-details/hooks/useMatchH2H.ts
import { useQuery } from '@tanstack/react-query';
import { fetchMatch } from '../repositories/matchRepository';

export const useMatchH2H = (id: string) => {
    return useQuery({
        queryKey: ['match-h2h', id],
        queryFn: async () => {
            const match = await fetchMatch(id);
            return match?.h2h || [];
        },
        enabled: !!id
    });
};
