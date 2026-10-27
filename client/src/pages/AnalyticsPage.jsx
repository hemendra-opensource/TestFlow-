import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  FileSpreadsheet,
  RefreshCw,
  Bell,
  Sparkles,
} from 'lucide-react';
import {
  useAnalyticsOverview,
  useTaskStatusDistribution,
  usePriorityDistribution,
  useWorkloadAnalytics,
} from '../features/analytics/useAnalytics.js';
import { AnalyticsFilterBar } from '../features/analytics/AnalyticsFilterBar.jsx';
import { OverviewCards } from '../features/analytics/OverviewCards.jsx';
import { StatusDonutChart } from '../features/analytics/StatusDonutChart.jsx';
import { PriorityBarChart } from '../features/analytics/PriorityBarChart.jsx';
import { WorkloadTable } from '../features/analytics/WorkloadTable.jsx';
import { useUnreadNotificationsCount } from '../features/notifications/useNotifications.js';
import { Button } from '../components/Button.jsx';

const DEFAULT_FILTERS = {
  workspace_id: 'all',
  project_id: 'all',
  status: 'all',
  priority: 'all',
  datePreset: 'all',
  startDate: '',
  endDate: '',
  dateField: 'created_at',
};

export function AnalyticsPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  // Queries
  const {
    data: overview,
    isLoading: loadingOverview,
    refetch: refetchOverview,
  } = useAnalyticsOverview(filters);

  const {
    data: statusData,
    isLoading: loadingStatus,
    refetch: refetchStatus,
  } = useTaskStatusDistribution(filters);

  const {
    data: priorityData,
    isLoading: loadingPriority,
    refetch: refetchPriority,
  } = usePriorityDistribution(filters);

  const {
    data: workloadData,
    isLoading: loadingWorkload,
    refetch: refetchWorkload,
  } = useWorkloadAnalytics(filters);

  const { data: unreadNotifications = 0 } = useUnreadNotificationsCount();

  const handleRefresh = () => {
    refetchOverview();
    refetchStatus();
    refetchPriority();
    refetchWorkload();
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 shadow-sm">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Analytics & Workload
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Live performance metrics, task distribution and team capacity
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {unreadNotifications > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
              <Bell className="w-3.5 h-3.5" />
              <span>{unreadNotifications} unread alert{unreadNotifications > 1 ? 's' : ''}</span>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            leftIcon={RefreshCw}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
          <Link to="/reports">
            <Button
              variant="primary"
              size="sm"
              leftIcon={FileSpreadsheet}
            >
              View Reports
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Controls */}
      <AnalyticsFilterBar
        filters={filters}
        onFilterChange={setFilters}
        onReset={handleResetFilters}
      />

      {/* High-Level Overview Cards */}
      <OverviewCards
        metrics={overview}
        isLoading={loadingOverview}
      />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatusDonutChart
          data={statusData}
          isLoading={loadingStatus}
        />
        <PriorityBarChart
          data={priorityData}
          isLoading={loadingPriority}
        />
      </div>

      {/* Team Workload Table */}
      <WorkloadTable
        data={workloadData}
        isLoading={loadingWorkload}
      />
    </div>
  );
}
export default AnalyticsPage;
