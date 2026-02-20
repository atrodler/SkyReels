
import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react';
import { Icons, CURRENT_USER, linkifyText } from '../constants';
import { getAuthorFeed, getActorFeeds, getActorLists, followUser, unfollowUser, getProfile } from '../services/atp';
import UserHandle from './UserHandle';
import { User, Post } from '../types';
import FeedItem from './FeedItem';

interface ProfileTabProps {
    user?: User | null;
    currentUser?: User | null;
    onBack?: () => void;
    onOpenMenu?: () => void;
    onOpenNotifications?: () => void;
    activeTab?: string;
    onTabChange?: (tab: string) => void;
    onOpenProfileMenu?: (user: User) => void;
    onShareProfile?: (user: User) => void;
    onEditProfile?: () => void;
    onOpenIdentityDetails?: (user: User) => void;
    onOpenLinks?: () => void;
    onPostClick?: (post: Post) => void;
    onMessageUser?: (user: User) => void;
    // FeedItem Props for Internal Navigation
    selectedPost?: Post | null;
    onSelectPost?: (post: Post | null) => void;
    onCommentClick?: (post: Post) => void;
    onShareClick?: (post: Post) => void;
    onUserClick?: (user: User) => void;
    onTagClick?: (tag: string) => void;
    onTogglePause?: () => void;
    isPaused?: boolean;
    isMuted?: boolean;
    onToggleMute?: () => void;
    onToggleSave?: (post: Post) => void;
    onContextMenuClick?: (post: Post) => void;
    onSetFullScreen?: (isFull: boolean) => void;
    onSetPaused?: (paused: boolean) => void;
    isSaved?: boolean;
    checkIsSaved?: (post: Post) => boolean;
    onQuoteClick?: (post: Post) => void;
}

