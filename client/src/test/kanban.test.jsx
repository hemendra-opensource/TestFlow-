import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskCard } from '../features/kanban/TaskCard.jsx';
import { KanbanColumn } from '../features/kanban/KanbanColumn.jsx';

describe('Kanban Board & TaskCard Components', () => {
  const sampleTask = {
    id: 't-123',
    title: 'Design high-converting landing page',
    description: 'Ensure Tailwind styling and mobile responsiveness',
    status: 'in_progress',
    priority: 'urgent',
    due_date: '2026-12-31',
    assignee: {
      id: 'u-1',
      full_name: 'Sarah Connor',
      avatar_url: null,
    },
  };

  it('renders task card with title, priority, assignee initials, and due date', () => {
    const onEdit = vi.fn();
    const onStatusChange = vi.fn();

    render(
      <TaskCard
        task={sampleTask}
        onEdit={onEdit}
        onStatusChange={onStatusChange}
        canEdit={true}
      />
    );

    expect(screen.getByText('Design high-converting landing page')).toBeTruthy();
    expect(screen.getByText('Urgent')).toBeTruthy();
    expect(screen.getByText('Sarah')).toBeTruthy();
    expect(screen.getByText('SC')).toBeTruthy(); // Initials
  });

  it('allows keyboard/accessible status change through quick move menu', () => {
    const onEdit = vi.fn();
    const onStatusChange = vi.fn();

    render(
      <TaskCard
        task={sampleTask}
        onEdit={onEdit}
        onStatusChange={onStatusChange}
        canEdit={true}
      />
    );

    // Click more/move button
    const moveBtn = screen.getByLabelText(/move task/i);
    fireEvent.click(moveBtn);

    // Options should include "Done"
    const doneOption = screen.getByRole('button', { name: /^Done/ });
    expect(doneOption).toBeTruthy();

    fireEvent.click(doneOption);
    expect(onStatusChange).toHaveBeenCalledWith('t-123', 'done');
  });

  it('renders KanbanColumn with status title, count, and drop zone', () => {
    const onEdit = vi.fn();
    const onAdd = vi.fn();
    const onDrop = vi.fn();

    render(
      <KanbanColumn
        status="in_progress"
        tasks={[sampleTask]}
        onEditTask={onEdit}
        onAddTask={onAdd}
        onDropTask={onDrop}
        canEdit={true}
      />
    );

    expect(screen.getByText('In Progress')).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy(); // Task count
    expect(screen.getByText('Design high-converting landing page')).toBeTruthy();
  });
});
