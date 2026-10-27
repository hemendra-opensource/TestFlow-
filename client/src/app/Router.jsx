import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout.jsx';
import { AppLayout } from '../layouts/AppLayout.jsx';
import { ProtectedRoute } from './ProtectedRoute.jsx';
import { PublicRoute } from './PublicRoute.jsx';

import { LoginPage } from '../pages/LoginPage.jsx';
import { RegisterPage } from '../pages/RegisterPage.jsx';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage.jsx';
import { ResetPasswordPage } from '../pages/ResetPasswordPage.jsx';

import { DashboardPage } from '../pages/DashboardPage.jsx';
import { NewWorkspacePage } from '../pages/NewWorkspacePage.jsx';
import { ProfilePage } from '../pages/ProfilePage.jsx';
import { WorkspaceDetailPage } from '../pages/WorkspaceDetailPage.jsx';
import { ProjectDetailPage } from '../pages/ProjectDetailPage.jsx';
import { AnalyticsPage } from '../pages/AnalyticsPage.jsx';
import { ReportsPage } from '../pages/ReportsPage.jsx';
import { NotFoundPage } from '../pages/NotFoundPage.jsx';
import { RouteErrorBoundary } from '../components/RouteErrorBoundary.jsx';

export const router = createBrowserRouter([
  // Public Routes (Redirect to /dashboard if logged in)
  {
    element: <PublicRoute />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
          { path: '/forgot-password', element: <ForgotPasswordPage /> },
          { path: '/reset-password', element: <ResetPasswordPage /> },
        ],
      },
    ],
  },

  // Protected Routes (Redirect to /login if unauthenticated)
  {
    element: <ProtectedRoute />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/workspaces/new', element: <NewWorkspacePage /> },
          { path: '/workspaces/:id', element: <WorkspaceDetailPage /> },
          { path: '/workspaces/:workspaceId', element: <WorkspaceDetailPage /> },
          { path: '/projects/:projectId', element: <ProjectDetailPage /> },
          { path: '/analytics', element: <AnalyticsPage /> },
          { path: '/reports', element: <ReportsPage /> },
          { path: '/settings/profile', element: <ProfilePage /> },
        ],
      },
    ],
  },

  // Fallback 404
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
