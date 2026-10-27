import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient.js';
import { useAuth } from '../auth/useAuth.js';

export function useComments(taskId) {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['comments', taskId],
    queryFn: async () => {
      return apiClient.get(`/tasks/${taskId}/comments`);
    },
    enabled: Boolean(session && taskId),
    staleTime: 1000 * 10,
  });
}

export function useCreateComment(taskId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ content }) => {
      return apiClient.post(`/tasks/${taskId}/comments`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-activity'] });
    },
  });
}

export function useUpdateComment(taskId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, content }) => {
      return apiClient.patch(`/comments/${commentId}`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
    },
  });
}

export function useDeleteComment(taskId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId) => {
      return apiClient.delete(`/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-activity'] });
    },
  });
}
