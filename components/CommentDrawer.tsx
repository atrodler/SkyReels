
// ... existing imports ...
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Icons, MOCK_COMMENTS, CURRENT_USER, linkifyText } from '../constants';
import { Post, Comment, User } from '../types';
import { getPostComments, getProfile, likePost, unlikePost } from '../services/atp';
import UserHandle from './UserHandle';

interface CommentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post | null;
  currentUser?: User | null;
  onUserClick?: (user: User) => void;
  onTagClick?: (tag: string) => void;
  onOpenProfileMenu?: (user: User, text?: string, uri?: string, commentId?: string) => void;
}

// ... CommentItem and ImageLightbox components remain the same ...
// ... (I will keep them as is, only updating CommentDrawer component logic) ...

interface CommentItemProps { 
    comment: Comment; 
    isParent?: boolean;
    isReply?: boolean; 
    isLast?: boolean;
    onReply: (comment: Comment) => void;
    onViewThread: (comment: Comment) => void;
    onHandleClick?: (handle: string) => void;
    onUserClick?: (user: User) => void;
    onTagClick?: (tag: string) => void;
    onOpenProfileMenu?: (user: User, text?: string, uri?: string, commentId?: string) => void;
    onImageClick?: (url: string, videoUrl?: string) => void;
    showLine?: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({ 
    comment, 
    isParent,
    isReply, 
    isLast,
    onReply, 
    onViewThread,
    onHandleClick, 
    onUserClick,
    onTagClick, 
    onOpenProfileMenu,
    onImageClick,
    showLine = false
}) => {
    const [isLiked, setIsLiked] = useState(!!comment.isLiked);
    const [likesCount, setLikesCount] = useState(comment.likesCount || 0);
    const [likeUri, setLikeUri] = useState(comment.likeUri);

    const hasReplies = comment.replies && comment.replies.length > 0;

    const handleToggleLike = async () => {
        if (!comment.uri || !comment.cid) return;
        const wasLiked = isLiked;
        const newCount = wasLiked ? likesCount - 1 : likesCount + 1;
        
        setIsLiked(!wasLiked);
        setLikesCount(newCount);

        try {
            if (wasLiked && likeUri) {
                await unlikePost(likeUri);
                setLikeUri(undefined);
            } else {
                const res = await likePost(comment.uri, comment.cid);
                if (res && res.uri) setLikeUri(res.uri);
            }
        } catch (e) {
            setIsLiked(wasLiked);
            setLikesCount(likesCount);
        }
    };

    const lineColor = "bg-zinc-800"; 
    const lineLeftOffset = "left-[12px]";
    const topSegmentEnd = 4;
    const bottomSegmentStart = 30;

    return (
        <div className="relative flex flex-col pt-1 pb-0.5 transform translate-z-0">
            <div className="flex gap-2 relative">
                {showLine && (
                    <>
                        {!isParent && (
                            <div 
                                className={`absolute ${lineLeftOffset} w-[1px] ${lineColor} z-0 pointer-events-none`} 
                                style={{ top: '0px', height: `${topSegmentEnd}px` }}
                            />
                        )}
                        {!isLast && (
                            <div 
                                className={`absolute ${lineLeftOffset} w-[1px] ${lineColor} z-0 pointer-events-none`} 
                                style={{ 
                                    top: `${bottomSegmentStart}px`, 
                                    bottom: isParent ? '-6px' : '0px' 
                                }}
                            />
                        )}
                    </>
                )}

                <div className="flex flex-col items-center flex-shrink-0 relative z-10">
                     <img 
                        src={comment.author.avatarUrl} 
                        className="w-[26px] h-[26px] rounded-full border border-black/40 object-cover bg-zinc-900 cursor-pointer" 
                        alt=""
                        onClick={() => onUserClick?.(comment.author)}
                    />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1 h-5">
                        <div className="flex items-center min-w-0">
                            <div 
                                onClick={(e) => { e.stopPropagation(); onUserClick?.(comment.author); }}
                                className="cursor-pointer active:opacity-70 transition-opacity flex items-center shrink-0"
                            >
                                <div className="scale-[0.8] origin-left">
                                    <UserHandle handle={comment.author.handle} variant="comment" />
                                </div>
                            </div>
                            <span className="text-[9px] text-zinc-600 font-bold whitespace-nowrap pt-[1px] -ml-[18px]">
                                {comment.createdAt}
                            </span>
                        </div>

                        <div className="flex items-center gap-0.5 flex-shrink-0">
                            <button 
                                onClick={() => onReply(comment)} 
                                className="flex items-center gap-1 px-1 h-6 rounded-lg text-zinc-600 hover:text-blue-400 active:scale-95"
                                title="Reply"
                            >
                                <Icons.MessageCircle size={13} />
                                {hasReplies && (
                                    <span className="text-[9.5px] font-black tabular-nums">{comment.replies?.length}</span>
                                )}
                            </button>

                            <button 
                                onClick={handleToggleLike}
                                className={`flex items-center gap-1 px-1 h-6 rounded-lg transition-all active:scale-95 ${isLiked ? 'text-pink-600' : 'text-zinc-600'}`}
                                title="Like"
                            >
                                <Icons.Heart size={13} filled={isLiked} />
                                {likesCount > 0 && (
                                    <span className="text-[9.5px] font-black tabular-nums">{likesCount}</span>
                                )}
                            </button>

                            <button 
                                onClick={(e) => { e.stopPropagation(); onOpenProfileMenu?.(comment.author, comment.text, comment.uri, comment.id); }} 
                                className="w-6 h-6 flex items-center justify-center text-zinc-600 hover:bg-white/5 rounded-lg active:scale-90"
                            >
                                <Icons.MoreHorizontal size={13} />
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2.5 items-start mt-0.5 mb-1 pr-1">
                        {!comment.text && comment.imageUrl && (
                            <div className="relative group/media cursor-zoom-in" onClick={() => onImageClick?.(comment.imageUrl!, comment.videoUrl)}>
                                {comment.videoUrl ? (
                                    <video 
                                        src={comment.videoUrl} 
                                        poster={comment.imageUrl}
                                        className="w-16 h-16 rounded-lg object-cover border border-white/5 shadow-sm"
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                    />
                                ) : (
                                    <img 
                                        src={comment.imageUrl} 
                                        className="w-16 h-16 rounded-lg object-cover border border-white/5 shadow-sm active:scale-95 transition-transform" 
                                        alt=""
                                    />
                                )}
                            </div>
                        )}

                        {comment.text && (
                            <div className="text-zinc-300 leading-snug font-normal break-words text-[12.5px] pb-0 flex-1">
                                {linkifyText(comment.text, onHandleClick, comment.facets, onTagClick)}
                            </div>
                        )}

                        {comment.text && comment.imageUrl && (
                            <div className="relative group/media cursor-zoom-in ml-1 flex-shrink-0" onClick={() => onImageClick?.(comment.imageUrl!, comment.videoUrl)}>
                                {comment.videoUrl ? (
                                    <video 
                                        src={comment.videoUrl} 
                                        poster={comment.imageUrl}
                                        className="w-14 h-14 rounded-lg object-cover border border-white/5"
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                    />
                                ) : (
                                    <img 
                                        src={comment.imageUrl} 
                                        className="w-14 h-14 rounded-lg object-cover border border-white/5 active:scale-95 transition-transform" 
                                        alt=""
                                    />
                                )}
                            </div>
                        )}
                    </div>

                    {hasReplies && !isParent && (
                        <button 
                            onClick={() => onViewThread(comment)}
                            className="mt-1 mb-1 flex items-center gap-2 text-blue-500 transition-all no-drag group"
                        >
                            <div className="w-4 h-[1px] bg-blue-900 group-hover:bg-blue-700 transition-colors" />
                            <span className="text-[9.5px] font-black uppercase tracking-tight">View {comment.replies?.length} replies</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const ImageLightbox: React.FC<{ url: string; videoUrl?: string; onClose: () => void }> = ({ url, videoUrl, onClose }) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const lastTapRef = useRef<number>(0);
    const startDistRef = useRef<number>(0);
    const startScaleRef = useRef<number>(1);
    const lastPosRef = useRef({ x: 0, y: 0 });
    const [isInteracting, setIsInteracting] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => setIsAnimating(true));
    }, []);

    const handleClose = () => {
        setIsAnimating(false);
        setTimeout(onClose, 200);
    };

    const handleDoubleTap = (e: React.MouseEvent) => {
        const now = Date.now();
        if (now - lastTapRef.current < 300) {
            if (scale > 1) {
                setScale(1);
                setPosition({ x: 0, y: 0 });
            } else {
                setScale(2.5);
            }
        }
        lastTapRef.current = now;
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setIsInteracting(true);
        if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            startDistRef.current = Math.sqrt(dx * dx + dy * dy);
            startScaleRef.current = scale;
        } else if (e.touches.length === 1) {
            lastPosRef.current = { x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y };
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const newScale = Math.max(1, Math.min(5, (dist / startDistRef.current) * startScaleRef.current));
            setScale(newScale);
            if (newScale === 1) setPosition({ x: 0, y: 0 });
        } else if (e.touches.length === 1 && scale > 1) {
            setPosition({
                x: e.touches[0].clientX - lastPosRef.current.x,
                y: e.touches[0].clientY - lastPosRef.current.y
            });
        }
    };

