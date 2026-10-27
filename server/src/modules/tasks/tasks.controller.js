import * as tasksService from './tasks.service.js';
import { successResponse } from '../../utils/response.js';
import { createNotification } from '../notifications/notifications.service.js';
import { logActivity } from '../activity/activity.service.js';

export const listTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { status, priority, assignee_id, search, sort_by, order } = req.query;

    const tasks = await tasksService.listTasks(
      req.scopedSupabase,
      projectId,
      { status, priority, assignee_id, search, sort_by, order }
    );

    return successResponse(res, tasks, 200, 'Tasks retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const workspaceId = req.project.workspace_id;

    const task = await tasksService.createTask(
      req.scopedSupabase,
      projectId,
      workspaceId,
      req.user.id,
      req.body
    );

    // 1. Log activity
    await logActivity({
      workspaceId,
      actorId: req.user.id,
      entityType: 'task',
      entityId: task.id,
      action: 'created',
      metadata: { task_title: task.title },
    });

    // 2. Notify assignee if assigned
    if (task.assignee_id && task.assignee_id !== req.user.id) {
      await createNotification({
        recipient_id: task.assignee_id,
        workspace_id: workspaceId,
        actor_id: req.user.id,
        type: 'task_assigned',
        title: 'New task assigned to you',
        message: `You were assigned to "${task.title}"`,
        entity_type: 'task',
        entity_id: task.id,
      });
    }

    return successResponse(res, task, 201, 'Task created successfully');
  } catch (err) {
    next(err);
  }
};

export const getTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const task = await tasksService.getTaskById(req.scopedSupabase, taskId);

    return successResponse(res, task, 200, 'Task retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const workspaceId = req.project.workspace_id;
    const previousTask = req.task;

    const updated = await tasksService.updateTask(
      req.scopedSupabase,
      taskId,
      workspaceId,
      req.body
    );

    // 1. Check if assignee changed
    if (
      req.body.assignee_id !== undefined &&
      req.body.assignee_id !== null &&
      req.body.assignee_id !== previousTask?.assignee_id
    ) {
      await logActivity({
        workspaceId,
        actorId: req.user.id,
        entityType: 'task',
        entityId: taskId,
        action: 'assigned',
        metadata: {
          task_title: updated.title,
          assignee_id: req.body.assignee_id,
        },
      });

      if (req.body.assignee_id !== req.user.id) {
        await createNotification({
          recipient_id: req.body.assignee_id,
          workspace_id: workspaceId,
          actor_id: req.user.id,
          type: 'task_assigned',
          title: 'Task assigned to you',
          message: `You were assigned to "${updated.title}"`,
          entity_type: 'task',
          entity_id: taskId,
        });
      }
    }

    // 2. Check if status changed
    if (req.body.status && req.body.status !== previousTask?.status) {
      await logActivity({
        workspaceId,
        actorId: req.user.id,
        entityType: 'task',
        entityId: taskId,
        action: 'status_changed',
        metadata: {
          task_title: updated.title,
          from: previousTask?.status,
          to: req.body.status,
        },
      });

      // Notify assignee if different from actor
      if (updated.assignee_id && updated.assignee_id !== req.user.id) {
        await createNotification({
          recipient_id: updated.assignee_id,
          workspace_id: workspaceId,
          actor_id: req.user.id,
          type: 'task_status_changed',
          title: 'Task status updated',
          message: `Status changed to ${updated.status} on "${updated.title}"`,
          entity_type: 'task',
          entity_id: taskId,
        });
      }

      // Notify creator if different from actor and assignee
      if (
        updated.created_by &&
        updated.created_by !== req.user.id &&
        updated.created_by !== updated.assignee_id
      ) {
        await createNotification({
          recipient_id: updated.created_by,
          workspace_id: workspaceId,
          actor_id: req.user.id,
          type: 'task_status_changed',
          title: 'Task status updated',
          message: `Status changed to ${updated.status} on "${updated.title}"`,
          entity_type: 'task',
          entity_id: taskId,
        });
      }
    }

    return successResponse(res, updated, 200, 'Task updated successfully');
  } catch (err) {
    next(err);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const workspaceId = req.project?.workspace_id;
    const taskTitle = req.task?.title || 'Task';

    const result = await tasksService.deleteTask(req.scopedSupabase, taskId);

    if (workspaceId) {
      await logActivity({
        workspaceId,
        actorId: req.user.id,
        entityType: 'task',
        entityId: taskId,
        action: 'deleted',
        metadata: { task_title: taskTitle },
      });
    }

    return successResponse(res, result, 200, 'Task deleted successfully');
  } catch (err) {
    next(err);
  }
};
