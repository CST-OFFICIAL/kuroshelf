import { useState, useEffect } from 'react';
import { MessageSquare, Send, User, Trash2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AuthUser } from '../types';

interface Comment {
  id: string;
  user_id: string;
  media_id: number;
  content: string;
  created_at: string;
  profiles: {
    username: string;
    display_name: string;
  };
}

interface CommentSectionProps {
  mediaId: number;
  currentUser: AuthUser | null;
  onOpenAuth: () => void;
}

export function CommentSection({ mediaId, currentUser, onOpenAuth }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => { if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id, user_id, media_id, content, created_at,
          profiles ( username, display_name )
        `)
        .eq('media_id', mediaId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching comments:', error);
      } else {
        setComments(data as unknown as Comment[]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
    
    // Optional: Real-time subscription could go here
  }, [mediaId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return onOpenAuth();
    if (!isSupabaseConfigured) return;
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('comments').insert({
        user_id: currentUser.id,
        media_id: mediaId,
        content: newComment.trim()
      });

      if (!error) {
        setNewComment('');
        await fetchComments();
      }
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleDelete = async (id: string) => {
    if (!currentUser || !isSupabaseConfigured) return;
    try {
      const { error } = await supabase.from('comments').delete().eq('id', id).eq('user_id', currentUser.id);
      if (!error) {
        setComments(prev => prev.filter(c => c.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="mt-8 pt-8 border-t border-neutral-800">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-rose-400" />
        <h3 className="text-xl font-bold text-white">Discussion</h3>
      </div>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center shrink-0 border border-neutral-700">
            {currentUser ? (
              <span className="text-white font-bold text-sm">
                {(currentUser.display_name || currentUser.username || 'U').charAt(0).toUpperCase()}
              </span>
            ) : (
              <User className="w-5 h-5 text-neutral-400" />
            )}
          </div>
          <div className="flex-1 relative">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={currentUser ? "Add a comment..." : "Sign in to join the discussion"}
              onClick={() => !currentUser && onOpenAuth()}
              readOnly={!currentUser}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl pl-4 pr-12 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
            />
            {currentUser && (
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-rose-500 hover:text-rose-400 disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </form>

      <div className="space-y-6">
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="flex gap-3">
                <div className="w-10 h-10 bg-neutral-800 rounded-full shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-neutral-800 rounded w-1/4" />
                  <div className="h-3 bg-neutral-800 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length > 0 ? (
          comments.map(comment => (
            <div key={comment.id} className="flex gap-3 group">
              <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center shrink-0 border border-neutral-700 text-white font-bold text-sm">
                {comment.profiles?.display_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-neutral-200 text-sm">
                      {comment.profiles?.display_name || 'User'}
                    </span>
                    <span className="text-xs text-neutral-400">
                      @{comment.profiles?.username || 'unknown'}
                    </span>
                    <span className="text-[10px] text-neutral-600">
                      • {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {currentUser?.id === comment.user_id && (
                    <button 
                      onClick={() => handleDelete(comment.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  {comment.content}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-neutral-400 text-sm">
            No comments yet. Be the first to share your thoughts!
          </div>
        )}
      </div>
    </div>
  );
}
