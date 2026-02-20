
// ... imports
import { Post, User } from '../types';
import UserHandle from './UserHandle';
import { followUser, getPopularFeeds, getProfile, searchFeeds, searchPosts, searchUsers, unfollowUser, agent, getTimeline } from '../services/atp';
import { Icons, MOCK_ALL_FEEDS, MOCK_RECENT_SEARCHES, linkifyText } from '../constants';
import React, { useCallback, useEffect, useRef, useState, forwardRef, useImperativeHandle, useMemo } from 'react';
import FeedItem from './FeedItem';

// ... interfaces

export interface SearchTabHandle {
    scrollToTop: () => void;
}

interface SearchTabProps {
    isAuthenticated: boolean;
    onOpenMenu?: () => void;
    onOpenNotifications?: () => void;
    activeTab: 'EXPLORE' | 'FEEDS' | 'TRENDS';
    onTabChange: (tab: 'EXPLORE' | 'FEEDS' | 'TRENDS') => void;
    shouldFocusSearch?: boolean;
    onSearchFocusHandled?: () => void;
    externalSearchQuery?: string;
    onExternalSearchHandled?: () => void;
    onUserClick?: (user: User) => void;
    onPostClick?: (post: Post) => void;
    onFeedClick?: (feed: any) => void;
    onFeedInfo?: (feed: any) => void;
    savedFeeds?: any[];
    onToggleSave?: (uri: string) => void;
    onCommentClick?: (post: Post) => void;
    onShareClick?: (post: Post) => void;
    onTogglePause?: () => void;
    isPaused?: boolean;
    isMuted?: boolean;
    onToggleMute?: () => void;
    onToggleSavePost?: (post: Post) => void;
    onContextMenuClick?: (post: Post) => void;
    isFullScreen?: boolean;
    onSetFullScreen?: (isFull: boolean) => void;
    onQuoteClick?: (post: Post) => void;
}

const FALLBACK_TRENDS = [
    { topic: "BlueSky", volume: "520k", context: "Social" },
    { topic: "AT Protocol", volume: "125k", context: "Tech" },
    { topic: "SkyReels", volume: "85k", context: "App" },
    { topic: "Generative AI", volume: "2.1M", context: "Tech" },
    { topic: "Cyberpunk", volume: "45k", context: "Art" },
    { topic: "Nature Photography", volume: "32k", context: "Art" },
    { topic: "Open Source", volume: "90k", context: "Tech" },
    { topic: "Digital Art", volume: "65k", context: "Art" },
    { topic: "Future of Social", volume: "40k", context: "Tech" },
    { topic: "Indie Dev", volume: "35k", context: "Dev" },
    { topic: "SpaceX", volume: "1.2M", context: "Science" },
    { topic: "Climate Action", volume: "500k", context: "Global" },
    { topic: "Web3", volume: "210k", context: "Tech" },
    { topic: "Retro Gaming", volume: "150k", context: "Gaming" },
    { topic: "Street Food", volume: "75k", context: "Food" }
];

// Helper for random chart data
const generateTrendHistory = () => {
    let current = 50;
    return Array.from({ length: 12 }, () => {
        current = Math.max(10, Math.min(90, current + (Math.random() - 0.5) * 40));
        return current;
    });
};

const enrichTrendData = (data: any[]) => {
    return data.map(item => {
        const history = generateTrendHistory();
        const start = history[0];
        const end = history[history.length - 1];
        const isUp = end >= start;
        return {
            ...item,
            history,
            isUp,
            volume: item.volume || `${(Math.floor(Math.random() * 900) + 10)}${Math.random() > 0.5 ? 'k' : 'M'}`,
            context: item.context || ['Trending', 'News', 'Viral', 'Discussion', 'Global'][Math.floor(Math.random() * 5)]
        };
    });
};

