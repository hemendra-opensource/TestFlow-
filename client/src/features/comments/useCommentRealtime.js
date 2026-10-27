import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '../../lib/supabase.js';

/**
 * Subscribes to real-time additions, edits, and deletions on comments for a specific task.
 * Uses a unique channel name per instance to prevent subscription collisions.
 */
export function useCommentRealtime(taskId) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!taskId || !isSupabaseConfigured) return;

    const channelName = `comments-${taskId}-${Math.random().toString(36).slice(2, 8)}`;

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
          table: 'task_comments',
          filter: `task_id=eq.${taskId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
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
  }, [taskId, queryClient]);
}
