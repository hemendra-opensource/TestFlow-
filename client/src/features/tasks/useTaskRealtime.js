import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '../../lib/supabase.js';

/**
 * Hook to subscribe to real-time changes on tasks for a specific project.
 * Automatically handles channel creation, real-time message handling,
 * TanStack Query cache invalidation, and subscription teardown.
 */
export function useTaskRealtime(projectId) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!projectId || !isSupabaseConfigured) return;

    const channelName = `realtime:tasks:${projectId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          // Reconcile and refresh task cache
          queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
          queryClient.invalidateQueries({ queryKey: ['project', projectId] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.warn(`Realtime subscription error on ${channelName}:`, err.message);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);
}
