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

/**
 * Fetches a single workspace by ID.
 */
export function useWorkspace(workspaceId) {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => apiClient.get(`/workspaces/${workspaceId}`),
    enabled: Boolean(session) && Boolean(workspaceId),
    staleTime: 1000 * 60,
  });
}

/**
 * Fetches the member list for a workspace.
 */
export function useWorkspaceMembers(workspaceId) {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => apiClient.get(`/workspaces/${workspaceId}/members`),
    enabled: Boolean(session) && Boolean(workspaceId),
    staleTime: 1000 * 60,
  });
}

/**
 * Mutation to update a workspace (name, slug, description).
 */
export function useUpdateWorkspace(workspaceId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates) => apiClient.patch(`/workspaces/${workspaceId}`, updates),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      queryClient.setQueryData(['workspace', workspaceId], updated);
    },
  });
}
