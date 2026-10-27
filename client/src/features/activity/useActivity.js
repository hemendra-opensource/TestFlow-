import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient.js';
import { useAuth } from '../auth/useAuth.js';

export function useWorkspaceActivity(workspaceId, options = {}) {
  const { session } = useAuth();
  const { limit = 40 } = options;

  return useQuery({
    queryKey: ['workspace-activity', workspaceId, { limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      return apiClient.get(`/workspaces/${workspaceId}/activity${queryStr}`);
    },
    enabled: Boolean(session && workspaceId),
    staleTime: 1000 * 15,
  });
}
