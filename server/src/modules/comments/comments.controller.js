import * as commentsService from './comments.service.js';
import { successResponse } from '../../utils/response.js';

export const listComments = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const comments = await commentsService.listComments(req.scopedSupabase, taskId);
    return successResponse(res, comments, 200, 'Comments retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const createComment = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;
    const workspaceId = req.workspaceMembership?.workspace_id;

    const comment = await commentsService.createComment(
      req.scopedSupabase,
      taskId,
      req.user,
      req.task,
      workspaceId,
      content
    );

    return successResponse(res, comment, 201, 'Comment added successfully');
  } catch (err) {
    next(err);
  }
};

export const updateComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    const updated = await commentsService.updateComment(
      req.scopedSupabase,
      commentId,
      content
    );

    return successResponse(res, updated, 200, 'Comment updated successfully');
  } catch (err) {
    next(err);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const workspaceId = req.workspaceMembership?.workspace_id;

    const result = await commentsService.deleteComment(
      req.scopedSupabase,
      commentId,
      workspaceId,
      req.user.id,
      req.comment?.task_id,
      req.task?.title
    );

    return successResponse(res, result, 200, 'Comment deleted successfully');
  } catch (err) {
    next(err);
  }
};
