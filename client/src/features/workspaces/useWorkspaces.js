import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient.js';
import { supabase, isSupabaseConfigured } from '../../lib/supabase.js';
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
 * Fetches all registered users on TeamFlow to support member invitation/quick add.
 */
export function useRegisteredUsers() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['registered-users'],
    queryFn: () => apiClient.get('/workspaces/users/registered'),
    enabled: Boolean(session),
    staleTime: 1000 * 60,
  });
}

/**
 * Mutation to add a member to a workspace.
 */
export function useAddWorkspaceMember(workspaceId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberData) => apiClient.post(`/workspaces/${workspaceId}/members`, memberData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-activity', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['analytics-workload'] });
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
    },
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

/**
 * Hook to subscribe to real-time changes on a workspace (members, projects, activity).
 */
export function useWorkspaceRealtime(workspaceId) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!workspaceId || !isSupabaseConfigured) return;

    const channelName = `workspace-${workspaceId}-${Math.random().toString(36).slice(2, 8)}`;

    const existingChannel = supabase.getChannels().find(
      (ch) => ch.topic === `realtime:${channelName}` || ch.topic === channelName
    );
    if (existingChannel) {
      supabase.removeChannel(existingChannel);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
          queryClient.invalidateQueries({ queryKey: ['workspace-activity', workspaceId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_members',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
          queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_logs',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['workspace-activity', workspaceId] });
        }
      );

    channel.subscribe((status, err) => {
      if (err) {
        console.warn(`Realtime subscription error on ${channelName}:`, err.message);
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient]);
}
