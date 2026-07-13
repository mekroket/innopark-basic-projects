import { useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { useApp } from '../context/AppContext';
import { Heart, MessageSquare, Share2, MoreHorizontal, Edit3, Trash2, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const SocialFeed = () => {
  const { posts, addPost, deletePost, updatePost, toggleLikePost, addComment, deleteComment, showToast, user } = useApp();
  const [newPostContent, setNewPostContent] = useState('');
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedCommentsId, setExpandedCommentsId] = useState<string | null>(null);

  const handleSharePost = () => {
    if (!newPostContent.trim()) return;
    addPost(newPostContent.trim());
    setNewPostContent('');
  };

  const handleUpdateSubmit = (id: string) => {
    if (!editingContent.trim()) return;
    updatePost(id, editingContent.trim());
    setEditingPostId(null);
  };

  const handleCopyLink = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/feed/post/${id}`);
    showToast('Kriptografik ağ linki panoya kopyalandı.', 'success');
  };

  const handleCommentSubmit = (postId: string) => {
    const text = commentInputs[postId] || '';
    if (!text.trim()) return;
    addComment(postId, text.trim());
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-slate-900 dark:text-white">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Galaktik Akış</h1>
        <p className="text-sm text-slate-500 dark:text-white/50">5 aktif koloni kümesinden anlık yayın akışı</p>
      </header>

      <GlassCard className="p-4 flex gap-4 items-start" hover={false}>
        <img src={user?.avatar || 'https://i.pravatar.cc/150?u=commander'} className="w-11 h-11 rounded-full border border-primary object-cover shrink-0" alt="Profile" />
        <div className="flex-1 space-y-3">
          <textarea 
            rows={2}
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="Ağa sinirsel yayın yapın..." 
            className="w-full bg-slate-100 dark:bg-transparent text-sm border-none outline-none resize-none text-slate-900 dark:text-white placeholder:text-slate-400"
          />
          <div className="flex justify-end pt-1">
            <button 
              onClick={handleSharePost}
              disabled={!newPostContent.trim()}
              className="bg-primary hover:bg-primary/80 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-40"
            >
              İletişimi Başlat
            </button>
          </div>
        </div>
      </GlassCard>

      <div className="space-y-6">
        {posts.map((post) => (
          <GlassCard key={post.id} hover={false} className="p-0 overflow-visible relative">
            <div className="p-5">
              <div className="flex justify-between items-start mb-3 relative">
                <div className="flex items-center gap-3">
                  <img src={post.avatar} className="w-11 h-11 rounded-full object-cover border border-slate-200 dark:border-white/10" alt="Avatar" />
                  <div>
                    <h3 className="font-semibold text-sm leading-none mb-1">{post.user}</h3>
                    <p className="text-[11px] text-primary/80 font-medium">{post.location} • {post.time}</p>
                  </div>
                </div>
                
                <div className="relative">
                  <button 
                    onClick={() => setActiveMenuId(activeMenuId === post.id ? null : post.id)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
                  >
                    <MoreHorizontal size={18} />
                  </button>

                  {activeMenuId === post.id && (
                    <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-1.5 shadow-xl z-20 text-xs">
                      <button 
                        onClick={() => { setEditingPostId(post.id); setEditingContent(post.content); setActiveMenuId(null); }}
                        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-left text-slate-700 dark:text-white"
                      >
                        <Edit3 size={14} /> Düzenle
                      </button>
                      <button 
                        onClick={() => { deletePost(post.id); setActiveMenuId(null); }}
                        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-red-500/10 text-red-500 text-left"
                      >
                        <Trash2 size={14} /> Kaldır
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {editingPostId === post.id ? (
                <div className="space-y-2">
                  <textarea
                    rows={2}
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    className="w-full text-sm p-2 rounded-xl bg-slate-100 dark:bg-black/30 text-slate-900 dark:text-white border border-primary/40 focus:outline-none"
                  />
                  <div className="flex gap-2 justify-end text-xs">
                    <button onClick={() => setEditingPostId(null)} className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-white/5 text-slate-600 dark:text-white/70">İptal</button>
                    <button onClick={() => handleUpdateSubmit(post.id)} className="px-3 py-1.5 rounded-lg bg-primary text-white font-medium">Kaydet</button>
                  </div>
                </div>
              ) : (
                <p className="text-slate-800 dark:text-white/90 text-sm leading-relaxed mb-3 whitespace-pre-wrap">{post.content}</p>
              )}

              {post.image && (
                <div className="rounded-xl overflow-hidden mb-3 border border-slate-200 dark:border-white/5 max-h-60">
                  <img src={post.image} alt="Media" className="w-full object-cover" />
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-200 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-black/15 rounded-b-2xl">
              <div className="flex gap-5">
                <button 
                  onClick={() => toggleLikePost(post.id)}
                  className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${post.isLiked ? 'text-secondary' : 'text-slate-500 dark:text-white/50 hover:text-secondary'}`}
                >
                  <Heart size={16} fill={post.isLiked ? 'currentColor' : 'none'} /> {post.likes}
                </button>
                <button 
                  onClick={() => setExpandedCommentsId(expandedCommentsId === post.id ? null : post.id)}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-white/50 hover:text-primary transition-colors"
                >
                  <MessageSquare size={16} /> {post.comments.length}
                </button>
              </div>
              <button onClick={() => handleCopyLink(post.id)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1">
                <Share2 size={16} />
              </button>
            </div>

            <AnimatePresence>
              {expandedCommentsId === post.id && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden border-t border-slate-200 dark:border-white/5 bg-slate-100/50 dark:bg-black/10 px-5 py-4 space-y-4 rounded-b-2xl"
                >
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={commentInputs[post.id] || ''}
                      onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleCommentSubmit(post.id); }}
                      placeholder="Sinirsel yorum ekle..."
                      className="flex-1 bg-white dark:bg-black/20 text-xs px-3 py-2 rounded-xl text-slate-900 dark:text-white border border-slate-300 dark:border-white/10 focus:outline-none focus:border-primary"
                    />
                    <button onClick={() => handleCommentSubmit(post.id)} className="p-2 bg-primary text-white rounded-xl hover:bg-primary/80 transition-colors">
                      <Send size={14} />
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-40 overflow-y-auto">
                    {post.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-2.5 items-start text-xs group">
                        <img src={comment.avatar} className="w-7 h-7 rounded-full object-cover shrink-0" alt="Avatar" />
                        <div className="flex-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl p-2">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="font-semibold text-slate-700 dark:text-white/80">{comment.user}</span>
                            <span className="text-[10px] text-slate-400">{comment.time}</span>
                          </div>
                          <p className="text-slate-600 dark:text-white/70">{comment.text}</p>
                        </div>
                        {comment.user === user?.name && (
                          <button onClick={() => deleteComment(post.id, comment.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 p-1 self-center transition-opacity">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};