const PostGrid: React.FC<{ posts: Post[]; isLoading: boolean; isFetchingMore: boolean; onPostClick?: (post: Post) => void }> = ({ posts, isLoading, isFetchingMore, onPostClick }) => {
    if (isLoading && posts.length === 0) {
        return (
            <div className="grid grid-cols-3 gap-0.5 w-full">
                {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="aspect-[3/4] bg-white/5 animate-pulse rounded-sm" />
                ))}
            </div>
        );
    }

    if (!isLoading && posts.length === 0) {
        return (
            <div className="py-20 text-center text-gray-500 px-6">
                <Icons.VideoOff size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">No posts found</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-3 gap-0.5 w-full pb-32">
            {posts.map((post) => (
                <div 
                    key={post.id} 
                    onClick={() => onPostClick?.(post)}
                    className="relative group cursor-pointer overflow-hidden bg-[#1a1a1a] aspect-[3/4] hover:opacity-100 opacity-95 transition-opacity"
                >
                    {post.imageUrl ? (
                        <img loading="lazy" src={post.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="" />
                    ) : (
                        <div className="w-full h-full p-3 bg-gradient-to-br from-zinc-800 to-zinc-900 flex flex-col justify-between border border-white/5 relative overflow-hidden group-hover:scale-105 transition-transform">
                            <div className="absolute inset-0 opacity-10 plasma-aura blur-xl pointer-events-none" />
                            <p className="text-[10px] font-black text-white leading-tight line-clamp-4 tracking-tight z-10">
                                {post.text}
                            </p>
                            <div className="mt-auto flex justify-end z-10">
                                <Icons.Type size={12} className="text-white/20" />
                            </div>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 group-hover:opacity-60 transition-opacity" />
                    <div className="absolute bottom-2 left-2 flex items-center gap-1">
                        {post.videoUrl ? (
                            <Icons.Play size={10} className="text-white fill-white" />
                        ) : post.imageUrl ? (
                            <Icons.Image size={10} className="text-white" />
                        ) : (
                            <Icons.MessageSquare size={10} className="text-white" />
                        )}
                        <span className="text-[10px] font-bold text-white drop-shadow-md">{post.likesCount}</span>
                    </div>
                </div>
            ))}
            {isFetchingMore && Array.from({ length: 3 }).map((_, i) => (
                <div key={`more-${i}`} className="aspect-[3/4] bg-white/5 animate-pulse" />
            ))}
        </div>
    );
};

interface FeedRowProps { feed: any; onTogglePin?: (id: string) => void; }
const FeedRow: React.FC<FeedRowProps> = ({ feed }) => {
    const Icon = Icons.Hash;
    return (
        <div className="bg-[#121212] border border-white/5 rounded-2xl p-3 flex items-center justify-between group hover:border-white/10 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
                {feed.avatar ? (
                    <img src={feed.avatar} className="w-10 h-10 rounded-xl object-cover border border-white/5" alt="" />
                ) : (
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <Icon size={18} strokeWidth={2.5} />
                    </div>
                )}
                <div className="min-w-0">
                    <h3 className="font-bold text-sm truncate text-white">{feed.name}</h3>
                    <p className="text-[10px] text-gray-500 line-clamp-1">{feed.description}</p>
                </div>
            </div>
            <div className="flex items-center gap-2 pl-2">
                <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-all bg-white/5 text-gray-600 hover:text-white hover:bg-white/10">
                    <Icons.AtSign size={14} className="rotate-45" />
                </button>
            </div>
        </div>
    )
};

const AvatarLightbox: React.FC<{ rect: DOMRect; src: string; onClose: () => void }> = ({ rect, src, onClose }) => {
    const [isActive, setIsActive] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    
    const [imgStyle, setImgStyle] = useState<React.CSSProperties>({ 
        position: 'absolute',
        top: 0, 
        left: 0, 
        width: rect.width, 
        height: rect.height, 
        borderRadius: '50%', 
        transform: 'translateZ(0)',
        opacity: 0
    });

    useLayoutEffect(() => {
        if (!containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        const startTop = rect.top - containerRect.top;
        const startLeft = rect.left - containerRect.left;
        
        setImgStyle({ 
            position: 'absolute',
            top: startTop, 
            left: startLeft, 
            width: rect.width, 
            height: rect.height, 
            borderRadius: '50%', 
            transform: 'translateZ(0)',
            transition: 'none',
            opacity: 1 
        });

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setIsActive(true);
                const size = Math.min(containerRect.width * 0.9, 380);
                const targetTop = (containerRect.height - size) / 2;
                const targetLeft = (containerRect.width - size) / 2;
                
                setImgStyle({ 
                    position: 'absolute',
                    top: targetTop, 
                    left: targetLeft, 
                    width: size, 
                    height: size, 
                    borderRadius: '50%', 
                    transform: 'translateZ(0)',
                    opacity: 1,
                    transition: 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                });
            });
        });
    }, [rect]);

    const handleClose = () => {
        if (!containerRef.current || isClosing) return;
        setIsClosing(true);
        setIsActive(false);

        const containerRect = containerRef.current.getBoundingClientRect();
        const endTop = rect.top - containerRect.top;
        const endLeft = rect.left - containerRect.left;

        setImgStyle({ 
            position: 'absolute',
            top: endTop, 
            left: endLeft, 
            width: rect.width, 
            height: rect.height, 
            borderRadius: '50%', 
            transform: 'translateZ(0)',
            opacity: 1,
            transition: 'all 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
            boxShadow: 'none'
        });
        setTimeout(onClose, 350);
    };

    return (
        <div ref={containerRef} className="absolute inset-0 z-[200] flex items-center justify-center" onClick={handleClose}>
            <div className={`absolute inset-0 bg-black/90 backdrop-blur-xl transition-opacity duration-300 ease-out ${isActive ? 'opacity-100' : 'opacity-0'}`} />
            <img 
                src={src} 
                className="z-[210] object-cover cursor-zoom-out" 
                style={imgStyle} 
                alt="Enlarged profile" 
                onClick={(e) => { e.stopPropagation(); handleClose(); }} 
            />
        </div>
    );
};

