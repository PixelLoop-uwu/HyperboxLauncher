import { useQuery } from '@tanstack/react-query';
import { getPywebviewApi } from '@/utils/pywebview';
import type { Modpack } from '@/types/modpack';

export const useModpacks = () => {
  return useQuery<Modpack[], Error>({
    queryKey: ['modpacks'],
    queryFn: async () => {
      const api = await getPywebviewApi();
      return await api.load_modpacks_data();
    },
    staleTime: 5 * 60 * 1000,
    retry: 3,

    retryDelay: (attempt: number) => {
      return Math.min(1000 * 2 ** attempt, 5000);
    },
  });
};