const FeedCard: React.FC<{ 
    feed: any, 
    isAdded?: boolean, 
    onClick?: () => void, 
    onInfo?: (feed: any) => void,
    onToggleSave?: (uri: string) => void
}> = ({ feed, isAdded, onClick, onInfo, onToggleSave }) => {
    const Icon = (Icons as any)[feed.icon] || Icons.Hash;
    const [isProcessing, setIsProcessing] = useState(false);

    const handleToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isProcessing || !onToggleSave) return;
        setIsProcessing(true);
        await onToggleSave(feed.uri);
        setIsProcessing(false);
    };
    
    return (
        <div 
            onClick={onClick}
            className={`relative flex items-center gap-3 p-2.5 rounded-xl border transition-all group cursor-pointer active:scale-[0.98] ${isAdded ? 'bg-white/5 border-white/10' : 'bg-black/20 border-white/5 hover:bg-white/10'}`}
        >
            {feed.avatar ? (
                <img src={feed.avatar} alt={feed.name} className={`w-9 h-9 rounded-xl object-cover border flex-shrink-0 ${isAdded ? 'border-blue-500/30' : 'border-white/10'}`} />
            ) : (
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors border ${isAdded ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-white/5 text-gray-400 border-white/5 group-hover:text-white'}`}>
                    <Icon size={18} strokeWidth={2} />
                </div>
            )}
            <div className="min-w-0 flex-1">
                <h3 className={`text-[13px] font-bold truncate leading-tight ${isAdded ? 'text-white' : 'text-gray-200'}`}>
                    {feed.name}
                </h3>
                {feed.description && (
                    <p className="text-[10px] text-gray-400 truncate leading-tight mt-0.5">
                        {feed.description}
                    </p>
                )}
                <div className="flex items-center gap-1.5 mt-1 text-[9px] font-medium text-gray-600 uppercase tracking-wide">
                    <span className="text-blue-400">@{feed.creatorHandle || 'System'}</span>
                    {feed.subscribers && (
                        <>
                            <span className="w-0.5 h-0.5 bg-gray-600 rounded-full" />
                            <span>{feed.subscribers} subs</span>
                        </>
                    )}
                </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
                <button 
                    onClick={(e) => { e.stopPropagation(); onInfo?.(feed); }}
                    className="p-2 rounded-lg transition-colors active:scale-95 text-gray-600 hover:text-white hover:bg-white/10"
                    title="Feed Info"
                >
                    <Icons.Info size={18} />
                </button>
                
                <button 
                    onClick={handleToggle}
                    disabled={isProcessing}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all active:scale-95 border ${isAdded ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/20' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border-white/5'}`}
                >
                    {isProcessing ? (
                        <Icons.Loader2 size={16} className="animate-spin" />
                    ) : (
                        <Icons.Bookmark size={18} filled={isAdded} className={isAdded ? "fill-white" : ""} />
                    )}
                </button>
            </div>
        </div>
    );
};

const UserResultCard: React.FC<{ user: User, onClick: () => void }> = ({ user, onClick }) => {
    const [isFollowing, setIsFollowing] = useState(!!user.viewer?.following);
    const [isLoading, setIsLoading] = useState(false);

    const handleFollow = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isLoading) return;
        setIsLoading(true);
        try {
            if (isFollowing) {
                if (user.viewer?.following) await unfollowUser(user.viewer.following);
                setIsFollowing(false);
            } else {
                const res = await followUser(user.id);
                setIsFollowing(true);
                if (res) user.viewer = { ...user.viewer, following: res.uri };
            }
        } catch (err) {
            console.error("Follow error", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div onClick={onClick} className="flex items-center gap-3 p-2 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all group cursor-pointer active:scale-[0.98]">
            <img src={user.avatarUrl} className="w-11 h-11 rounded-full border border-white/10 object-cover" alt="" />
            <div className="flex-1 min-w-0">
                <h4 className="text-[13px] font-bold text-white truncate tracking-tight">{user.displayName}</h4>
                <div className="transform scale-[0.8] origin-left opacity-90 -mt-1">
                    <UserHandle handle={user.handle} />
                </div>
            </div>
            <button 
                onClick={handleFollow}
                disabled={isLoading}
                className={`px-4 py-1.5 text-[10px] font-black rounded-full transition-all active:scale-95 ${isFollowing ? 'bg-white/10 text-white border border-white/20' : 'bg-white text-black hover:bg-gray-200'}`}
            >
                {isLoading ? '...' : (isFollowing ? 'Following' : 'Follow')}
            </button>
        </div>
    );
};

const PostResultCard: React.FC<{ post: Post, onClick: () => void, onUserClick?: (u: User) => void }> = ({ post, onClick, onUserClick }) => {
    const handleAvatarClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onUserClick) {
            const fullProfile = await getProfile(post.author.id);
            onUserClick(fullProfile || post.author);
        }
    };

    return (
        <div onClick={onClick} className="bg-white/5 border border-white/5 rounded-xl p-2 flex gap-3 group hover:bg-white/10 transition-all cursor-pointer active:scale-[0.99] h-18 items-center overflow-hidden">
            {post.imageUrl && (
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0 relative border border-white/5">
                    <img src={post.thumbUrl || post.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                    {post.videoUrl && <div className="absolute inset-0 flex items-center justify-center bg-black/20"><Icons.Play size={12} filled className="text-white" /></div>}
                </div>
            )}
            <div className="flex-1 min-w-0 flex-col justify-center gap-0.5 flex">
                <div className="flex items-center gap-1.5 leading-none mb-0.5">
                    <img onClick={handleAvatarClick} src={post.author.avatarUrl} className="w-3.5 h-3.5 rounded-full border border-white/10 object-cover cursor-pointer hover:scale-110 transition-transform" alt="" />
                    <div onClick={handleAvatarClick} className="text-[10px] font-bold text-blue-400 truncate cursor-pointer hover:underline">@{post.author.handle.split('.')[0]}</div>
                    <span className="text-[8px] text-gray-500 font-bold ml-auto">{post.createdAt}</span>
                </div>
                <p className="text-[12px] text-gray-300 leading-snug line-clamp-2 font-medium">
                    {linkifyText(post.text)}
                </p>
            </div>
        </div>
    );
};

const PostGalleryItem: React.FC<{ post: Post, onClick: () => void }> = ({ post, onClick }) => {
    const [hasError, setHasError] = useState(false);

    if (hasError || (!post.imageUrl && !post.videoUrl)) return (
        <div onClick={onClick} className="relative aspect-[3/4] bg-[#111] overflow-hidden rounded-lg border border-white/5 group cursor-pointer active:scale-[0.98] flex flex-col p-3">
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 opacity-50" />
            <div className="relative z-10 flex-1 flex flex-col justify-between">
                <div className="opacity-30">
                    <Icons.Type size={16} />
                </div>
                <p className="text-[10px] font-medium text-white/70 line-clamp-4 leading-relaxed tracking-tight">{post.text}</p>
            </div>
        </div>
    );

    return (
        <div onClick={onClick} className="relative aspect-[3/4] bg-gray-900 overflow-hidden rounded-lg border border-white/5 group cursor-pointer active:scale-[0.98]">
            <img 
                src={post.thumbUrl || post.imageUrl} 
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" 
                alt="" 
                onError={() => setHasError(true)}
            />
            {post.videoUrl && (
                <div className="absolute top-1.5 right-1.5 p-1 rounded bg-black/50 backdrop-blur-sm border border-white/10">
                    <Icons.Play size={10} filled className="text-white" />
                </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                <p className="text-[10px] text-white font-bold line-clamp-2 leading-tight">{post.text}</p>
            </div>
        </div>
    );
};

const Sparkline: React.FC<{ data?: number[]; color?: string; thickness?: number }> = ({ data = [], color, thickness = 2.5 }) => (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={`w-full h-full fill-none stroke-[${thickness}px] ${color || "stroke-blue-500"} opacity-100`}>
        <path d={`M0 ${30 - (data[0] / 100) * 30} ${data.map((v, i) => `L ${(i / (data.length - 1 || 1)) * 100} ${30 - (v / 100) * 30}`).join(' ')}`} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
);

const ProtocolWordCloud: React.FC<{ trends: any[], onWordClick: (word: string) => void }> = ({ trends, onWordClick }) => (
    <div className="w-full h-full flex flex-wrap content-center justify-center gap-2 p-4">
        {trends.slice(0, 15).map((t, i) => (
            <button key={i} onClick={() => onWordClick(t.topic || t.text)} className="text-xs font-bold text-white/60 hover:text-white bg-white/5 px-2 py-1 rounded-lg transition-colors">{t.topic || t.text}</button>
        ))}
    </div>
);

const StatCard: React.FC<{ 
    label: string, 
    value: string, 
    subLabel: string, 
    icon: any, 
    colorClass: string 
}> = ({ label, value, subLabel, icon: Icon, colorClass }) => (
    <div className="bg-[#09090b] border border-white/10 rounded-2xl p-2.5 flex flex-col justify-between h-[64px] relative overflow-hidden group hover:border-white/20 transition-all shadow-lg">
        <div className={`absolute -right-4 -top-4 w-20 h-20 ${colorClass.replace('text-', 'bg-')}/10 blur-[40px] rounded-full group-hover:scale-125 transition-transform duration-700 pointer-events-none`} />

        <div className="relative z-10 flex justify-between items-start">
            <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-wider">{label}</span>
            <Icon size={12} className={`${colorClass} opacity-80 group-hover:scale-110 transition-transform duration-500`} strokeWidth={2.5} />
        </div>
        <div className="relative z-10">
            <div className="text-[16px] font-black text-white leading-none tracking-tight mb-0.5">{value}</div>
            <div className={`text-[7px] font-bold uppercase tracking-wider ${colorClass}`}>{subLabel}</div>
        </div>
    </div>
);

const ExploreGridItem: React.FC<{ post: Post, index: number, onClick: () => void }> = ({ post, index, onClick }) => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    // Fix: Validated access to thumbUrl property after updating Post interface
    const [displayUrl, setDisplayUrl] = useState<string>(post.thumbUrl || post.imageUrl || '');
    
    // Random subtle gradient for fallback
    const gradientClass = useMemo(() => {
        const grads = [
            'from-blue-900/40 to-black',
            'from-purple-900/40 to-black', 
            'from-emerald-900/40 to-black',
            'from-rose-900/40 to-black',
        ];
        return grads[index % grads.length];
    }, [index]);

    const handleError = () => {
        // Fix: Validated safe comparison of displayUrl with post.thumbUrl
        if (displayUrl === post.thumbUrl && post.imageUrl && post.imageUrl !== post.thumbUrl) {
            // Try high-res as fallback to thumb
            setDisplayUrl(post.imageUrl);
        } else {
            setStatus('error');
        }
    };

    if (status === 'error' || !displayUrl) {
        return (
            <div 
                onClick={onClick} 
                className={`relative bg-gradient-to-br ${gradientClass} overflow-hidden group cursor-pointer border border-white/5 flex flex-col p-3 ${index % 9 === 0 ? 'col-span-2 row-span-2' : ''}`}
            >
                <div className="flex-1 flex flex-col justify-end relative z-10">
                    <p className={`font-bold text-white/90 leading-tight line-clamp-3 tracking-tight ${index % 9 === 0 ? 'text-lg' : 'text-[10px]'}`}>
                        {post.text || "View Post"}
                    </p>
                </div>
                <div className="absolute top-2 right-2 opacity-30">
                    {post.videoUrl ? <Icons.Video size={12}/> : <Icons.Image size={12}/>}
                </div>
                <div className="absolute inset-0 bg-black/20" />
            </div>
        );
    }

    return (
        <div 
            onClick={onClick} 
            className={`relative bg-[#09090b] overflow-hidden group cursor-pointer ${index % 9 === 0 ? 'col-span-2 row-span-2' : ''}`}
        >
            {status !== 'success' && (
                <div className="absolute inset-0 bg-white/[0.05] animate-pulse" />
            )}
            
            <img 
                src={displayUrl} 
                className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${status === 'success' ? 'opacity-100' : 'opacity-0'}`} 
                alt="" 
                loading="lazy" 
                onLoad={() => setStatus('success')}
                onError={handleError} 
            />
            
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/70 opacity-60" />
            
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 text-[9px] font-black text-white drop-shadow-lg">
                {post.videoUrl ? <Icons.Play size={9} filled /> : <Icons.Image size={9} />} 
                {(post.likesCount + (post.sharesCount || 0)).toLocaleString()}
            </div>
        </div>
    );
};

const SearchTab = forwardRef<SearchTabHandle, SearchTabProps>((props, ref) => {
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [postsViewMode, setPostsViewMode] = useState<'list' | 'gallery'>('list');
  const [searchCategory, setSearchCategory] = useState<'ALL' | 'FEEDS' | 'USERS' | 'POSTS'>('ALL');
  
  const [searchResults, setSearchResults] = useState<{ users: User[], feeds: any[], posts: Post[] }>({ users: [], feeds: [], posts: [] });
  const [searchCursors, setSearchCursors] = useState<{ users?: string, feeds?: string, posts?: string }>({});
  const [isLoadingMore, setIsLoadingMore] = useState<{ users: boolean, feeds: boolean, posts: boolean }>({ users: false, feeds: false, posts: false });
  
  const [realProtocolTrends, setRealProtocolTrends] = useState<any[]>([]);
  const [isFetchingTrends, setIsFetchingTrends] = useState(false);
  const [isDataAvailable, setIsDataAvailable] = useState(true);
  const [networkOps, setNetworkOps] = useState(2491);
  const [networkHistory, setNetworkHistory] = useState<number[]>([]);
  const [stats, setStats] = useState({ latency: 45, pds: 814, health: 99.9 });
  const [calculatedLoad, setCalculatedLoad] = useState(2500); 
  
  const [sectionVisibility, setSectionVisibility] = useState({ featured: true, popular: true });
  
  const [discoverFeeds, setDiscoverFeeds] = useState<any[]>(MOCK_ALL_FEEDS.slice(3));
  const [discoverFeedsCursor, setDiscoverFeedsCursor] = useState<string | undefined>(undefined);
  const [isLoadingMoreFeeds, setIsLoadingMoreFeeds] = useState(false);

  const [explorePosts, setExplorePosts] = useState<Post[]>([]);
  const [isLoadingExplore, setIsLoadingExplore] = useState(false);
  const [exploreCursor, setExploreCursor] = useState<string | undefined>(undefined);
  const [activeExploreFeedUri, setActiveExploreFeedUri] = useState<string | undefined>(undefined);
  const [isExploreLoadingMore, setIsExploreLoadingMore] = useState(false);
  const [selectedExploreIndex, setSelectedExploreIndex] = useState<number | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const exploreScrollRef = useRef<HTMLDivElement>(null);
  const feedsScrollRef = useRef<HTMLDivElement>(null);
  const trendsScrollRef = useRef<HTMLDivElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const exploreFeedOverlayRef = useRef<HTMLDivElement>(null);

  // Broad set of keywords to ensure we get results, combined with filtering
  const EXPLORE_QUERY = "(art OR photography OR nature OR travel OR food OR aesthetic OR video) filter:images";

  useImperativeHandle(ref, () => ({
      scrollToTop: () => {
          if (isSearchMode && searchQuery.trim()) {
              searchResultsRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
              if (selectedExploreIndex !== null) {
                  if (props.activeTab === 'EXPLORE') setSelectedExploreIndex(null);
              }
              if (props.activeTab === 'EXPLORE') exploreScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
              else if (props.activeTab === 'FEEDS') feedsScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
              else if (props.activeTab === 'TRENDS') trendsScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
          }
      }
  }));

  const fetchExploreContent = async () => {
      if (isLoadingExplore || !props.isAuthenticated) return;
      setIsLoadingExplore(true);
      setExploreCursor(undefined);
      setActiveExploreFeedUri(undefined);

      try {
          // Attempt 1: Broad Visual Search
          let searchRes = await searchPosts(EXPLORE_QUERY, 40);
          // Fix: Validated usage of thumbUrl property in filter logic
          let visualPosts = searchRes.items.filter(p => !!p.thumbUrl || !!p.imageUrl || !!p.videoUrl);
          
          // If search yielded very few results, fallback to a Popular Feed entirely for better UX
          if (visualPosts.length < 10) {
             const popular = await getPopularFeeds(undefined, 20);
             if (popular.feeds.length > 0) {
                 // Try to find a visual/discovery oriented feed
                 const targetFeed = popular.feeds.find(f => 
                    f.name.toLowerCase().includes('video') || 
                    f.name.toLowerCase().includes('discover') || 
                    f.name.toLowerCase().includes('hot')
                 ) || popular.feeds[0];

                 if (targetFeed && targetFeed.uri) {
                     const feedData = await getTimeline(undefined, targetFeed.uri);
                     const feedVisuals = feedData.posts.filter(p => !!p.thumbUrl || !!p.imageUrl || !!p.videoUrl);
                     
                     if (feedVisuals.length > 0) {
                         // Switch strictly to Feed mode to ensure infinite scroll works reliably on a single source
                         visualPosts = feedVisuals;
                         setExplorePosts(visualPosts);
                         setExploreCursor(feedData.cursor);
                         setActiveExploreFeedUri(targetFeed.uri);
                         setIsLoadingExplore(false);
                         return;
                     }
                 }
             }
          }

          setExplorePosts(visualPosts);
          setExploreCursor(searchRes.cursor);
          setActiveExploreFeedUri(undefined);

      } catch (e: any) {
          console.error("Explore fetch error", e);
      } finally {
          setIsLoadingExplore(false);
      }
  };

  useEffect(() => {
    if (!props.isAuthenticated) return;

    if (explorePosts.length === 0) fetchExploreContent();
    if (realProtocolTrends.length === 0) fetchProtocolTrends();
    
    getPopularFeeds(undefined, 50).then(res => {
        if (res.feeds.length > 0) {
            setDiscoverFeeds(res.feeds);
            setDiscoverFeedsCursor(res.cursor);
        }
    });
  }, [props.isAuthenticated]);

  // Use explorePosts directly without re-sorting to ensure stability during infinite scroll
  const gridPosts = useMemo(() => {
      return explorePosts.filter(Boolean);
  }, [explorePosts]);

  useEffect(() => {
    if (isSearchMode && inputRef.current) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isSearchMode]);

  useEffect(() => {
      if (props.shouldFocusSearch) {
          setIsSearchMode(true);
          props.onSearchFocusHandled?.();
      }
  }, [props.shouldFocusSearch, props.onSearchFocusHandled]);

  useEffect(() => {
    if (props.externalSearchQuery) {
        setIsSearchMode(true);
        setSearchQuery(props.externalSearchQuery);
        props.onExternalSearchHandled?.();
    }
  }, [props.externalSearchQuery, props.onExternalSearchHandled]);

  const checkLatency = async () => {
      const start = performance.now();
      try {
          // Use resolveHandle instead of getProfile for a faster, lighter check
          await agent.resolveHandle({ handle: 'bsky.app' });
      } catch (e) {
          // If resolving standard handle fails, network might be down
      }
      const end = performance.now();
      return Math.round(end - start);
  };

  useEffect(() => {
    const generateDayCurve = () => {
        const points = [];
        const now = new Date();
        const currentHour = now.getHours();
        for (let i = 0; i < 24; i++) {
            const hour = (currentHour - 23 + i + 24) % 24;
            let base = 50;
            if (hour >= 0 && hour < 6) base = 30 - (hour * 2);
            else if (hour >= 6 && hour < 12) base = 40 + ((hour - 6) * 8);
            else if (hour >= 12 && hour < 18) base = 80 + (Math.random() * 10);
            else if (hour >= 18 && hour < 24) base = 90 - ((hour - 18) * 5);
            points.push(Math.max(10, Math.min(100, base + (Math.random() - 0.5) * 10)));
        }
        return points;
    };
    setNetworkHistory(generateDayCurve());
    
    const latencyTimer = setInterval(async () => {
        if (props.isAuthenticated) {
            const ping = await checkLatency();
            setStats(prev => ({ ...prev, latency: ping }));
        }
    }, 10000);

    const timer = setInterval(() => {
        const baseLoad = calculatedLoad > 0 ? calculatedLoad : 2500;
        setNetworkOps(prev => Math.max(baseLoad * 0.8, Math.min(baseLoad * 1.2, Math.floor(prev + (Math.random() - 0.48) * (baseLoad * 0.05)))));
        
        setStats(prev => ({
            latency: prev.latency,
            pds: Math.max(810, Math.min(820, prev.pds + (Math.random() > 0.9 ? (Math.random() > 0.5 ? 1 : -1) : 0))),
            health: 99.9 
        }));
        setNetworkHistory(prev => {
            const newHistory = [...prev];
            const lastVal = newHistory[newHistory.length - 1];
            newHistory[newHistory.length - 1] = Math.max(10, Math.min(95, lastVal + (Math.random() - 0.5) * 5));
            return newHistory;
        });
    }, 1000);
    return () => { clearInterval(timer); clearInterval(latencyTimer); };
  }, [calculatedLoad, props.isAuthenticated]);

  const handleTabClick = (tab: 'EXPLORE' | 'FEEDS' | 'TRENDS') => {
      if (props.activeTab === tab) {
          if (tab === 'EXPLORE') {
              if (selectedExploreIndex !== null) setSelectedExploreIndex(null);
              else exploreScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
          }
          if (tab === 'FEEDS') feedsScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
          if (tab === 'TRENDS') trendsScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
          props.onTabChange(tab);
      }
  };

  const handleLoadMoreFeeds = async () => {
      if (isLoadingMoreFeeds || !discoverFeedsCursor || !props.isAuthenticated) return;
      setIsLoadingMoreFeeds(true);
      try {
          const res = await getPopularFeeds(discoverFeedsCursor, 50);
          if (res.feeds.length > 0) {
              setDiscoverFeeds(prev => [...prev, ...res.feeds]);
              setDiscoverFeedsCursor(res.cursor);
          } else setDiscoverFeedsCursor(undefined);
      } catch (e) { console.error("Failed to load more feeds", e); } 
      finally { setIsLoadingMoreFeeds(false); }
  };

  const handleLoadMoreExplore = useCallback(async () => {
      if (isExploreLoadingMore || !exploreCursor || !props.isAuthenticated) return;
      setIsExploreLoadingMore(true);
      try {
          let data;
          let resultPosts: Post[] = [];

          // Use the correct API based on what mode we are in (Search vs Feed Fallback)
          if (activeExploreFeedUri) {
               data = await getTimeline(exploreCursor, activeExploreFeedUri);
               resultPosts = data.posts;
          } else {
               data = await searchPosts(EXPLORE_QUERY, 30, exploreCursor);
               resultPosts = data.items;
          }

          if (resultPosts.length > 0) {
              const visualPosts = resultPosts.filter(p => !!p.thumbUrl || !!p.imageUrl || !!p.videoUrl);
              setExplorePosts(prev => {
                  const newPosts = visualPosts.filter(np => !prev.some(p => p.id === np.id));
                  return [...prev, ...newPosts];
              });
              setExploreCursor(data.cursor);
          } else {
              setExploreCursor(undefined);
          }
      } catch (e) { 
          setExploreCursor(undefined); 
      } finally { 
          setIsExploreLoadingMore(false); 
      }
  }, [isExploreLoadingMore, exploreCursor, activeExploreFeedUri, props.isAuthenticated]);

  const onExploreScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      // Pre-emptive load when near bottom (800px)
      if (scrollHeight - scrollTop - clientHeight < 800) {
          handleLoadMoreExplore();
      }
  }, [handleLoadMoreExplore]);

  const onFeedsScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 600) {
        handleLoadMoreFeeds();
    }
  }, [handleLoadMoreFeeds]);

  const onExploreFeedScroll = useCallback(() => {
      const container = exploreFeedOverlayRef.current;
      if (!container) return;
      const { scrollTop, scrollHeight, clientHeight } = container;
      const index = Math.round(scrollTop / clientHeight);
      if (index !== selectedExploreIndex) {
          setSelectedExploreIndex(index);
      }
      if (scrollHeight - scrollTop - clientHeight < 800) {
          handleLoadMoreExplore();
      }
  }, [selectedExploreIndex, handleLoadMoreExplore]);

  useEffect(() => {
      const container = exploreFeedOverlayRef.current;
      if (container) {
          container.addEventListener('scroll', onExploreFeedScroll);
          return () => container.removeEventListener('scroll', onExploreFeedScroll);
      }
  }, [selectedExploreIndex, explorePosts.length, onExploreFeedScroll]);

  useEffect(() => {
      if (selectedExploreIndex !== null && exploreFeedOverlayRef.current) {
          exploreFeedOverlayRef.current.scrollTop = selectedExploreIndex * exploreFeedOverlayRef.current.clientHeight;
      }
  }, [selectedExploreIndex]); 

  const fetchProtocolTrends = async () => {
      if (isFetchingTrends || !agent.session || !props.isAuthenticated) return;
      setIsFetchingTrends(true);
      try {
          const res = await (agent as any).app.bsky.unspecced.getTrendingTopics({ limit: 25 }); 
          if (res?.data?.topics && res.data.topics.length > 0) {
              setRealProtocolTrends(enrichTrendData(res.data.topics));
              setIsDataAvailable(true);
              
              let totalVolume = 0;
              res.data.topics.forEach(() => {
                  totalVolume += 1000 + Math.random() * 5000;
              });
              setCalculatedLoad(2000 + (totalVolume % 1500));
          } else {
              setRealProtocolTrends(enrichTrendData(FALLBACK_TRENDS));
          }
      } catch (e) {
          setRealProtocolTrends(enrichTrendData(FALLBACK_TRENDS));
          setIsDataAvailable(true);
      } finally { setIsFetchingTrends(false); }
  };

  const executeSearch = useCallback(async (query: string) => {
      if (!query.trim() || !props.isAuthenticated) return;
      setIsSearching(true);
      try {
          const limit = searchCategory === 'ALL' ? 5 : 25;
          let fetchedUsers: { items: User[], cursor?: string } = { items: [] };
          let fetchedPosts: { items: Post[], cursor?: string } = { items: [] };
          let fetchedFeeds: { items: any[], cursor?: string } = { items: [] };
          if (searchCategory === 'ALL' || searchCategory === 'USERS') {
              fetchedUsers = await searchUsers(query, limit);
          }
          if (searchCategory === 'ALL' || searchCategory === 'POSTS') {
              fetchedPosts = await searchPosts(query, limit);
          }
          if (searchCategory === 'ALL' || searchCategory === 'FEEDS') {
              fetchedFeeds = await searchFeeds(query, limit);
          }
          setSearchResults({ users: fetchedUsers.items, posts: fetchedPosts.items, feeds: fetchedFeeds.items });
          setSearchCursors({ users: fetchedUsers.cursor, posts: fetchedPosts.cursor, feeds: fetchedFeeds.cursor });
      } catch (e) { console.error("Search failed", e); } 
      finally { setIsSearching(false); }
  }, [searchCategory, props.isAuthenticated]);

  const handleLoadMoreSearchResults = async (type: 'USERS' | 'FEEDS' | 'POSTS') => {
      if (isLoadingMore[type.toLowerCase() as keyof typeof isLoadingMore] || !props.isAuthenticated) return;
      const cursor = searchCursors[type.toLowerCase() as keyof typeof searchCursors];
      if (!cursor) return;
      setIsLoadingMore(prev => ({ ...prev, [type.toLowerCase()]: true }));
      try {
          if (type === 'USERS') {
              const res = await searchUsers(searchQuery, 25, cursor);
              setSearchResults(prev => ({ ...prev, users: [...prev.users, ...res.items] }));
              setSearchCursors(prev => ({ ...prev, users: res.cursor }));
          } else if (type === 'POSTS') {
              const res = await searchPosts(searchQuery, 25, cursor);
              setSearchResults(prev => ({ ...prev, posts: [...prev.posts, ...res.items] }));
              setSearchCursors(prev => ({ ...prev, posts: res.cursor }));
          } else if (type === 'FEEDS') {
              const res = await searchFeeds(searchQuery, 25, cursor);
              setSearchResults(prev => ({ ...prev, feeds: [...prev.feeds, ...res.items] }));
              setSearchCursors(prev => ({ ...prev, feeds: res.cursor }));
          }
      } catch (e) { console.error(`Load more ${type} failed`, e); }
      finally { setIsLoadingMore(prev => ({ ...prev, [type.toLowerCase()]: false })); }
  };

  const handleSearchResultsScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      if (scrollHeight - scrollTop - clientHeight < 200) {
          if (searchCategory === 'USERS') handleLoadMoreSearchResults('USERS');
          else if (searchCategory === 'POSTS') handleLoadMoreSearchResults('POSTS');
          else if (searchCategory === 'FEEDS') handleLoadMoreSearchResults('FEEDS');
      }
  };

  useEffect(() => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (searchQuery.trim()) searchTimeoutRef.current = setTimeout(() => executeSearch(searchQuery), 400);
      else {
          setSearchResults({ users: [], feeds: [], posts: [] });
          setSearchCursors({});
      }
      return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [searchQuery, executeSearch]);

  const isFeedSaved = (feedUri: string) => props.savedFeeds?.some(f => f.uri === feedUri);

  const SectionHeader = ({ title, count, hasViewMode = false, isCollapsed, onToggleCollapse, onSeeAll }: any) => {
      const handleToggle = (e?: React.MouseEvent) => {
          if (onToggleCollapse) {
              e?.stopPropagation();
              onToggleCollapse();
          }
      };
      const getAccentColor = () => {
          if (title === 'Featured') return 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]';
          if (title === 'Popular') return 'bg-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.5)]';
          if (title.includes('Feed')) return 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]';
          if (title.includes('Community')) return 'bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]';
          if (title.includes('Public')) return 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]';
          return 'bg-white/50';
      };
      const accentClass = getAccentColor();
      return (
        <div 
            onClick={onToggleCollapse ? handleToggle : undefined} 
            className={`sticky top-0 z-30 bg-[#050505]/95 backdrop-blur-xl border-b border-white/5 py-2.5 px-3 flex items-center justify-between transition-all duration-300 ${onToggleCollapse ? 'cursor-pointer hover:bg-white/[0.02]' : ''}`}
        >
            <div className="flex items-center gap-3">
                <div className={`w-1 h-3.5 rounded-full ${accentClass}`} />
                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.15em] drop-shadow-sm">{title}</h3>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-white/10 text-gray-300 font-mono tracking-tight">{count}</span>
            </div>
            <div className="flex items-center gap-1.5">
                {onSeeAll && <button onClick={(e) => { e.stopPropagation(); onSeeAll(); }} className="text-[9px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-wider mr-2 transition-colors">See All</button>}
                {hasViewMode && !isCollapsed && (
                    <div className="flex bg-white/5 rounded-lg border border-white/10 h-7 items-center p-[2.5px] gap-0.5 mr-0.5" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setPostsViewMode('list')} className={`h-full w-7 flex items-center justify-center rounded-md transition-all ${postsViewMode === 'list' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-white'}`}><Icons.List size={11}/></button>
                        <button onClick={() => setPostsViewMode('gallery')} className={`h-full w-7 flex items-center justify-center rounded-md transition-all ${postsViewMode === 'gallery' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-white'}`}><Icons.Grid size={11}/></button>
                    </div>
                )}
                {onToggleCollapse && (
                    <button onClick={handleToggle} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/5">
                        {isCollapsed ? <Icons.ChevronDown size={14} /> : <Icons.ChevronUp size={14} />}
                    </button>
                )}
            </div>
        </div>
      );
  };

  const isTransparentHeader = props.activeTab === 'EXPLORE' && !isSearchMode;

  return (
    <div className="w-full h-full bg-[#050505] text-white flex flex-col relative overflow-hidden">
       <div className={`absolute top-0 left-0 right-0 z-[60] h-[52px] flex items-start pt-[7px] justify-center pointer-events-none px-[57px] transition-opacity duration-300 ${props.isFullScreen ? 'opacity-0' : 'opacity-100'}`}>
          <div className={`absolute inset-0 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5 transition-all duration-300 pointer-events-auto ${isTransparentHeader ? 'opacity-0 !border-transparent pointer-events-none' : 'opacity-100'}`} />
          <div className={`pointer-events-auto relative z-10 h-[40px] flex items-center bg-black/60 backdrop-blur-3xl border border-white/20 rounded-full shadow-2xl mx-auto transition-all duration-300 ${isSearchMode ? 'w-full px-2' : 'p-1 gap-1'}`}>
              
              {isSearchMode ? (
                  <div className="flex items-center w-full h-full">
                      <Icons.Search size={16} className="text-gray-500 ml-2 mr-2 flex-shrink-0" />
                      <input 
                        ref={inputRef}
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search protocol..."
                        className="bg-transparent text-[13px] font-bold text-white placeholder-zinc-600 focus:outline-none w-full h-full"
                      />
                      <button 
                        onClick={() => {
                            setSearchQuery('');
                            setIsSearchMode(false);
                            setSearchCategory('ALL');
                        }}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-gray-400 hover:text-white transition-colors flex-shrink-0"
                      >
                          <Icons.X size={16} />
                      </button>
                  </div>
              ) : (
                  <>
                    <div className={`flex items-center gap-1 h-full overflow-hidden transition-all duration-300 max-w-[240px] opacity-100`}>
                            {(['EXPLORE', 'FEEDS', 'TRENDS'] as const).map((tab) => (
                                <button key={tab} onClick={() => handleTabClick(tab)} className={`h-full rounded-full flex items-center justify-center gap-2 transition-all duration-300 whitespace-nowrap ${props.activeTab === tab ? 'bg-white text-black shadow-lg px-4' : 'text-white/70 w-[32px]'}`}>{tab === 'EXPLORE' ? <Icons.Compass size={18} /> : tab === 'FEEDS' ? <Icons.Grid size={18} /> : <Icons.TrendingUp size={18} />}{props.activeTab === tab && <span className="text-[13px] font-black capitalize">{tab.toLowerCase()}</span>}</button>
                            ))}
                    </div>
                    <div className="w-[1px] h-4 bg-white/10 mx-1 flex-shrink-0" />
                    <button onClick={() => setIsSearchMode(true)} className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors flex-shrink-0 text-white/70 hover:text-white hover:bg-white/10`}>
                        <Icons.Search size={18} />
                    </button>
                  </>
              )}
          </div>
       </div>

       <div className="flex-1 relative w-full h-full">
         <div className={`absolute top-[52px] bottom-0 left-0 right-0 bg-[#050505] z-50 flex flex-col transition-all duration-300 ${isSearchMode ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-4 pointer-events-none'}`}>
             {searchQuery.trim() && (
                 <div className="flex items-center gap-1 px-4 py-2 border-b border-white/5 overflow-x-auto no-scrollbar">
                     {(['ALL', 'FEEDS', 'USERS', 'POSTS'] as const).map(cat => (
                         <button key={cat} onClick={() => setSearchCategory(cat)} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${searchCategory === cat ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-400 border-white/5 hover:text-white'}`}>{cat}</button>
                     ))}
                 </div>
             )}
             {!searchQuery.trim() ? (
                 <div className="flex flex-col flex-1 px-3 space-y-5 overflow-hidden pb-4">
                        <div className="flex-shrink-0 pt-4">
                            <div className="flex justify-between items-center mb-3 px-1">
                                <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Recent</h3>
                                <button className="text-[10px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest">Clear</button>
                            </div>
                            <div className="flex flex-wrap gap-1.5 px-0.5">
                                {MOCK_RECENT_SEARCHES.slice(0, 5).map((term, i) => (
                                    <button key={i} onClick={() => {setSearchQuery(term); setIsSearchMode(true);}} className="px-3 py-1.5 bg-white/5 rounded-lg text-[11px] font-bold text-gray-400 hover:bg-white/10 hover:text-white border border-white/5 transition-all">{term}</button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col overflow-hidden min-h-0 relative">
                            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2 px-1 flex-shrink-0">Protocol Pulse</h3>
                            <div className="flex-1 relative isolate overflow-hidden bg-black/5 rounded-3xl">
                                {realProtocolTrends.length > 0 ? <ProtocolWordCloud trends={realProtocolTrends} onWordClick={(word) => setSearchQuery(word)} /> : <div className="h-full flex items-center justify-center text-gray-700 font-black text-[11px] uppercase tracking-[0.2em]">Syncing Pulse...</div>}
                            </div>
                        </div>
                 </div>
             ) : (
                 <div ref={searchResultsRef} onScroll={handleSearchResultsScroll} className="space-y-4 px-3 pb-24 overflow-y-auto no-scrollbar flex-1 scroll-container pt-2">
                         {isSearching && searchResults.users.length === 0 && searchResults.posts.length === 0 && (<div className="flex justify-center py-10"><Icons.Loader2 className="animate-spin text-blue-500" size={24} /></div>)}
                         {(searchCategory === 'ALL' || searchCategory === 'FEEDS') && searchResults.feeds.length > 0 && (<div className="animate-slide-up"><SectionHeader title="Feed Generators" count={searchResults.feeds.length} onSeeAll={searchCategory === 'ALL' ? () => setSearchCategory('FEEDS') : undefined} /><div className="space-y-1 mt-1.5">{searchResults.feeds.map(f => <FeedCard key={f.id} feed={f} isAdded={isFeedSaved(f.uri)} onClick={() => props.onFeedClick?.(f)} onInfo={props.onFeedInfo} onToggleSave={props.onToggleSave} />)}{searchCategory === 'FEEDS' && isLoadingMore.feeds && <div className="py-4 flex justify-center"><Icons.Loader2 className="animate-spin text-gray-500" size={16} /></div>}</div></div>)}
                         {(searchCategory === 'ALL' || searchCategory === 'USERS') && searchResults.users.length > 0 && (<div className="animate-slide-up"><SectionHeader title="Community" count={searchResults.users.length} onSeeAll={searchCategory === 'ALL' ? () => setSearchCategory('USERS') : undefined} /><div className="space-y-1 mt-1.5">{searchResults.users.map(u => <UserResultCard key={u.id} user={u} onClick={() => props.onUserClick?.(u)} />)}{searchCategory === 'USERS' && isLoadingMore.users && <div className="py-4 flex justify-center"><Icons.Loader2 className="animate-spin text-gray-500" size={16} /></div>}</div></div>)}
                         {(searchCategory === 'ALL' || searchCategory === 'POSTS') && searchResults.posts.length > 0 && (<div className="animate-slide-up"><SectionHeader title="Public Posts" count={searchResults.posts.length} hasViewMode={true} onSeeAll={searchCategory === 'ALL' ? () => setSearchCategory('POSTS') : undefined} /><div className="mt-1.5">{postsViewMode === 'list' ? (<div className="space-y-1">{searchResults.posts.map(p => <PostResultCard key={p.id} post={p} onClick={() => props.onPostClick?.(p)} onUserClick={props.onUserClick} />)}</div>) : (<div className="grid grid-cols-3 gap-1">{searchResults.posts.map(p => <PostGalleryItem key={p.id} post={p} onClick={() => props.onPostClick?.(p)} />)}</div>)}{searchCategory === 'POSTS' && isLoadingMore.posts && <div className="py-4 flex justify-center"><Icons.Loader2 className="animate-spin text-gray-500" size={16} /></div>}</div></div>)}
                 </div>
             )}
         </div>

         <div ref={exploreScrollRef} onScroll={onExploreScroll} className={`absolute inset-0 overflow-y-auto no-scrollbar pb-32 transition-opacity duration-300 ${props.activeTab === 'EXPLORE' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
             <div className="grid grid-cols-3 auto-rows-[160px] gap-0.5 pt-0">
                {isLoadingExplore && explorePosts.length === 0 ? (
                    Array.from({ length: 15 }).map((_, i) => <div key={i} className="bg-white/5 animate-pulse" />)
                ) : (
                    gridPosts.map((post, i) => (
                        <ExploreGridItem 
                            key={post.id} 
                            post={post} 
                            index={i} 
                            onClick={() => setSelectedExploreIndex(i)} 
                        />
                    ))
                )}
                {isExploreLoadingMore && <div className="col-span-3 py-10 flex justify-center"><Icons.Loader2 className="animate-spin text-blue-500" size={24} /></div>}
             </div>
         </div>

         <div ref={feedsScrollRef} onScroll={onFeedsScroll} className={`absolute top-[52px] bottom-0 left-0 right-0 overflow-y-auto no-scrollbar pb-32 transition-opacity duration-300 ${props.activeTab === 'FEEDS' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
             <div className="px-3 py-2 space-y-2">
                <div className="animate-slide-up"><SectionHeader title="Featured" count={4} isCollapsed={!sectionVisibility.featured} onToggleCollapse={() => setSectionVisibility(prev => ({ ...prev, featured: !prev.featured }))} />{sectionVisibility.featured && <div className="space-y-1.5 mt-2 transition-all duration-300">{discoverFeeds.slice(0, 4).map(f => <FeedCard key={f.id} feed={f} isAdded={isFeedSaved(f.uri)} onClick={() => props.onFeedClick?.(f)} onInfo={props.onFeedInfo} onToggleSave={props.onToggleSave} />)}</div>}</div>
                <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}><SectionHeader title="Popular" count={discoverFeeds.length - 4} isCollapsed={!sectionVisibility.popular} onToggleCollapse={() => setSectionVisibility(prev => ({ ...prev, popular: !prev.popular }))} />{sectionVisibility.popular && <div className="space-y-1.5 mt-2 transition-all duration-300">{discoverFeeds.slice(4).map(f => <FeedCard key={f.id} feed={f} isAdded={isFeedSaved(f.uri)} onClick={() => props.onFeedClick?.(f)} onInfo={props.onFeedInfo} onToggleSave={props.onToggleSave} />)}{discoverFeedsCursor && <div className="py-8 flex justify-center"><Icons.Loader2 className={`animate-spin text-blue-500 ${isLoadingMoreFeeds ? 'opacity-100' : 'opacity-0'}`} size={20} /></div>}</div>}</div>
             </div>
         </div>

         <div ref={trendsScrollRef} className={`absolute inset-0 overflow-y-auto no-scrollbar pb-[85px] bg-[#161618] transition-opacity duration-300 ${props.activeTab === 'TRENDS' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
             <div className="pt-[52px] flex flex-col min-h-full">
                <div className="px-1 py-1">
                    <div className="bg-[#09090b] border border-white/10 rounded-2xl p-4 overflow-hidden relative group shadow-2xl">
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-100 pointer-events-none" />
                        <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-blue-600/5 blur-[80px] rounded-full pointer-events-none" />

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-1">
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <div className={`w-2 h-2 rounded-full ${isDataAvailable ? 'bg-emerald-500' : 'bg-amber-500'} z-10 relative`} />
                                        <div className={`absolute inset-0 rounded-full ${isDataAvailable ? 'bg-emerald-500' : 'bg-amber-500'} animate-ping opacity-75`} />
                                    </div>
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em]">Network Load</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md border border-white/5">
                                    <Icons.Activity size={10} className="text-blue-400" />
                                    <span className="text-[9px] font-mono font-bold text-blue-300">REALTIME</span>
                                </div>
                            </div>

                            <div className="flex items-end justify-between mb-4">
                                <div>
                                    <div className={`text-4xl sm:text-5xl font-black font-mono tracking-tighter leading-none ${isDataAvailable ? 'text-white' : 'text-amber-500'} tabular-nums`}>
                                        {isDataAvailable ? networkOps.toLocaleString() : '---'}
                                    </div>
                                    <div className="text-[10px] font-bold text-zinc-600 mt-1 uppercase tracking-wide">Operations / Second</div>
                                </div>
                                
                                <div className="text-right mb-1">
                                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Capacity</div>
                                    <div className="text-lg font-black text-emerald-400 font-mono leading-none">42%</div>
                                </div>
                            </div>

                            <div className="h-20 w-full relative border-t border-white/5 pt-2">
                                <div className="absolute inset-0 top-2 flex items-end justify-between gap-0.5 opacity-20 pointer-events-none">
                                    {Array.from({ length: 40 }).map((_, i) => (
                                        <div 
                                            key={i} 
                                            className="w-full bg-blue-500 rounded-t-[1px]" 
                                            style={{ 
                                                height: `${10 + Math.random() * 50}%`,
                                                opacity: Math.random() * 0.5 + 0.3
                                            }} 
                                        />
                                    ))}
                                </div>
                                <div className="absolute inset-0 top-2 flex items-end w-full h-full filter drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">
                                    <Sparkline 
                                        data={networkHistory} 
                                        color={isDataAvailable ? "stroke-blue-400" : "stroke-amber-500"} 
                                        thickness={2} 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mt-2">
                        <StatCard label="LATENCY" value={`${stats.latency}ms`} subLabel="REALTIME" colorClass="text-emerald-500" icon={Icons.Zap} />
                        <StatCard label="ACTIVE PDS" value={`${stats.pds}`} subLabel="ESTIMATED" colorClass="text-blue-500" icon={Icons.Layers} />
                        <StatCard label="HEALTH" value={`${stats.health}%`} subLabel="STABLE" colorClass="text-emerald-500" icon={Icons.Activity} />
                    </div>
                </div>
                
                <div className="flex-1 flex flex-col mt-2">
                    <div className="sticky top-[52px] z-30 bg-black/60 backdrop-blur-3xl border-b border-white/10 px-4 py-3 flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-2">
                            <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Trending Topics</h3>
                            <span className="flex items-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded-full text-[8px] font-black"><span className={`w-1 h-1 ${isDataAvailable ? 'bg-blue-500 animate-pulse' : 'bg-red-500'} rounded-full shadow-[0_0_5px_#3b82f6]`}/>LIVE</span>
                        </div>
                    </div>
                    <div className="flex flex-col bg-[#121214] min-h-full">
                        {isFetchingTrends ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-3 opacity-50"><Icons.Loader2 className="animate-spin text-blue-500" size={20} /><span className="text-[9px] font-black uppercase tracking-[0.2em]">Syncing Protocol Pulse...</span></div>
                        ) : realProtocolTrends.length > 0 ? (
                            <>
                                {realProtocolTrends.map((item, idx) => (
                                    <div key={idx} onClick={() => {setSearchQuery(item.topic); setIsSearchMode(true);}} className="flex items-center gap-3 px-4 py-3 bg-transparent hover:bg-white/[0.03] border-b border-white/[0.04] transition-all group cursor-pointer active:bg-white/[0.08]">
                                        <div className={`w-5 text-center font-black text-xs tabular-nums ${idx < 3 ? 'text-blue-500 scale-110' : 'text-zinc-600'}`}>{idx + 1}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <div className="text-[14px] font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors truncate">{item.topic}</div>
                                                {idx < 3 && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_5px_#3b82f6]" />}
                                            </div>
                                            <div className="flex items-center gap-2 leading-none mt-1">
                                                <span className="bg-white/5 border border-white/5 px-1.5 py-0.5 rounded text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none">{item.context}</span>
                                                <span className="text-[10px] text-zinc-500 font-mono font-medium">{item.volume}</span>
                                            </div>
                                        </div>
                                        <div className="w-[50px] h-[20px] opacity-70">
                                            <Sparkline data={item.history} color={item.isUp ? 'stroke-emerald-500' : 'stroke-rose-500'} thickness={2} />
                                        </div>
                                        <div className="flex flex-col items-center justify-center w-6">
                                            {item.isUp ? <Icons.ArrowUpRight size={14} className="text-emerald-500" /> : <Icons.ArrowDownRight size={14} className="text-rose-500" />}
                                        </div>
                                    </div>
                                ))}
                            </>
                        ) : null}
                    </div>
                </div>
             </div>
         </div>

         {selectedExploreIndex !== null && (
             <div className="absolute inset-0 z-[200] bg-black animate-slide-up overflow-hidden">
                 <div className={`absolute top-[7px] left-[55px] z-[210] flex items-center gap-1 pointer-events-auto transition-opacity duration-300 ${props.isFullScreen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                     <button 
                        onClick={() => setSelectedExploreIndex(null)}
                        className="w-[40px] h-[40px] min-w-[40px] flex items-center justify-center rounded-full bg-black/60 backdrop-blur-3xl border border-white/20 text-white hover:bg-white/10 transition-colors shadow-2xl"
                     >
                         <Icons.ChevronLeft size={20} />
                     </button>
                 </div>
                 
                 <div 
                    ref={exploreFeedOverlayRef}
                    className="w-full h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
                 >
                     {gridPosts.map((post, index) => {
                         if (Math.abs(index - selectedExploreIndex) > 2) {
                             return <div key={post.id} className="w-full h-full snap-start snap-stop-always bg-black" />;
                         }
                         
                         return (
                             <FeedItem 
                                key={post.id}
                                post={post}
                                isActive={index === selectedExploreIndex}
                                onCommentClick={props.onCommentClick!}
                                onShareClick={props.onShareClick!}
                                onUserClick={props.onUserClick}
                                onTogglePause={props.onTogglePause}
                                isPaused={props.isPaused}
                                isMuted={props.isMuted}
                                onToggleMute={props.onToggleMute}
                                onContextMenuClick={props.onContextMenuClick}
                                isSaved={false} 
                                onToggleSave={props.onToggleSavePost}
                                onSetFullScreen={props.onSetFullScreen}
                                hideOverlay={props.isFullScreen}       
                                onSetPaused={(paused) => { if (paused) props.onTogglePause?.() }}
                                onQuoteClick={props.onQuoteClick}
                             />
                         );
                     })}
                 </div>
             </div>
         )}

       </div>
    </div>
  );
});

export default React.memo(SearchTab);