    const handleTouchEnd = () => {
        setIsInteracting(false);
    };

    return (
        <div className="absolute inset-0 z-[1000] flex justify-center pointer-events-auto overflow-hidden" onClick={handleClose}>
            <div className={`absolute inset-0 bg-black/95 transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`} />
            
            <div className="relative w-full max-w-md h-full flex items-center justify-center">
                <div 
                    className={`relative max-w-full max-h-full transition-opacity duration-300 transform allow-zoom ${isAnimating ? 'opacity-100' : 'opacity-0'}`} 
                    style={{ 
                        touchAction: 'none',
                        transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
                        transition: (isInteracting || !isAnimating) ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
                        willChange: 'transform'
                    }}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onClick={(e) => { e.stopPropagation(); handleDoubleTap(e); }}
                >
                    {videoUrl ? (
                        <video 
                            src={videoUrl} 
                            poster={url}
                            className="rounded-2xl shadow-2xl border border-white/5 max-w-[95%] max-h-[85vh] mx-auto object-contain" 
                            autoPlay 
                            loop 
                            muted 
                            playsInline
                            onClick={(e) => e.stopPropagation()} 
                        />
                    ) : (
                        <img 
                            src={url} 
                            className="rounded-2xl shadow-2xl border border-white/5 max-w-[95%] max-h-[85vh] mx-auto object-contain" 
                            alt="" 
                            onClick={(e) => e.stopPropagation()} 
                        />
                    )}
                </div>
                
                <button onClick={handleClose} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/10 backdrop-blur-md z-50">
                    <Icons.X size={20} strokeWidth={2.5} />
                </button>
                
                {scale === 1 && (
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 pointer-events-none z-[1001] animate-fade-in transition-opacity duration-500">
                        <div className="bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10 whitespace-nowrap shadow-2xl">
                            <span className="text-[11px] font-black text-white/70 uppercase tracking-[0.18em] block leading-none">
                                Double tap or pinch to zoom
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const CommentDrawer: React.FC<CommentDrawerProps> = ({ isOpen, onClose, post, currentUser, onUserClick, onTagClick, onOpenProfileMenu }) => {
  const [rootComments, setRootComments] = useState<Comment[]>([]);
  const [navigationStack, setNavigationStack] = useState<Comment[]>([]);
  const [hiddenCommentIds, setHiddenCommentIds] = useState<Set<string>>(new Set());
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [enlargedMedia, setEnlargedMedia] = useState<{ url: string; videoUrl?: string } | null>(null);
  
  const lastPostUriRef = useRef<string | null>(null);
  const scrollPositionsRef = useRef<Record<string, number>>({});
  const lastIsMaximizedRef = useRef(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const rootScrollRef = useRef<HTMLDivElement>(null);
  const stackScrollRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (isOpen) {
      setIsRendered(true);
      setDragOffset(0);
      
      const postUri = post?.uri || 'mock';
      if (lastPostUriRef.current !== postUri) {
          setNavigationStack([]);
          setIsMaximized(false);
          lastIsMaximizedRef.current = false;
          scrollPositionsRef.current = {};
          setHiddenCommentIds(new Set());
          lastPostUriRef.current = postUri;
          
          if (post) {
            setIsLoadingComments(true);
            setRootComments([]);
            const load = async () => {
              if (post.uri && !post.uri.includes('mock')) {
                  const res = await getPostComments(post.uri);
                  setRootComments(res);
              } else {
                  setRootComments(MOCK_COMMENTS);
              }
              setIsLoadingComments(false);
            };
            load();
          }
      } else {
          setIsMaximized(lastIsMaximizedRef.current);
      }
      
      requestAnimationFrame(() => {
          requestAnimationFrame(() => {
              setIsAnimating(true);
          });
      });
    } else {
      setIsAnimating(false);
      lastIsMaximizedRef.current = isMaximized;
      if (rootScrollRef.current) {
          scrollPositionsRef.current['root'] = rootScrollRef.current.scrollTop;
      }
      Object.entries(stackScrollRefs.current).forEach(([id, el]) => {
          if (el) scrollPositionsRef.current[id] = (el as HTMLDivElement).scrollTop;
      });

      // Increased timeout to match duration-400 for smooth closing
      timeout = setTimeout(() => {
          setIsRendered(false);
          setReplyingTo(null);
          setNewComment('');
          setEnlargedMedia(null);
      }, 400);
    }
    return () => clearTimeout(timeout);
  }, [isOpen, post]);

  // ... (auto-expanding textarea effect) ...
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [newComment]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (enlargedMedia) return;
    const isHeader = (e.target as HTMLElement).closest('.drawer-header');
    if (!isHeader) return;
    
    setIsDragging(true);
    startYRef.current = e.touches[0].clientY;
    if (drawerRef.current) drawerRef.current.style.transition = 'none';
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startYRef.current;
    
    if (deltaY > 0) setDragOffset(deltaY);
    else if (!isMaximized && deltaY < 0) setDragOffset(deltaY);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (drawerRef.current) {
        drawerRef.current.style.transition = 'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1), height 0.4s cubic-bezier(0.32, 0.72, 0, 1)';
    }

    if (isMaximized) {
        if (dragOffset > 100) {
            setIsMaximized(false);
        }
    } else {
        if (dragOffset > 150) {
            onClose();
        } 
        else if (dragOffset < -60) {
            setIsMaximized(true);
        }
    }
    
    setDragOffset(0);
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !post) return;
    const draftText = newComment;
    setNewComment('');
    const comment: Comment = { id: Date.now().toString(), author: currentUser || CURRENT_USER, text: draftText, createdAt: 'now', likesCount: 0, isLiked: false };
    if (replyingTo) {
        setRootComments(prev => {
            const updateReplies = (list: Comment[]): Comment[] => list.map(c => {
                if (c.id === replyingTo.id) return { ...c, replies: [comment, ...(c.replies || [])] };
                if (c.replies) return { ...c, replies: updateReplies(c.replies) };
                return c;
            });
            return updateReplies(prev);
        });
    } else { setRootComments(prev => [comment, ...prev]); }
    setReplyingTo(null);
    if (post.uri && !post.uri.includes('mock')) {
        try {
            const parentUri = replyingTo?.uri || post.uri;
            const parentCid = replyingTo?.cid || post.cid;
            const { createPost } = await import('../services/atp');
            await createPost(draftText, undefined, { root: { uri: post.uri, cid: post.cid }, parent: { uri: parentUri, cid: parentCid } });
        } catch (e) { console.error("Failed to post comment", e); }
    }
  };

  const handleInTextHandleClick = useCallback(async (handle: string) => {
      if (onUserClick) {
          const profile = await getProfile(handle);
          if (profile) onUserClick(profile);
      }
  }, [onUserClick]);

  const handleViewThread = (c: Comment) => {
      if (navigationStack.length === 0) {
          if (rootScrollRef.current) scrollPositionsRef.current['root'] = rootScrollRef.current.scrollTop;
      } else {
          const last = navigationStack[navigationStack.length - 1];
          const el = stackScrollRefs.current[last.id];
          if (el) scrollPositionsRef.current[last.id] = (el as HTMLDivElement).scrollTop;
      }
      setNavigationStack(prev => [...prev, c]);
  };

  const handlePopThread = () => {
      const last = navigationStack[navigationStack.length - 1];
      if (last) {
          const el = stackScrollRefs.current[last.id];
          if (el) scrollPositionsRef.current[last.id] = (el as HTMLDivElement).scrollTop;
      }
      setNavigationStack(prev => prev.slice(0, -1));
  };

  const handleOpenMenuSignal = useCallback((user: User, text?: string, uri?: string, commentId?: string) => {
      if (onOpenProfileMenu) {
          onOpenProfileMenu(user, text, uri, commentId);
      }
  }, [onOpenProfileMenu]);

  useEffect(() => {
    if (navigationStack.length === 0) {
        if (rootScrollRef.current) rootScrollRef.current.scrollTop = scrollPositionsRef.current['root'] || 0;
    } else {
        const last = navigationStack[navigationStack.length - 1];
        const el = stackScrollRefs.current[last.id];
        if (el) (el as HTMLDivElement).scrollTop = scrollPositionsRef.current[last.id] || 0;
    }
  }, [navigationStack]);

  if (!isRendered) return null;

  // Use consistent height to prevent jumpiness, relying on transform for slide
  const targetHeight = isMaximized ? '96dvh' : '80dvh';
  const currentTransform = `translate3d(0, ${isAnimating ? 0 : 100}%, 0) translateY(${dragOffset}px)`;
  const stackDepth = navigationStack.length;

  const filteredRootComments = rootComments.filter(c => !hiddenCommentIds.has(c.id));

  return (
    <div className="absolute inset-0 z-[250] flex items-end justify-center pointer-events-none overflow-hidden">
      <div 
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 pointer-events-auto ${isAnimating ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose} 
      />
      
      <div 
        ref={drawerRef}
        className="w-full max-w-md bg-[#121212] rounded-t-[35px] pointer-events-auto border-t border-white/10 shadow-[0_-10px_50px_rgba(0,0,0,0.8)] flex flex-col transition-all duration-[400ms] cubic-bezier(0.32, 0.72, 0, 1) overflow-hidden"
        style={{ transform: currentTransform, height: targetHeight, contain: 'strict' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* ... Drawer Content ... */}
        <div className="drawer-header flex-shrink-0 flex flex-col pt-3 pb-1 bg-[#1a1a1a] border-b border-white/5 cursor-grab active:cursor-grabbing z-20">
            <div className="w-10 h-1 bg-white/20 rounded-full mb-3 mx-auto" />
            <div className="px-5 w-full flex items-center justify-between h-8">
                <div className="flex items-center gap-3">
                    {stackDepth > 0 && (
                        <button onClick={handlePopThread} className="p-1 -ml-1 text-zinc-400 hover:text-white transition-colors no-drag">
                            <Icons.ChevronLeft size={20} />
                        </button>
                    )}
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] pointer-events-none">
                            {stackDepth > 0 ? 'Replies' : 'Comments'} 
                        </span>
                        
                        {stackDepth > 0 && (
                            <div className="flex items-center gap-1 bg-zinc-800 border border-white/5 px-2 py-0.5 rounded-full no-drag">
                                <Icons.Layers size={8} className="text-zinc-500" strokeWidth={3} />
                                <div className="flex items-center gap-[1px] px-0.5">
                                    {Array.from({ length: stackDepth }).map((_, i) => (
                                        <div key={i} className="w-[1.5px] h-[7px] bg-blue-500 rounded-full" />
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {stackDepth === 0 && <span className="ml-0 bg-white/5 px-1.5 py-0.5 rounded text-white/20 tabular-nums text-[9px] font-bold">[{filteredRootComments.length}]</span>}
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsMaximized(!isMaximized)} className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors no-drag">
                        {isMaximized ? <Icons.ChevronDown size={18} /> : <Icons.ChevronUp size={18} />}
                    </button>
                    <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors no-drag">
                        <Icons.X size={15} strokeWidth={3} />
                    </button>
                </div>
            </div>
        </div>

        <div className="flex-1 relative overflow-hidden bg-transparent">
            <div 
                className="absolute inset-0 flex transition-transform duration-300 ease-out" 
                style={{ transform: `translateX(-${stackDepth * 100}%)` }}
            >
                <div className="w-full flex-shrink-0 h-full flex flex-col">
                    <div 
                        ref={rootScrollRef}
                        onScroll={(e) => { scrollPositionsRef.current['root'] = e.currentTarget.scrollTop; }}
                        className="flex-1 overflow-y-auto no-scrollbar px-4 scroll-container relative"
                        style={{ WebkitOverflowScrolling: 'touch' }}
                    >
                        {isLoadingComments ? (
                            <div className="flex flex-col items-center justify-center h-40 gap-3 opacity-20">
                                <Icons.Loader2 className="animate-spin" size={18} />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em]">Syncing Feed</span>
                            </div>
                        ) : filteredRootComments.length > 0 ? (
                            <div className="pb-32 pt-2">
                                {filteredRootComments.map((comment) => (
                                    <CommentItem 
                                        key={comment.id} 
                                        comment={comment} 
                                        onReply={setReplyingTo} 
                                        onViewThread={handleViewThread} 
                                        onHandleClick={handleInTextHandleClick} 
                                        onUserClick={onUserClick} 
                                        onTagClick={onTagClick} 
                                        onOpenProfileMenu={handleOpenMenuSignal} 
                                        onImageClick={(url, vid) => setEnlargedMedia({ url, videoUrl: vid })} 
                                        showLine={false} 
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-60 text-zinc-800">
                                <Icons.MessageCircle size={32} className="mb-3 opacity-10" />
                                <p className="text-[10px] font-black uppercase tracking-[0.2em]">No Protocol Activity</p>
                            </div>
                        )}
                    </div>
                </div>

                {navigationStack.map((parent, idx) => {
                    const filteredReplies = parent.replies?.filter(r => !hiddenCommentIds.has(r.id)) || [];
                    return (
                        <div key={parent.id} className="w-full flex-shrink-0 h-full flex flex-col border-l border-white/5">
                            <div className="flex-shrink-0 z-30 bg-zinc-900/90 px-4 border-b border-white/5 py-2 relative overflow-hidden">
                                <CommentItem 
                                    comment={parent} 
                                    isParent 
                                    onReply={setReplyingTo} 
                                    onViewThread={handleViewThread} 
                                    onHandleClick={handleInTextHandleClick} 
                                    onUserClick={onUserClick} 
                                    onTagClick={onTagClick} 
                                    onOpenProfileMenu={handleOpenMenuSignal} 
                                    onImageClick={(url, vid) => setEnlargedMedia({ url, videoUrl: vid })} 
                                    showLine={true} 
                                />
                            </div>
                            <div 
                                ref={(el) => { stackScrollRefs.current[parent.id] = el; }}
                                onScroll={(e) => { scrollPositionsRef.current[parent.id] = e.currentTarget.scrollTop; }}
                                className="flex-1 overflow-y-auto no-scrollbar px-4 scroll-container relative"
                                style={{ WebkitOverflowScrolling: 'touch' }}
                            >
                                <div className="pb-32 pt-2">
                                    {filteredReplies.map((reply, ridx) => (
                                        <CommentItem 
                                            key={reply.id} 
                                            comment={reply} 
                                            isReply 
                                            isLast={ridx === filteredReplies.length - 1} 
                                            onReply={setReplyingTo} 
                                            onViewThread={handleViewThread} 
                                            onHandleClick={handleInTextHandleClick} 
                                            onUserClick={onUserClick} 
                                            onTagClick={onTagClick} 
                                            onOpenProfileMenu={handleOpenMenuSignal} 
                                            onImageClick={(url, vid) => setEnlargedMedia({ url, videoUrl: vid })} 
                                            showLine={true} 
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* ... Footer ... */}
        <div className="px-2.5 py-2 bg-[#0a0a0a] border-t border-white/5 pb-8 flex-shrink-0 z-50">
            {replyingTo && (
                <div className="mb-2 px-3 py-1.5 bg-blue-600/20 rounded-xl flex items-center justify-between animate-slide-up">
                    <div className="flex items-center gap-2">
                        <Icons.Reply size={12} className="text-blue-400" />
                        <span className="text-[11px] font-bold text-blue-400">Replying to @{replyingTo.author.handle.split('.')[0]}</span>
                    </div>
                    <button onClick={() => setReplyingTo(null)} className="text-blue-400/60 hover:text-blue-400 p-1">
                        <Icons.X size={14} strokeWidth={3} />
                    </button>
                </div>
            )}
            
            <div className="flex items-center gap-2">
                <div className="flex-1 bg-zinc-900 border border-white/10 rounded-[22px] px-4 py-2 flex items-center focus-within:border-blue-500/40 transition-all min-h-[42px]">
                    <textarea 
                        ref={inputRef}
                        rows={1}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Join the discussion..."
                        className="flex-1 bg-transparent text-[15px] text-zinc-100 focus:outline-none placeholder-zinc-700 resize-none max-h-80 leading-tight font-medium py-1"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handlePostComment();
                            }
                        }}
                    />
                </div>
                <button 
                    onClick={handlePostComment}
                    disabled={!newComment.trim()}
                    className={`h-10 w-10 rounded-full flex items-center justify-center transition-all active:scale-90 flex-shrink-0 ${newComment.trim() ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-white/5 text-zinc-800 border border-white/5 cursor-not-allowed'}`}
                >
                    <Icons.SendHorizontal size={17} strokeWidth={2.5} />
                </button>
            </div>
        </div>
      </div>

      {enlargedMedia && <ImageLightbox url={enlargedMedia.url} videoUrl={enlargedMedia.videoUrl} onClose={() => setEnlargedMedia(null)} />}
    </div>
  );
};

export default React.memo(CommentDrawer);
