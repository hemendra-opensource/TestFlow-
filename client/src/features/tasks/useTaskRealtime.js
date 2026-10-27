import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '../../lib/supabase.js';

/**
 * Hook to subscribe to real-time changes on tasks for a specific project.
 * Uses a unique channel name per instance to prevent subscription collisions.
 */
export function useTaskRealtime(projectId) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!projectId || !isSupabaseConfigured) return;

    const channelName = `tasks-${projectId}-${Math.random().toString(36).slice(2, 8)}`;

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
          table: 'tasks',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
          queryClient.invalidateQueries({ queryKey: ['project', projectId] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
          queryClient.invalidateQueries({ queryKey: ['workspace-activity'] });
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
  }, [projectId, queryClient]);
}
