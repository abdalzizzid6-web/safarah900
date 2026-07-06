// src/features/match-details/hooks/useMatchPredictions.ts
import { useQuery } from '@tanstack/react-query';
import { fetchMatch } from '../repositories/matchRepository';

export const useMatchPredictions = (id: string) => {
    return useQuery({
        queryKey: ['match-predictions', id],
        queryFn: async () => {
            const match = await fetchMatch(id);
            return match?.predictions || null;
        },
        enabled: !!id
    });
};
