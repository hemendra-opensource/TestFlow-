import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient.js';
import { useAuth } from '../auth/useAuth.js';

function buildReportsQueryString(filters = {}) {
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
  if (filters.search) {
    params.append('search', filters.search);
  }
  if (filters.page) {
    params.append('page', filters.page.toString());
  }
  if (filters.limit) {
    params.append('limit', filters.limit.toString());
  }
  if (filters.sortBy) {
    params.append('sortBy', filters.sortBy);
  }
  if (filters.sortOrder) {
    params.append('sortOrder', filters.sortOrder);
  }

  const str = params.toString();
  return str ? `?${str}` : '';
}

/**
 * Hook to fetch paginated project reports with task count and completion percentage
 */
export function useProjectReports(filters = {}) {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['reports-projects', filters],
    queryFn: async () => {
      const qs = buildReportsQueryString(filters);
      const res = await apiClient.get(`/reports/projects${qs}`, { rawResponse: true });
      return {
        data: res?.data || [],
        pagination: res?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 },
      };
    },
    enabled: Boolean(session),
    staleTime: 1000 * 30,
  });
}

/**
 * Hook to fetch paginated task reports with project name and assignee info
 */
export function useTaskReports(filters = {}) {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['reports-tasks', filters],
    queryFn: async () => {
      const qs = buildReportsQueryString(filters);
      const res = await apiClient.get(`/reports/tasks${qs}`, { rawResponse: true });
      return {
        data: res?.data || [],
        pagination: res?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 },
      };
    },
    enabled: Boolean(session),
    staleTime: 1000 * 30,
  });
}

/**
 * Triggers CSV file download directly from server export endpoint
 */
export async function downloadReportCsv({ type = 'projects', ...filters }) {
  const params = new URLSearchParams();
  params.append('type', type);

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
  if (filters.search) {
    params.append('search', filters.search);
  }

  const blob = await apiClient.get(`/reports/export?${params.toString()}`, {
    responseType: 'blob',
  });

  const blobUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  const dateStr = new Date().toISOString().split('T')[0];
  anchor.download = `${type}-report-${dateStr}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(blobUrl);
}

/**
 * Mutation hook for exporting report CSV with pending/error state
 */
export function useExportReport() {
  return useMutation({
    mutationFn: downloadReportCsv,
  });
}
