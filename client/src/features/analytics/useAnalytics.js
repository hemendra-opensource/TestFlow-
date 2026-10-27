import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient.js';
import { useAuth } from '../auth/useAuth.js';

function buildAnalyticsQueryString(filters = {}) {
  const params = new URLSearchParams();

  if (filters.workspace_id && filters.workspace_id !== 'all') {
    params.append('workspace_id', filters.workspace_id);
  }
  if (filters.project_id && filters.project_id !== 'all') {
    params.append('project_id', filters.project_id);
  }
  if (filters.status && filters.status !== 'all') {
    params.append('status', filters.status);
  }
  if (filters.priority && filters.priority !== 'all') {
    params.append('priority', filters.priority);
  }
  if (filters.assignee_id && filters.assignee_id !== 'all') {
    params.append('assignee_id', filters.assignee_id);
  }
  if (filters.datePreset && filters.datePreset !== 'all') {
    params.append('datePreset', filters.datePreset);
  }
  if (filters.startDate) {
    params.append('startDate', filters.startDate);
  }
  if (filters.endDate) {
    params.append('endDate', filters.endDate);
  }
  if (filters.dateField) {
    params.append('dateField', filters.dateField);
  }

  const str = params.toString();
  return str ? `?${str}` : '';
}

/**
 * Hook to fetch top-level overview metrics (total/active/completed projects, tasks count, completion rate, etc.)
 */
export function useAnalyticsOverview(filters = {}) {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['analytics-overview', filters],
    queryFn: async () => {
      const qs = buildAnalyticsQueryString(filters);
      return apiClient.get(`/analytics/overview${qs}`);
    },
    enabled: Boolean(session),
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Hook to fetch task status distribution (todo, in_progress, in_review, done counts + percentages)
 */
export function useTaskStatusDistribution(filters = {}) {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['analytics-status-distribution', filters],
    queryFn: async () => {
      const qs = buildAnalyticsQueryString(filters);
      return apiClient.get(`/analytics/tasks/status-distribution${qs}`);
    },
    enabled: Boolean(session),
    staleTime: 1000 * 30,
  });
}

/**
 * Hook to fetch task priority distribution (low, medium, high, urgent counts + percentages)
 */
export function usePriorityDistribution(filters = {}) {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['analytics-priority-distribution', filters],
    queryFn: async () => {
      const qs = buildAnalyticsQueryString(filters);
      return apiClient.get(`/analytics/tasks/priority-distribution${qs}`);
    },
    enabled: Boolean(session),
    staleTime: 1000 * 30,
  });
}

/**
 * Hook to fetch team member workload breakdown (total, in_progress, completed, overdue per member)
 */
export function useWorkloadAnalytics(filters = {}) {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['analytics-workload', filters],
    queryFn: async () => {
      const qs = buildAnalyticsQueryString(filters);
      return apiClient.get(`/analytics/team/workload${qs}`);
    },
    enabled: Boolean(session),
    staleTime: 1000 * 30,
  });
}
