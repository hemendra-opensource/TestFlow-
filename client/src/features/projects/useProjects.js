import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient.js';
import { useAuth } from '../auth/useAuth.js';

export function useProjects(workspaceId, filters = {}) {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['projects', workspaceId, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      return apiClient.get(`/workspaces/${workspaceId}/projects${queryStr}`);
    },
    enabled: Boolean(session && workspaceId),
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useProject(projectId) {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => apiClient.get(`/projects/${projectId}`),
    enabled: Boolean(session && projectId),
    staleTime: 1000 * 30,
  });
}

export function useCreateProject(workspaceId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newProject) => {
      return apiClient.post(`/workspaces/${workspaceId}/projects`, newProject);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useUpdateProject(projectId, workspaceId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates) => {
      return apiClient.patch(`/projects/${projectId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useDeleteProject(projectId, workspaceId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return apiClient.delete(`/projects/${projectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}
