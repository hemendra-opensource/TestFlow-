import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient.js';
import { useAuth } from '../auth/useAuth.js';

export function useTasks(projectId, filters = {}) {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['tasks', projectId, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.priority && filters.priority !== 'all') params.append('priority', filters.priority);
      if (filters.assignee_id && filters.assignee_id !== 'all') params.append('assignee_id', filters.assignee_id);
      if (filters.search) params.append('search', filters.search);
      if (filters.sort_by) params.append('sort_by', filters.sort_by);
      if (filters.order) params.append('order', filters.order);

      const queryStr = params.toString() ? `?${params.toString()}` : '';
      return apiClient.get(`/projects/${projectId}/tasks${queryStr}`);
    },
    enabled: Boolean(session && projectId),
    staleTime: 1000 * 15,
  });
}

export function useCreateTask(projectId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData) => {
      return apiClient.post(`/projects/${projectId}/tasks`, taskData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useUpdateTask(projectId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, ...updates }) => {
      return apiClient.patch(`/tasks/${taskId}`, updates);
    },
    // Optimistic update for smooth Kanban drag-and-drop
    onMutate: async ({ taskId, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', projectId] });
      const previousTasks = queryClient.getQueryData(['tasks', projectId, {}]);

      if (previousTasks && Array.isArray(previousTasks)) {
        queryClient.setQueryData(
          ['tasks', projectId, {}],
          previousTasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
        );
      }

      return { previousTasks };
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', projectId, {}], context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useDeleteTask(projectId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId) => {
      return apiClient.delete(`/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useDashboardStats() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => apiClient.get('/dashboard/stats'),
    enabled: Boolean(session),
    staleTime: 1000 * 20,
  });
}
