import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient.js';
import { useAuth } from '../auth/useAuth.js';

export function useWorkspaces() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['workspaces'],
    queryFn: () => apiClient.get('/workspaces'),
    enabled: Boolean(session),
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workspaceData) => apiClient.post('/workspaces', workspaceData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}
