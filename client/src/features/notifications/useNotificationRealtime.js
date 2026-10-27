import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '../../lib/supabase.js';

/**
 * Subscribes to real-time notification events for the authenticated recipient.
 * Uses a unique channel name per instance to prevent subscription collisions
 * in React StrictMode and multi-mount responsive layouts.
 */
export function useNotificationRealtime(userId) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId || !isSupabaseConfigured) return;

    const channelName = `notifications-${userId}-${Math.random().toString(36).slice(2, 8)}`;

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
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
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
  }, [userId, queryClient]);
}
