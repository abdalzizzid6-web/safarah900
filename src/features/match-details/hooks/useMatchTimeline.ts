// src/features/match-details/hooks/useMatchTimeline.ts
import { useQuery } from '@tanstack/react-query';
import { fetchMatch } from '../repositories/matchRepository';

export const useMatchTimeline = (id: string) => {
    return useQuery({
        queryKey: ['match-timeline', id],
        queryFn: async () => {
            const match = await fetchMatch(id);
            return match?.timeline || [];
        },
        enabled: !!id
    });
};
