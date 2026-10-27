import React, { useState } from 'react';
import { Edit2, Trash2, Check, X, AlertCircle } from 'lucide-react';
import { Button } from '../../components/Button.jsx';
import { cn } from '../../lib/utils.js';

function formatTimestamp(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function CommentItem({
  comment,
  currentUserId,
  userRole = 'member',
  onUpdate,
  onDelete,
}) {
  const isAuthor = comment.author_id === currentUserId;
  const canDelete =
    isAuthor || ['owner', 'admin'].includes(userRole);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState(null);

  const authorName =
    comment.author?.full_name || 'Team Member';
  const authorInitial = authorName.charAt(0).toUpperCase();

  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      setError('Comment cannot be empty');
      return;
    }
    if (editContent.trim() === comment.content) {
      setIsEditing(false);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onUpdate({ commentId: comment.id, content: editContent.trim() });
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsSubmitting(true);
      await onDelete(comment.id);
    } catch (err) {
      setError(err.message || 'Failed to delete comment');
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="group flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-100 hover:border-slate-200 transition-colors shadow-sm">
      {/* Avatar */}
      {comment.author?.avatar_url ? (
        <img
          src={comment.author.avatar_url}
          alt={authorName}
          className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center shrink-0 border border-brand-200">
          {authorInitial}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-900">{authorName}</span>
            <span className="text-[11px] text-slate-400">
              {formatTimestamp(comment.created_at)}
            </span>
            {comment.edited_at && (
              <span className="text-[10px] text-slate-400 font-medium italic">
                (edited)
              </span>
            )}
          </div>

          {/* Action buttons */}
          {!isEditing && (
            <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 flex items-center gap-1 transition-opacity">
              {isAuthor && (
                <button
                  type="button"
                  onClick={() => {
                    setEditContent(comment.content);
                    setIsEditing(true);
                    setError(null);
                  }}
                  className="p-1 text-slate-400 hover:text-brand-600 rounded hover:bg-slate-100 transition-colors"
                  title="Edit comment"
                  aria-label="Edit comment"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                  title="Delete comment"
                  aria-label="Delete comment"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Edit mode vs Read mode */}
        {isEditing ? (
          <div className="mt-2 space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              maxLength={5000}
              className="w-full text-xs text-slate-800 p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 resize-y"
              autoFocus
            />
            {error && (
              <p className="text-[11px] text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {error}
              </p>
            )}
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>{editContent.length} / 5000</span>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false);
                    setError(null);
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  onClick={handleSaveEdit}
                  isLoading={isSubmitting}
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed break-words">
            {comment.content}
          </p>
        )}

        {/* Delete Confirmation prompt */}
        {showDeleteConfirm && (
          <div className="mt-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 space-y-2 animate-in fade-in duration-150">
            <p className="font-semibold text-[11px]">
              Are you sure you want to delete this comment?
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="danger"
                onClick={handleDelete}
                isLoading={isSubmitting}
              >
                Yes, Delete
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
