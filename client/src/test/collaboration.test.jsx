import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { CommentItem } from '../features/comments/CommentItem.jsx';
import { ActivityFeed } from '../features/activity/ActivityFeed.jsx';

// Mock auth hook
vi.mock('../features/auth/useAuth.js', () => ({
  useAuth: () => ({
    user: { id: 'u-1', email: 'alice@example.com' },
    session: { access_token: 'fake-token' },
    profile: { full_name: 'Alice Cooper' },
  }),
}));

// Mock activity hook
vi.mock('../features/activity/useActivity.js', () => ({
  useWorkspaceActivity: () => ({
    data: [
      {
        id: 'act-1',
        action: 'created',
        created_at: new Date().toISOString(),
        actor: { full_name: 'Alice Cooper', avatar_url: null },
        metadata: { task_title: 'Build Real-Time Collaboration' },
      },
    ],
    isLoading: false,
    error: null,
  }),
}));

describe('Phase 4: Frontend Collaboration & Comments Components', () => {
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

  const sampleComment = {
    id: 'c-101',
    task_id: 't-123',
    author_id: 'u-1',
    content: 'Initial architecture discussion completed.',
    created_at: new Date(Date.now() - 60000).toISOString(),
    edited_at: null,
    author: {
      id: 'u-1',
      full_name: 'Alice Cooper',
      avatar_url: null,
    },
  };

  it('renders CommentItem with author name, content, and relative time', () => {
    renderWithProviders(
      <CommentItem
        comment={sampleComment}
        currentUserId="u-1"
        userRole="owner"
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('Alice Cooper')).toBeTruthy();
    expect(screen.getByText('Initial architecture discussion completed.')).toBeTruthy();
    expect(screen.getByText('1m ago')).toBeTruthy();
  });

  it('allows author to toggle edit mode and save changes', async () => {
    const onUpdate = vi.fn().mockResolvedValue({});
    const onDelete = vi.fn();

    renderWithProviders(
      <CommentItem
        comment={sampleComment}
        currentUserId="u-1"
        userRole="owner"
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    );

    const editBtn = screen.getByTitle('Edit comment');
    fireEvent.click(editBtn);

    const textarea = screen.getByRole('textbox');
    expect(textarea.value).toBe('Initial architecture discussion completed.');

    fireEvent.change(textarea, {
      target: { value: 'Updated comment content.' },
    });

    const saveBtn = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith({
        commentId: 'c-101',
        content: 'Updated comment content.',
      });
    });
  });

  it('renders ActivityFeed showing recent workspace actions', () => {
    renderWithProviders(<ActivityFeed workspaceId="ws-1" />);

    expect(screen.getByText('Activity History')).toBeTruthy();
    expect(screen.getByText('Alice Cooper')).toBeTruthy();
    expect(screen.getByText(/created task/i)).toBeTruthy();
    expect(screen.getByText('"Build Real-Time Collaboration"')).toBeTruthy();
  });
});
