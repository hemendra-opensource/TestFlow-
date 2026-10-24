import * as tasksService from './tasks.service.js';
import { successResponse } from '../../utils/response.js';

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

    const updated = await tasksService.updateTask(
      req.scopedSupabase,
      taskId,
      workspaceId,
      req.body
    );

    return successResponse(res, updated, 200, 'Task updated successfully');
  } catch (err) {
    next(err);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const result = await tasksService.deleteTask(req.scopedSupabase, taskId);

    return successResponse(res, result, 200, 'Task deleted successfully');
  } catch (err) {
    next(err);
  }
};