const ProfileTab: React.FC<ProfileTabProps> = ({ 
    user: propUser, 
    currentUser, 
    onBack, 
    activeTab, 
    onTabChange, 
    onOpenMenu,
    onOpenNotifications,
    onOpenProfileMenu, 
    onShareProfile, 
    onEditProfile, 
    onOpenIdentityDetails, 
    onOpenLinks, 
    onMessageUser,
    selectedPost,
    onSelectPost,
    onCommentClick,
    onShareClick,
    onUserClick,
    onTagClick,
    onTogglePause,
    isPaused,
    isMuted,
    onToggleMute,
    onToggleSave,
    onContextMenuClick,
    onSetFullScreen,
    onSetPaused,
    checkIsSaved,
    onPostClick,
    onQuoteClick
}) => {
    const [internalTab, setInternalTab] = useState('Posts');
    const [isFollowing, setIsFollowing] = useState(false);
    const [showHandle, setShowHandle] = useState(false);
    const [isBioExpanded, setIsBioExpanded] = useState(false);
    
    const avatarRef = useRef<HTMLImageElement>(null);
    const [avatarRect, setAvatarRect] = useState<DOMRect | null>(null);
    const [isFocusLocked, setIsFocusLocked] = useState(false);
    
    const [posts, setPosts] = useState<Post[]>([]);
    const [replies, setReplies] = useState<Post[]>([]);
    const [media, setMedia] = useState<Post[]>([]);
    const [feeds, setFeeds] = useState<any[]>([]);
    const [lists, setLists] = useState<any[]>([]);
    
    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
    const [cursors, setCursors] = useState<Record<string, string | undefined>>({});

    const [profileFeedIndex, setProfileFeedIndex] = useState(0);
    const profileFeedRef = useRef<HTMLDivElement>(null);

    const user = propUser || currentUser || CURRENT_USER;
    const isCurrentUser = (currentUser && user.id === currentUser.id) || (!currentUser && user.id === CURRENT_USER.id);
    const activeUserIdRef = useRef<string>(user.id);

    useEffect(() => {
        const interval = setInterval(() => {
            setShowHandle(prev => !prev);
        }, 4000); 
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Immediate Reset on User ID change to prevent data bleeding
        activeUserIdRef.current = user.id;
        setIsFollowing(!!user.viewer?.following);
        
        // Clear all data lists synchronously
        setPosts([]); 
        setReplies([]); 
        setMedia([]); 
        setFeeds([]); 
        setLists([]);
        
        setCursors({});
        setInternalTab('Posts');
        setIsBioExpanded(false);
        setLoadingStates({}); // Reset loading states
        
        if (onTabChange) onTabChange('Posts');
        fetchTabData('Posts');
        
        // Reset scroll position
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
    }, [user.id]);

    const fetchTabData = async (tabId: string, isLoadMore = false) => {
        // Prevent duplicate calls or fetching for stale users
        if (loadingStates[tabId]) return;
        
        // Capture current user ID at call time to check validity later
        const targetUserId = user.id;
        
        const currentCursor = isLoadMore ? cursors[tabId] : undefined;
        if (isLoadMore && !currentCursor) return;

        setLoadingStates(prev => ({ ...prev, [tabId]: true }));
        try {
            switch (tabId) {
                case 'Posts': {
                    const { posts: data, cursor: nextCursor } = await getAuthorFeed(targetUserId, 'posts_no_replies', currentCursor);
                    // Critical: Check if user hasn't changed during await
                    if (activeUserIdRef.current !== targetUserId) return;
                    
                    setPosts(prev => isLoadMore ? [...prev, ...data] : data);
                    setCursors(prev => ({ ...prev, [tabId]: nextCursor }));
                    break;
                }
                case 'Replies': {
                    const { posts: data, cursor: nextCursor } = await getAuthorFeed(targetUserId, 'posts_with_replies', currentCursor);
                    if (activeUserIdRef.current !== targetUserId) return;

                    setReplies(prev => isLoadMore ? [...prev, ...data] : data);
                    setCursors(prev => ({ ...prev, [tabId]: nextCursor }));
                    break;
                }
                case 'Media': {
                    const { posts: data, cursor: nextCursor } = await getAuthorFeed(targetUserId, 'posts_with_media', currentCursor);
                    if (activeUserIdRef.current !== targetUserId) return;

                    setMedia(prev => isLoadMore ? [...prev, ...data] : data);
                    setCursors(prev => ({ ...prev, [tabId]: nextCursor }));
                    break;
                }
                case 'Feeds': {
                    const data = await getActorFeeds(targetUserId);
                    if (activeUserIdRef.current !== targetUserId) return;
                    setFeeds(data);
                    break;
                }
                case 'Lists': {
                    const data = await getActorLists(targetUserId);
                    if (activeUserIdRef.current !== targetUserId) return;
                    setLists(data);
                    break;
                }
            }
        } catch (e) {
            console.error("Tab fetch error", e);
        } finally {
            if (activeUserIdRef.current === targetUserId) {
                setLoadingStates(prev => ({ ...prev, [tabId]: false }));
            }
        }
    };

    const handleAvatarClick = (e: React.MouseEvent) => {
        if (avatarRef.current) {
            const rect = avatarRef.current.getBoundingClientRect();
            setAvatarRect(rect);
        }
    };

    const currentTabId = activeTab || internalTab;
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const stickyHeaderRef = useRef<HTMLDivElement>(null);
    const isRestoringRef = useRef(false);

    const handleTabChange = (newTabId: string) => {
        if (onTabChange) onTabChange(newTabId);
        else setInternalTab(newTabId);
        
        const tabData: any[] = { Posts: posts, Replies: replies, Media: media, Feeds: feeds, Lists: lists }[newTabId] || [];
        if (tabData.length === 0) fetchTabData(newTabId);
    };

    const activeList = useMemo(() => {
        if (currentTabId === 'Posts') return posts;
        if (currentTabId === 'Media') return media;
        if (currentTabId === 'Replies') return replies;
        return [];
    }, [currentTabId, posts, media, replies]);

    useEffect(() => {
        if (selectedPost && activeList.length > 0) {
            const index = activeList.findIndex(p => p.id === selectedPost.id);
            if (index !== -1) {
                setProfileFeedIndex(index);
                setTimeout(() => {
                    if (profileFeedRef.current) {
                        profileFeedRef.current.scrollTo({ top: index * profileFeedRef.current.clientHeight, behavior: 'auto' });
                    }
                }, 0);
            }
        }
    }, [selectedPost]);

    const handleProfileFeedScroll = () => {
        if (profileFeedRef.current) {
            const el = profileFeedRef.current;
            const index = Math.round(el.scrollTop / el.clientHeight);
            if (index !== profileFeedIndex) {
                setProfileFeedIndex(index);
            }
            if (el.scrollHeight - el.scrollTop - el.clientHeight < 200) {
                if (!loadingStates[currentTabId] && cursors[currentTabId]) {
                    fetchTabData(currentTabId, true);
                }
            }
        }
    };

    const PROFILE_TABS = [
        { id: 'Posts', label: 'Posts' }, 
        { id: 'Replies', label: 'Replies' }, 
        { id: 'Media', label: 'Media' }, 
        { id: 'Feeds', label: 'Feeds' }, 
        { id: 'Lists', label: 'Lists' }
    ];

    useLayoutEffect(() => {
        const scrollEl = scrollContainerRef.current;
        const stickyEl = stickyHeaderRef.current;
        if (scrollEl && stickyEl) {
            const stickyThreshold = stickyEl.offsetTop - 52;
            if (scrollEl.scrollTop > stickyThreshold) {
                scrollEl.scrollTo({ top: stickyThreshold, behavior: 'auto' });
            }
        }
    }, [currentTabId]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (isRestoringRef.current) return;
        const target = e.currentTarget;
        
        if (target.scrollHeight - target.scrollTop - target.clientHeight < 200) {
            if (!loadingStates[currentTabId] && cursors[currentTabId]) {
                fetchTabData(currentTabId, true);
            }
        }
    };

    const tabsScrollRef = useRef<HTMLDivElement>(null);
    const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

    useEffect(() => {
        const tab = tabRefs.current[currentTabId];
        const container = tabsScrollRef.current;
        if (tab && container) container.scrollTo({ left: tab.offsetLeft - (container.clientWidth / 2) + (tab.offsetWidth / 2), behavior: 'smooth' });
    }, [currentTabId]);

    const handleFollowToggle = async () => {
        if (!user) return;
        const originalFollowing = isFollowing;
        setIsFollowing(!originalFollowing);
        try {
            if (originalFollowing && user.viewer?.following) {
                await unfollowUser(user.viewer.following);
            } else {
                await followUser(user.id);
            }
        } catch (e) {
            setIsFollowing(originalFollowing);
        }
    };

    const handleBioHandleClick = async (handle: string) => {
        if (onUserClick) {
            const profile = await getProfile(handle);
            if (profile) onUserClick(profile);
        }
    };

    const renderReplies = () => {
        if (loadingStates['Replies'] && replies.length === 0) {
             return <div className="p-10 text-center text-gray-500 text-xs font-bold uppercase tracking-widest">Loading replies...</div>;
        }
        if (replies.length === 0) {
             return <div className="p-20 text-center text-gray-500 text-xs font-bold uppercase tracking-widest">No replies yet</div>;
        }
        return (
            <div className="flex flex-col pb-32">
                {replies.map((reply) => (
                    <div key={reply.id} className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => onSelectPost ? onSelectPost(reply) : onPostClick?.(reply)}>
                        <div className="flex gap-3 items-center mb-1.5">
                            <img src={user.avatarUrl} className="w-6 h-6 rounded-full border border-black/40 object-cover" alt="" />
                            <div className="flex items-center gap-2">
                                <span className="text-white font-bold text-xs">{user.displayName}</span>
                                <span className="text-zinc-600 text-[10px] uppercase font-black tracking-tight">Replied</span>
                            </div>
                        </div>
                        <div className="pl-9">
                            <p className="text-[13px] text-gray-200 leading-snug font-medium">{linkifyText(reply.text)}</p>
                            <div className="mt-3 flex items-center gap-5 text-gray-500">
                                <div className="flex items-center gap-1.5 hover:text-white transition-colors"><Icons.Heart size={12} /> <span className="text-[10px] font-bold">{reply.likesCount}</span></div>
                                <div className="flex items-center gap-1.5 hover:text-white transition-colors"><Icons.MessageCircle size={12} /> <span className="text-[10px] font-bold">{reply.commentsCount}</span></div>
                                <span className="text-[10px] font-black text-zinc-700 ml-auto uppercase tracking-tighter">{reply.createdAt}</span>
                            </div>
                        </div>
                    </div>
                ))}
                {loadingStates['Replies'] && (
                    <div className="py-8 flex justify-center"><Icons.Loader2 className="animate-spin text-gray-700" size={20}/></div>
                )}
            </div>
        );
    };

    const renderFeedsShowcase = () => {
        if (loadingStates['Feeds'] && feeds.length === 0) {
             return <div className="p-10 text-center text-gray-500 text-xs font-bold uppercase tracking-widest">Loading feeds...</div>;
        }
        if (feeds.length === 0) {
             return <div className="p-20 text-center text-gray-500 text-xs font-bold uppercase tracking-widest">No feeds found</div>;
        }
        return (
            <div className="p-4 space-y-3 pb-32">
                {feeds.map(feed => (
                    <FeedRow key={feed.id} feed={feed} />
                ))}
            </div>
        );
    };

    const renderLists = () => {
        if (loadingStates['Lists'] && lists.length === 0) {
             return <div className="p-10 text-center text-gray-500 text-xs font-bold uppercase tracking-widest">Loading lists...</div>;
        }
        if (lists.length === 0) {
             return <div className="p-20 text-center text-gray-500 text-xs font-bold uppercase tracking-widest">No lists found</div>;
        }
        return (
            <div className="p-4 space-y-3 pb-32">
                {lists.map(list => (
                    <div key={list.id} className="bg-[#121212] border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                        {list.avatar ? (
                            <img src={list.avatar} className="w-12 h-12 rounded-xl object-cover" alt="" />
                        ) : (
                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-gray-500">
                                <Icons.List size={24} />
                            </div>
                        )}
                        <div>
                            <h3 className="font-bold text-white text-sm">{list.name}</h3>
                            <p className="text-xs text-gray-500">{list.description || 'No description'}</p>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    if (selectedPost) {
        const displayList = activeList.length > 0 ? activeList : [selectedPost];
        return (
            <div className="absolute inset-0 z-50 bg-black animate-slide-up">
                <div className="absolute top-[7px] left-[55px] z-[60]">
                    <button 
                        onClick={() => onSelectPost?.(null)} 
                        className="w-[40px] h-[40px] min-w-[40px] flex items-center justify-center rounded-full bg-black/60 backdrop-blur-3xl border border-white/20 text-white hover:bg-white/10 transition-colors shadow-2xl"
                    >
                        <Icons.ArrowLeft size={20} />
                    </button>
                </div>
                <div 
                    ref={profileFeedRef}
                    className="w-full h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
                    onScroll={handleProfileFeedScroll}
                >
                    {displayList.map((post, index) => {
                        if (Math.abs(index - profileFeedIndex) > 2) {
                            return <div key={post.id} className="w-full h-full snap-start snap-stop-always bg-black" />;
                        }
                        return (
                            <FeedItem 
                                key={post.id}
                                post={post}
                                isActive={index === profileFeedIndex}
                                onCommentClick={onCommentClick!}
                                onShareClick={onShareClick!}
                                onUserClick={onUserClick}
                                onTagClick={onTagClick}
                                onTogglePause={onTogglePause}
                                isPaused={isPaused}
                                isMuted={isMuted}
                                onToggleMute={onToggleMute}
                                onToggleSave={onToggleSave}
                                onContextMenuClick={onContextMenuClick}
                                onSetFullScreen={onSetFullScreen}
                                onSetPaused={onSetPaused}
                                isSaved={checkIsSaved ? checkIsSaved(post) : false}
                                isFocusLocked={isFocusLocked}
                                onToggleFocusLock={setIsFocusLocked}
                                onQuoteClick={onQuoteClick}
                            />
                        );
                    })}
                </div>
            </div>
        );
    }

    const bioText = user.description || "Digital explorer on the open social web. 🌌 Building cool things for the future of social.";
    const shouldTruncate = bioText.length > 140;

    return (
    <div className="w-full h-full bg-black relative overflow-hidden">
        <div className="absolute top-[-100px] left-[-20%] right-[-20%] h-[600px] bg-gradient-to-b from-[#1a1a1a] via-[#0a0a0a] to-transparent opacity-80 pointer-events-none rounded-[100%] blur-3xl z-0"></div>
        
        {/* IMPORTANT: Keyed container to force remount on user switch to clear scroll state */}
        <div key={user.id} ref={scrollContainerRef} onScroll={handleScroll} className="w-full h-full text-white overflow-y-auto no-scrollbar pb-32 relative z-10 overscroll-contain">
            {/* Header Toolbar */}
            <div className="flex items-start justify-between px-3 pt-[7px] sticky top-0 z-[160] h-[52px] bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5 shadow-sm transition-all duration-300 pointer-events-auto">
                <div className="flex items-center gap-1 flex-shrink-0 min-w-[40px]">
                    <button onClick={onOpenMenu} className="w-[40px] h-[40px] flex items-center justify-center rounded-full bg-black/60 backdrop-blur-3xl border border-white/20 text-white hover:bg-white/10 transition-all shadow-2xl">
                        <Icons.Menu size={20} />
                    </button>
                    {onBack && (
                        <button onClick={onBack} className="w-[40px] h-[40px] flex items-center justify-center rounded-full bg-black/60 backdrop-blur-3xl border border-white/20 text-white hover:bg-white/10 transition-all shadow-2xl">
                            <Icons.ChevronLeft size={20} />
                        </button>
                    )}
                </div>
                
                {/* Center: Interactive Identity */}
                <div className={`flex-1 h-[40px] overflow-hidden relative mx-2`}>
                    <div className={`w-full h-full flex flex-col transition-transform duration-700 cubic-bezier(0.4, 0, 0.2, 1) ${showHandle ? '-translate-y-[40px]' : 'translate-y-0'}`}>
                        <div className="h-[40px] flex items-center justify-center flex-shrink-0">
                                <h2 className="text-lg font-black text-white leading-tight truncate w-full text-center">{user.displayName}</h2>
                        </div>
                        <div className="h-[40px] flex items-center justify-center flex-shrink-0">
                                <div className="scale-90"><UserHandle handle={user.handle} /></div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0 min-w-[40px]">
                    <button onClick={() => onOpenProfileMenu?.(user)} className={`w-[40px] h-[40px] flex items-center justify-center rounded-full bg-black/60 backdrop-blur-3xl border border-white/20 text-white hover:bg-white/10 transition-all shadow-2xl`}>
                        <Icons.MoreHorizontal size={20} />
                    </button>
                    <button onClick={onOpenNotifications} className={`w-[40px] h-[40px] flex items-center justify-center rounded-full bg-black/60 backdrop-blur-3xl border border-white/20 text-white hover:bg-white/10 transition-all shadow-2xl`}>
                        <Icons.Bell size={20} />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="px-6 pt-2 pb-6 flex flex-col gap-1.5">
                {/* Layout: Stats Left, Avatar Right */}
                <div className="flex items-center gap-4"> 
                    {/* Stats Pill */}
                    <div className="flex-1 flex items-center justify-between bg-white/5 rounded-2xl p-2.5 border border-white/5 group shadow-inner h-[58px]">
                        <div className="text-center flex-1 border-r border-white/5 last:border-0"><div className="text-base font-black text-white">{user.postsCount || 0}</div><div className="text-[9px] uppercase font-bold text-gray-500">Posts</div></div>
                        <div className="text-center flex-1 border-r border-white/5 last:border-0"><div className="text-base font-black text-white">{user.followers.toLocaleString()}</div><div className="text-[9px] uppercase font-bold text-gray-500">Followers</div></div>
                        <div className="text-center flex-1"><div className="text-base font-black text-white">{user.following.toLocaleString()}</div><div className="text-[9px] uppercase font-bold text-gray-500">Following</div></div>
                    </div>

                    {/* Avatar */}
                    <div className="flex-shrink-0 w-20 h-20">
                        <div className="w-full h-full rounded-full p-[2px] bg-gradient-to-tr from-white/20 to-white/5 border border-white/10 shadow-xl overflow-hidden active:scale-95 transition-transform cursor-zoom-in" onClick={handleAvatarClick}>
                            <img ref={avatarRef} src={user.avatarUrl} className="w-full h-full rounded-full object-cover bg-black" alt={user.displayName} />
                        </div>
                    </div>
                </div>

                {/* Actions - Tight Spacing (gap-1.5 = 6px) */}
                <div className="flex items-center gap-2 mt-1">
                    {!isCurrentUser && !user.cannotMessage && (
                        <button 
                            onClick={() => onMessageUser?.(user)}
                            className="h-11 w-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition-all active:scale-90 shadow-lg"
                        >
                            <Icons.MessageCircle size={20} />
                        </button>
                    )}
                    <button 
                        onClick={isCurrentUser ? onEditProfile : handleFollowToggle} 
                        className={`h-11 flex-1 rounded-xl font-bold text-sm shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:scale-[1.01] active:scale-95 transition-all ${isCurrentUser || isFollowing ? 'bg-white/10 text-white border border-white/20' : 'bg-white text-black'}`}
                    >
                        {isCurrentUser ? 'Edit profile' : (isFollowing ? 'Following' : 'Follow')}
                    </button>
                    <button onClick={onOpenLinks} className="h-11 w-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition-all active:scale-90 shadow-lg" title="Links">
                        <Icons.Link size={20} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onShareProfile?.(user); }} className="h-11 w-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition-all active:scale-90 shadow-lg" title="Share">
                        <Icons.Share2 size={20} />
                    </button>
                </div>

                {/* Bio Section */}
                <div className="px-1 mt-1">
                    <p className={`text-[13px] text-gray-300 leading-relaxed font-medium ${isBioExpanded ? '' : 'line-clamp-3'}`}>
                        {linkifyText(bioText, handleBioHandleClick)}
                    </p>
                    {shouldTruncate && (
                        <button 
                            onClick={() => setIsBioExpanded(!isBioExpanded)}
                            className="text-[11px] font-bold text-gray-500 hover:text-white mt-1 uppercase tracking-wide flex items-center gap-1"
                        >
                            {isBioExpanded ? 'Show less' : 'Show more'}
                            <Icons.ChevronDown size={10} className={`transition-transform ${isBioExpanded ? 'rotate-180' : ''}`} />
                        </button>
                    )}
                </div>
            </div>

            <div ref={stickyHeaderRef} className="sticky top-[52px] z-20 w-full">
                <div ref={tabsScrollRef} className="bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5 w-full flex items-center px-2 py-2 gap-1 relative z-20 shadow-sm transition-all duration-300">
                    {PROFILE_TABS.map((tab) => {
                        const isActive = currentTabId === tab.id;
                        return (
                            <button 
                                key={tab.id} 
                                ref={(el) => { tabRefs.current[tab.id] = el; }} 
                                onClick={() => handleTabChange(tab.id)} 
                                className={`flex-1 flex justify-center px-2 py-2 text-sm font-bold tracking-wide rounded-full transition-all duration-200 relative items-center gap-2 ${isActive ? 'bg-white text-black shadow-lg' : 'bg-transparent text-gray-500 hover:text-white hover:bg-white/5'}`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="w-full min-h-screen">
                {currentTabId === 'Posts' && (
                    <PostGrid 
                        posts={posts} 
                        isLoading={loadingStates['Posts'] && posts.length === 0} 
                        isFetchingMore={loadingStates['Posts'] && posts.length > 0} 
                        onPostClick={onSelectPost ? onSelectPost : onPostClick}
                    />
                )}
                {currentTabId === 'Media' && (
                    <PostGrid 
                        posts={media} 
                        isLoading={loadingStates['Media'] && media.length === 0} 
                        isFetchingMore={loadingStates['Media'] && media.length > 0} 
                        onPostClick={onSelectPost ? onSelectPost : onPostClick}
                    />
                )}
                {currentTabId === 'Replies' && renderReplies()}
                {currentTabId === 'Feeds' && renderFeedsShowcase()}
                {currentTabId === 'Lists' && renderLists()}
            </div>
        </div>
        {avatarRect && <AvatarLightbox rect={avatarRect} src={user.avatarUrl} onClose={() => setAvatarRect(null)} />}
    </div>
    );
};

export default React.memo(ProfileTab);
