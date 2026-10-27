import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

import { OverviewCards } from '../features/analytics/OverviewCards.jsx';
import { StatusDonutChart } from '../features/analytics/StatusDonutChart.jsx';
import { PriorityBarChart } from '../features/analytics/PriorityBarChart.jsx';
import { WorkloadTable } from '../features/analytics/WorkloadTable.jsx';
import { AnalyticsFilterBar } from '../features/analytics/AnalyticsFilterBar.jsx';
import { AnalyticsPage } from '../pages/AnalyticsPage.jsx';
import { ReportsPage } from '../pages/ReportsPage.jsx';

// Mock auth hook
vi.mock('../features/auth/useAuth.js', () => ({
  useAuth: () => ({
    user: { id: 'u-1', email: 'alice@example.com' },
    session: { access_token: 'fake-token' },
    profile: { full_name: 'Alice Cooper' },
  }),
}));

// Mock workspaces hook
vi.mock('../features/workspaces/useWorkspaces.js', () => ({
  useWorkspaces: () => ({
    data: [{ id: 'ws-1', name: 'Engineering Workspace' }],
    isLoading: false,
  }),
}));

// Mock projects hook
vi.mock('../features/projects/useProjects.js', () => ({
  useProjects: () => ({
    data: [{ id: 'proj-1', name: 'Core Engine' }],
    isLoading: false,
  }),
}));

// Mock notifications hook
vi.mock('../features/notifications/useNotifications.js', () => ({
  useUnreadNotificationsCount: () => ({ data: 2, isLoading: false }),
}));

// Mock reports hook
const mockExportReport = vi.fn();
vi.mock('../features/reports/useReports.js', () => ({
  useProjectReports: () => ({
    data: {
      data: [
        {
          id: 'proj-1',
          name: 'Core Engine',
          workspace_name: 'Engineering Workspace',
          status: 'active',
          total_tasks: 8,
          completed_tasks: 4,
          completion_rate: 50,
          created_at: '2026-01-01T00:00:00.000Z',
        },
      ],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    },
    isLoading: false,
    isFetching: false,
  }),
  useTaskReports: () => ({
    data: {
      data: [
        {
          id: 'task-1',
          title: 'Implement Auth Flow',
          project_name: 'Core Engine',
          assignee_name: 'Alice Cooper',
          status: 'in_progress',
          priority: 'high',
          due_date: '2026-03-01T00:00:00.000Z',
          created_at: '2026-01-01T00:00:00.000Z',
        },
      ],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    },
    isLoading: false,
    isFetching: false,
  }),
  useExportReport: () => ({
    mutate: mockExportReport,
    isPending: false,
  }),
}));

describe('Phase 5: Analytics & Reports Frontend Components', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const renderWithProviders = (ui) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{ui}</BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('renders OverviewCards with live calculated metrics', () => {
    const metrics = {
      total_projects: 3,
      active_projects: 2,
      completed_projects: 1,
      total_tasks: 12,
      tasks_completed: 6,
      tasks_in_progress: 4,
      tasks_pending: 2,
      tasks_overdue: 1,
      completion_rate: 50,
    };

    renderWithProviders(<OverviewCards metrics={metrics} isLoading={false} />);

    expect(screen.getByText('Projects Overview')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('Total Tasks')).toBeTruthy();
    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('Overdue Tasks')).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByText('Task Completion Rate')).toBeTruthy();
    expect(screen.getByText('50%')).toBeTruthy();
  });

  it('renders StatusDonutChart with task count and distribution legend', () => {
    const statusData = {
      total: 10,
      distribution: {
        todo: { count: 3, percentage: 30 },
        in_progress: { count: 4, percentage: 40 },
        in_review: { count: 1, percentage: 10 },
        done: { count: 2, percentage: 20 },
      },
    };

    renderWithProviders(<StatusDonutChart data={statusData} isLoading={false} />);

    expect(screen.getByText('Task Status Distribution')).toBeTruthy();
    expect(screen.getByText('10 tasks')).toBeTruthy();
    expect(screen.getByText('In Progress')).toBeTruthy();
    expect(screen.getByText('(40%)')).toBeTruthy();
  });

  it('renders PriorityBarChart with priority breakdowns', () => {
    const priorityData = {
      total: 8,
      distribution: {
        urgent: { count: 2, percentage: 25 },
        high: { count: 3, percentage: 37.5 },
        medium: { count: 2, percentage: 25 },
        low: { count: 1, percentage: 12.5 },
      },
    };

    renderWithProviders(<PriorityBarChart data={priorityData} isLoading={false} />);

    expect(screen.getByText('Priority Distribution')).toBeTruthy();
    expect(screen.getByText('Urgent')).toBeTruthy();
    expect(screen.getByText('High')).toBeTruthy();
  });

  it('renders WorkloadTable with member assignments and progress bars', () => {
    const workloadData = {
      members: [
        {
          user_id: 'u-1',
          full_name: 'Alice Cooper',
          email: 'alice@example.com',
          total_assigned: 5,
          in_progress: 2,
          completed: 3,
          overdue: 0,
          completion_rate: 60,
        },
      ],
      unassigned: {
        total_assigned: 1,
        in_progress: 1,
        completed: 0,
        overdue: 0,
      },
    };

    renderWithProviders(<WorkloadTable data={workloadData} isLoading={false} />);

    expect(screen.getByText('Team Workload Distribution')).toBeTruthy();
    expect(screen.getByText('Alice Cooper')).toBeTruthy();
    expect(screen.getByText('60%')).toBeTruthy();
    expect(screen.getByText('Unassigned')).toBeTruthy();
  });

  it('renders ReportsPage and switches between Projects and Tasks tabs', () => {
    renderWithProviders(<ReportsPage />);

    expect(screen.getByText('Project & Task Reports')).toBeTruthy();
    expect(screen.getByText('Core Engine')).toBeTruthy();
    expect(screen.getByText('50%')).toBeTruthy();

    // Switch to Tasks Tab
    const tasksTab = screen.getByText('Tasks Report');
    fireEvent.click(tasksTab);

    expect(screen.getByText('Implement Auth Flow')).toBeTruthy();
    expect(screen.getByText('in progress')).toBeTruthy();
  });

  it('triggers CSV export when export button is clicked', () => {
    renderWithProviders(<ReportsPage />);

    const exportBtn = screen.getByRole('button', { name: /export projects csv/i });
    fireEvent.click(exportBtn);

    expect(mockExportReport).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'projects' })
    );
  });
});
