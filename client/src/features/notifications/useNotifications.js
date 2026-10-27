import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient.js';
import { useAuth } from '../auth/useAuth.js';

export function useUnreadNotificationsCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notifications-unread-count', user?.id],
    queryFn: async () => {
      const res = await apiClient.get('/notifications/unread-count');
      return res?.unread_count ?? 0;
    },
    enabled: Boolean(user?.id),
    staleTime: 1000 * 15,
  });
}

export function useNotifications(options = {}) {
  const { user } = useAuth();
  const { limit = 20, is_read } = options;

  return useQuery({
    queryKey: ['notifications', user?.id, { limit, is_read }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (is_read !== undefined && is_read !== null) {
        params.append('is_read', is_read.toString());
      }
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      return apiClient.get(`/notifications${queryStr}`);
    },
    enabled: Boolean(user?.id),
    staleTime: 1000 * 15,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId) => {
      return apiClient.patch(`/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return apiClient.patch('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });
}
