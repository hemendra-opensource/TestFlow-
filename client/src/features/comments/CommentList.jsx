import React, { useState } from 'react';
import { MessageSquare, Send, AlertCircle, Loader2 } from 'lucide-react';
import { useComments, useCreateComment, useUpdateComment, useDeleteComment } from './useComments.js';
import { useCommentRealtime } from './useCommentRealtime.js';
import { CommentItem } from './CommentItem.jsx';
import { Button } from '../../components/Button.jsx';
import { useAuth } from '../auth/useAuth.js';

export function CommentList({ taskId, userRole = 'member' }) {
  const { user } = useAuth();
  const { data: comments = [], isLoading, error } = useComments(taskId);
  useCommentRealtime(taskId);

  const createCommentMutation = useCreateComment(taskId);
  const updateCommentMutation = useUpdateComment(taskId);
  const deleteCommentMutation = useDeleteComment(taskId);

  const [newComment, setNewComment] = useState('');
  const [submitError, setSubmitError] = useState(null);

  const isViewer = userRole === 'viewer';

  const handleCreateComment = async (e) => {
    if (e) e.preventDefault();
    if (!newComment.trim() || isViewer) return;

    try {
      setSubmitError(null);
      await createCommentMutation.mutateAsync({ content: newComment.trim() });
      setNewComment('');
    } catch (err) {
      setSubmitError(err.message || 'Failed to post comment');
    }
  };

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleCreateComment();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-brand-600" />
          <span>Comments ({comments.length})</span>
        </h4>
        <span className="text-[11px] text-slate-400">Live conversation</span>
      </div>

      {/* Comment List */}
      {isLoading ? (
        <div className="py-6 flex items-center justify-center text-slate-400 gap-2 text-xs">
          <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
          <span>Loading comments...</span>
        </div>
      ) : error ? (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error.message || 'Failed to load comments.'}</span>
        </div>
      ) : comments.length === 0 ? (
        <div className="py-6 text-center rounded-xl bg-slate-50/80 border border-dashed border-slate-200">
          <MessageSquare className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
          <p className="text-xs font-semibold text-slate-600">No comments yet</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isViewer
              ? 'No discussion on this task yet.'
              : 'Be the first to share an update or leave feedback.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={user?.id}
              userRole={userRole}
              onUpdate={updateCommentMutation.mutateAsync}
              onDelete={deleteCommentMutation.mutateAsync}
            />
          ))}
        </div>
      )}

      {/* New Comment Input Form */}
      {isViewer ? (
        <p className="text-[11px] text-slate-400 italic text-center py-2 bg-slate-50 rounded-lg">
          You have view-only access in this workspace and cannot add comments.
        </p>
      ) : (
        <form onSubmit={handleCreateComment} className="space-y-2 pt-2">
          {submitError && (
            <div className="p-2 rounded-lg bg-red-50 text-red-600 text-xs flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              maxLength={5000}
              placeholder="Write a comment... (Cmd/Ctrl + Enter to send)"
              className="w-full text-xs text-slate-900 placeholder-slate-400 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white resize-none transition-shadow"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400">
              {newComment.length > 0 ? `${newComment.length} / 5000` : 'Press ⌘+Enter to send'}
            </span>

            <Button
              type="submit"
              size="sm"
              variant="primary"
              disabled={!newComment.trim() || createCommentMutation.isPending}
              isLoading={createCommentMutation.isPending}
              rightIcon={Send}
            >
              Post Comment
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
