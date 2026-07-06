// src/features/match-details/hooks/useMatch.ts
import { useQuery } from '@tanstack/react-query';
import { fetchMatch } from '../repositories/matchRepository';
import { Match } from '../../../types';

export const useMatch = (id: string) => {
    return useQuery({
        queryKey: ['matchDetails', id],
        queryFn: async () => {
            if (!id) return null;
            return await fetchMatch(id);
        },
        enabled: !!id,
        staleTime: 30000,
        retry: 2,
    });
};
export const useMatchDetails = useMatch;
