import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { HashRouter } from 'react-router-dom';
import FeedItem from './components/FeedItem';
import CreatePostModal from './components/CreatePostModal';
import CommentDrawer from './components/CommentDrawer';
import ShareDrawer from './components/ShareDrawer';
import SearchTab, { SearchTabHandle } from './components/SearchTab';
import ActivityTab from './components/ActivityTab';
import SideMenu from './components/SideMenu';
import ProfileTab from './components/ProfileTab';
import AnimatedDropdown from './components/AnimatedDropdown';
import FeedInfoModal from './components/FeedInfoModal';
import UserCardModal from './components/UserCardModal';
import ContextMenuDrawer from './components/ContextMenuDrawer';
import NotificationsMenu from './components/NotificationsTab'; 
import NotificationButton from './components/NotificationButton';
import ProfileContextMenu from './components/ProfileContextMenu';
import EditProfileDrawer from './components/EditProfileDrawer';
import IdentityDetailsDrawer from './components/IdentityDetailsDrawer';
import LinksDrawer from './components/LinksDrawer';
import ManageFeedsDrawer from './components/ManageFeedsDrawer';
import SettingsDrawer from './components/SettingsDrawer';
import LibraryDrawer from './components/LibraryDrawer';
import { MOCK_FEED, MOCK_FOLLOWING_FEED, MOCK_FRIENDS_FEED, MOCK_ALL_FEEDS, MOCK_SETTINGS_STRUCTURE, Icons, CURRENT_USER } from './constants';
import { Post, User, StoryGroup } from './types';
import { resumeSession, loginToBluesky, getTimeline, getSavedFeeds, getSession, getCurrentUserProfile, fetchBookmarkedPosts, addBookmark, removeBookmark, getProfile, getAtpPreferences, setAtpPreference, agent, toggleSaveFeed } from './services/atp';

const LoginOverlay = ({ onLoginSuccess }: { onLoginSuccess: () => void }) => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await loginToBluesky(identifier, password);
            onLoginSuccess();
        } catch (err: any) {
            setError(err.message || 'Login failed. Check your handle and App Password.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="absolute inset-0 z-[250] bg-black flex flex-col items-center justify-center p-8 overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="w-full max-w-[380px] sm:max-w-[400px] relative z-10 animate-fade-in flex flex-col items-center justify-center">
                <div className="flex justify-center mb-8">
                    <div className="w-20 h-20 bg-blue-600 rounded-[28px] flex items-center justify-center shadow-[0_20px_50px_rgba(37,99,235,0.4),inset_0_2px_2px_rgba(255,255,255,0.4)] transform hover:scale-105 transition-transform duration-500">
                        <Icons.Cloud size={40} className="text-white drop-shadow-lg" />
                    </div>
                </div>
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black text-white tracking-tighter mb-2">SkyReels</h1>
                    <p className="text-gray-400 font-medium tracking-wide opacity-80 uppercase text-[10px] tracking-[0.2em]">Vertical Video for Bluesky</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-4 w-full">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-4">Protocol Handle</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors">
                                <Icons.AtSign size={18} />
                            </div>
                            <input type="text" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck="false" placeholder="alice.bsky.social" value={identifier} onChange={e => setIdentifier(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-gray-600 focus:border-blue-500/50 focus:bg-white/10 focus:outline-none transition-all duration-300 font-medium" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-4">App Password</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors">
                                <Icons.Lock size={18} />
                            </div>
                            <input type="password" placeholder="•••• •••• •••• ••••" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-gray-600 focus:border-blue-500/50 focus:bg-white/10 focus:outline-none transition-all duration-300 font-mono" />
                        </div>
                        <div className="flex items-start gap-2 px-4 mt-2">
                            <Icons.Info size={12} className="text-gray-500 mt-0.5 flex-shrink-0" />
                            <p className="text-[10px] text-gray-500 font-medium leading-relaxed">Settings > Advanced > App Passwords. <br/>Use a dedicated password for security.</p>
                        </div>
                    </div>
                    {error && <div className="text-red-400 text-xs font-bold text-center bg-red-500/10 border border-red-500/20 py-3 px-4 rounded-2xl animate-slide-down">{error}</div>}
                    <button type="submit" disabled={isLoading} className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-gray-200 transition-all disabled:opacity-50 mt-4 shadow-[0_15px_30px_rgba(255,255,255,0.1)] active:scale-[0.98] flex items-center justify-center gap-2">{isLoading ? (<><Icons.Loader2 size={20} className="animate-spin" /><span>Authenticating...</span></>) : (<span>Sign In</span>)}</button>
                </form>
                <div className="mt-12 text-center opacity-30"><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none tracking-[0.3em]">Powered by AT Protocol</p></div>
            </div>
        </div>
    )
}

const ScrollingTabLabel: React.FC<{ 
    text: string; 
    containerClass?: string; 
    textClass?: string; 
    fadeLeft?: boolean; 
 }> = ({ text, containerClass, textClass, fadeLeft = true }) => {
    const [shouldScroll, setShouldScroll] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    useEffect(() => {
        setShouldScroll(false);
        const checkOverflow = () => {
            if (containerRef.current && textRef.current) {
                const isOverflowing = textRef.current.offsetWidth > containerRef.current.clientWidth;
                setShouldScroll(isOverflowing);
            }
        };
        const frame1 = requestAnimationFrame(() => {
            const frame2 = requestAnimationFrame(checkOverflow);
            return () => cancelAnimationFrame(frame2);
        });
        window.addEventListener('resize', checkOverflow);
        return () => {
            cancelAnimationFrame(frame1);
            window.removeEventListener('resize', checkOverflow);
        };
    }, [text]);
    return (
        <div ref={containerRef} className={`relative overflow-hidden flex items-center justify-center ${shouldScroll ? (fadeLeft ? 'mask-gradient-both' : 'mask-gradient-right') : ''} ${containerClass || ''}`}>
             <style>
                {`
                @keyframes marquee-tab {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee-tab { animation: marquee-tab 8s linear infinite; }
                .mask-gradient-both { mask-image: linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%); -webkit-mask-image: linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%); }
                .mask-gradient-right { mask-image: linear-gradient(to right, black 85%, transparent 100%); -webkit-mask-image: linear-gradient(to right, black 85%, transparent 100%); }
                `}
             </style>
            <div className={`flex whitespace-nowrap gap-4 ${shouldScroll ? 'animate-marquee-tab pr-4' : ''}`}>
                <span ref={textRef} className={`${textClass} whitespace-nowrap block`}>{text}</span>
                {shouldScroll && (<><span className={`${textClass} whitespace-nowrap block`}>{text}</span><span className={`${textClass} whitespace-nowrap block`}>{text}</span></>)}
            </div>
        </div>
    );
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [currentUserProfile, setCurrentUserProfile] = useState<User | null>(null);
  const [realFeed, setRealFeed] = useState<Post[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [feedCursor, setFeedCursor] = useState<string | undefined>(undefined);
  const [hiddenPostIds, setHiddenPostIds] = useState<Set<string>>(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Record<string, string>>({});
  const [activeFeedType, setActiveFeedType] = useState<'FOLLOWING' | 'FOR_YOU' | 'STORIES'>('FOR_YOU');
  const [activeFeedUri, setActiveFeedUri] = useState<string | null>(null); 
  const [selectedFeedTitle, setSelectedFeedTitle] = useState('For You');
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchActiveTab, setSearchActiveTab] = useState<'EXPLORE' | 'FEEDS' | 'TRENDS'>('EXPLORE');
  const [shouldFocusSearch, setShouldFocusSearch] = useState(false);
  const [externalSearchQuery, setExternalSearchQuery] = useState('');
  const sideMenuPanelRef = useRef(null);
  const notifMenuPanelRef = useRef(null);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isCommentDrawerOpen, setCommentDrawerOpen] = useState(false);
  const [wasDrawerOpenBeforeProfile, setWasDrawerOpenBeforeProfile] = useState(false);
  const [isShareDrawerOpen, setShareDrawerOpen] = useState(false);
  const [isContextMenuOpen, setContextMenuOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isIdentityDetailsOpen, setIsIdentityDetailsOpen] = useState(false);
  const [isLinksDrawerOpen, setIsLinksDrawerOpen] = useState(false);
  const [isManageFeedsOpen, setIsManageFeedsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLibraryDrawerOpen, setIsLibraryDrawerOpen] = useState(false);
  const [libraryInitialTab, setLibraryInitialTab] = useState('Saved');
  const [feeds, setFeeds] = useState(MOCK_ALL_FEEDS);
  const [temporaryFeedId, setTemporaryFeedId] = useState<string | null>(null);
  const [temporaryFeed, setTemporaryFeed] = useState<any | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [profileMenuUser, setProfileMenuUser] = useState<User | null>(null);
  const [contextCommentText, setContextCommentText] = useState<string | undefined>(undefined);
  const [contextCommentUri, setContextCommentUri] = useState<string | undefined>(undefined);
  const [contextCommentId, setContextCommentId] = useState<string | undefined>(undefined);
  const [shareTarget, setShareTarget] = useState<{ type: 'POST' | 'PROFILE', data: Post | User } | null>(null);
  const [selectedFeedInfo, setSelectedFeedInfo] = useState<any>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [profileSelectedPost, setProfileSelectedPost] = useState<Post | null>(null);
  const [identityUser, setIdentityUser] = useState<User | null>(null);
  const [returnIndex, setReturnIndex] = useState(0);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [activeFeedItemIndex, setActiveFeedItemIndex] = useState(0);
  const [isGlobalMuted, setIsGlobalMuted] = useState(true);
  const [followingSort, setFollowingSort] = useState<'RELEVANCE' | 'TIME'>('TIME');
  const [showFollowingSortMenu, setShowFollowingSortMenu] = useState(false);
  const [storiesSort, setStoriesSort] = useState<'RECENT' | 'RELEVANT'>('RECENT');
  const [showForYouMenu, setShowForYouMenu] = useState(false);
  const [showStoriesMenu, setShowStoriesMenu] = useState(false);
  const [storyCursors, setStoryCursors] = useState<Record<string, number>>({});
  const mainScrollRef = useRef(null);
  const feedContainerRef = useRef<HTMLDivElement>(null);
  const followingMenuRef = useRef(null);
  const forYouMenuRef = useRef(null);
  const forYouDropdownRef = useRef(null);
  const storiesMenuRef = useRef(null);
  const storiesDropdownRef = useRef(null);
  const [storiesScrollState, setStoriesScrollState] = useState({ height: 0, show: false });
  const storiesListRef = useRef(null);
  const storiesThumbRef = useRef<HTMLDivElement>(null);
  const [feedsScrollState, setFeedsScrollState] = useState({ height: 0, show: false });
  const feedsListRef = useRef(null);
  const feedsThumbRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isUserPaused, setIsUserPaused] = useState(false);
  const [isFullScreenHeld, setIsFullScreenHeld] = useState(false);
  const [isFocusLocked, setIsFocusLocked] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false); 
  const [profileActiveTab, setProfileActiveTab] = useState('Posts');
  const [pendingChatUser, setPendingChatUser] = useState<User | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const searchTabRef = useRef<SearchTabHandle>(null);
  const [quotePost, setQuotePost] = useState<Post | null>(null);
  
  // Pull-to-refresh State
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullStartY = useRef(0);
  const isPullingRef = useRef(false);

  // Audio Context Refs for Sound Design
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  
  const [settings, setSettings] = useState<Record<string, any>>(() => {
    const defaults: Record<string, any> = {};
    MOCK_SETTINGS_STRUCTURE.forEach(category => category.items.forEach((item: any) => { defaults[item.id] = item.defaultValue; }));
    return defaults;
  });

  const handleUpdateSetting = async (id: string, value: any) => {
    setSettings(prev => ({ ...prev, [id]: value }));
    let settingMeta: any = null;
    MOCK_SETTINGS_STRUCTURE.some(cat => {
        const found = cat.items.find((i: any) => i.id === id);
        if (found) { settingMeta = found; return true; }
        return false;
    });
    if (settingMeta?.atpType) {
        try { await setAtpPreference(settingMeta.atpType, settingMeta.atpKey, value); } 
        catch (e) { console.error("Failed to sync setting to AT Protocol", e); }
    }
  };

  useEffect(() => {
      const checkSession = async () => {
          const hasSession = await resumeSession();
          if (hasSession) { setIsAuthenticated(true); await initializeRealData(); } 
          else { setIsAuthenticated(false); }
          setIsAuthChecking(false);
      };
      checkSession();
  }, []);

  // Audio Engine Initialization
  const initAudio = () => {
      if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
      }
  };

  const playPullSound = (intensity: number) => {
      if (!audioCtxRef.current) return;
      if (!oscRef.current) {
          const osc = audioCtxRef.current.createOscillator();
          const gain = audioCtxRef.current.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(200, audioCtxRef.current.currentTime);
          gain.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
          gain.gain.linearRampToValueAtTime(0.05, audioCtxRef.current.currentTime + 0.1);
          osc.connect(gain);
          gain.connect(audioCtxRef.current.destination);
          osc.start();
          oscRef.current = osc;
          gainRef.current = gain;
      }
      
      if (oscRef.current) {
          const targetFreq = 200 + (intensity * 300);
          oscRef.current.frequency.setTargetAtTime(targetFreq, audioCtxRef.current.currentTime, 0.1);
          if (gainRef.current) {
              gainRef.current.gain.setTargetAtTime(0.02 + (intensity * 0.05), audioCtxRef.current.currentTime, 0.1);
          }
      }
  };

  const stopPullSound = (snap = false) => {
      if (gainRef.current && audioCtxRef.current) {
          gainRef.current.gain.linearRampToValueAtTime(0, audioCtxRef.current.currentTime + 0.1);
          const oldOsc = oscRef.current;
          setTimeout(() => { oldOsc?.stop(); }, 150);
          oscRef.current = null;
          gainRef.current = null;
      }
      
      if (snap && audioCtxRef.current) {
          // Play "Pop" / Refresh Trigger Sound
          const osc = audioCtxRef.current.createOscillator();
          const gain = audioCtxRef.current.createGain();
          osc.frequency.setValueAtTime(400, audioCtxRef.current.currentTime);
          osc.frequency.exponentialRampToValueAtTime(800, audioCtxRef.current.currentTime + 0.1);
          gain.gain.setValueAtTime(0.1, audioCtxRef.current.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtxRef.current.currentTime + 0.15);
          osc.connect(gain);
          gain.connect(audioCtxRef.current.destination);
          osc.start();
          osc.stop(audioCtxRef.current.currentTime + 0.2);
      }
  };

  const initializeRealData = async () => {
      const savedFeeds = await getSavedFeeds();
      if (savedFeeds.length > 0) {
          const mergedFeeds = [MOCK_ALL_FEEDS[0], ...savedFeeds];
          setFeeds(mergedFeeds);
          const videoFeed = savedFeeds.find(f => f.name.toLowerCase().includes('video') || f.name.toLowerCase().includes('reels'));
          const defaultFeed = videoFeed || savedFeeds[0];
          if (defaultFeed) { setActiveFeedUri(defaultFeed.uri); setSelectedFeedTitle(defaultFeed.name); }
      }
      const profile = await getCurrentUserProfile();
      if (profile) setCurrentUserProfile(profile);
      const bookmarks = await fetchBookmarkedPosts();
      setBookmarkedPosts(bookmarks);
      const serverPrefs = await getAtpPreferences();
      if (serverPrefs && serverPrefs.length > 0) {
          const updatedSettings = { ...settings };
          MOCK_SETTINGS_STRUCTURE.forEach(cat => cat.items.forEach((item: any) => {
                  if (item.atpType) {
                      let pref;
                      if (item.atpType === 'app.bsky.actor.defs#contentLabelPref') {
                          pref = serverPrefs.find(p => p.$type === item.atpType && (p as any).label === item.atpKey);
                          if (pref) updatedSettings[item.id] = (pref as any).visibility;
                      } else if (item.atpType === 'app.bsky.actor.defs#feedViewPref') {
                          pref = serverPrefs.find(p => p.$type === item.atpType && (p as any).feed === 'home');
                          if (pref) updatedSettings[item.id] = (pref as any)[item.atpKey];
                      } else {
                          pref = serverPrefs.find(p => p.$type === item.atpType);
                          if (pref) updatedSettings[item.id] = (pref as any)[item.atpKey];
                      }
                  }
              }));
          setSettings(updatedSettings);
      }
  };

  const handleLoginSuccess = async () => { setIsAuthenticated(true); await initializeRealData(); };

  const handleToggleBookmark = useCallback(async (post: Post) => {
      const isCurrentlySaved = !!bookmarkedPosts[post.uri];
      const newMap = { ...bookmarkedPosts };
      if (isCurrentlySaved) {
          delete newMap[post.uri];
          setBookmarkedPosts(newMap);
          const listItemUri = bookmarkedPosts[post.uri];
          if (listItemUri) await removeBookmark(listItemUri);
      } else {
          newMap[post.uri] = 'pending'; 
          setBookmarkedPosts(newMap);
          const res = await addBookmark(post.uri, post.cid);
          if (res && res.uri) setBookmarkedPosts(prev => ({ ...prev, [post.uri]: res.uri }));
          else { const revertMap = { ...bookmarkedPosts }; delete revertMap[post.uri]; setBookmarkedPosts(revertMap); }
      }
  }, [bookmarkedPosts]);

  const loadFeed = useCallback(async (isRefresh = false) => {
      if (!isAuthenticated) return;
      if (activeFeedType === 'STORIES') return;
      
      if (!isRefresh) setIsLoadingFeed(true);
      if (!isRefresh) {
          setRealFeed([]); 
          setActiveFeedItemIndex(0); 
          setFeedCursor(undefined);
      }

      const uri = activeFeedType === 'FOLLOWING' ? undefined : (activeFeedUri || undefined);
      try {
          const data = await getTimeline(undefined, uri);
          if (data.posts.length > 0) { 
              setRealFeed(data.posts); 
              setFeedCursor(data.cursor); 
          } else { 
              setRealFeed([]); 
          }
      } catch (e) { 
          console.error("Feed load error", e); 
          if (!isRefresh) setRealFeed([]); 
      } finally {
          setIsLoadingFeed(false);
          setIsRefreshing(false);
          setPullY(0);
          if (!isRefresh) {
              requestAnimationFrame(() => { if (feedContainerRef.current) feedContainerRef.current.scrollTop = 0; });
          }
      }
  }, [activeFeedType, activeFeedUri, isAuthenticated]);

  useEffect(() => {
      loadFeed();
  }, [loadFeed]);

  const handleLoadMore = useCallback(async () => {
      if (isFetchingMore || !feedCursor || !getSession()) return;
      setIsFetchingMore(true);
      const uri = activeFeedType === 'FOLLOWING' ? undefined : (activeFeedUri || undefined);
      try {
          const data = await getTimeline(feedCursor, uri);
          if (data.posts.length > 0) { setRealFeed(prev => [...prev, ...data.posts]); setFeedCursor(data.cursor); }
      } catch (e) { console.error("Load more failed", e); } 
      finally { setIsFetchingMore(false); }
  }, [isFetchingMore, feedCursor, activeFeedUri, activeFeedType]);

  const handleSelectFeed = (feed: any) => {
      if (!feed) return;
      const existing = feeds.find(f => f.uri === feed.uri);
      
      if (!existing) {
          const newFeedObj = { 
              ...feed, 
              id: feed.uri, 
              viewerState: { ...feed.viewerState, isPinned: false, isSaved: false } 
          };
          setTemporaryFeed(newFeedObj);
          setTemporaryFeedId(newFeedObj.id);
      } else {
          setTemporaryFeed(null);
          if (!existing.viewerState?.isPinned && existing.id !== 'feed1') {
              setTemporaryFeedId(existing.id);
          } else {
              setTemporaryFeedId(null);
          }
      }

      setSelectedFeedTitle(feed.name);
      if (feed.id === 'feed1') {
          setActiveFeedType('FOLLOWING');
      } else {
          setActiveFeedType('FOR_YOU');
          setActiveFeedUri(feed.uri);
      }
      
      setShowFollowingSortMenu(false); 
      setShowForYouMenu(false); 
      setShowStoriesMenu(false);
      setActiveFeedItemIndex(0); 
      scrollToPage(0); 
  };

  const handleSwitchFeed = (feedName: string) => {
      if (!feedName) return;
      const feed = feeds.find(f => f && f.name === feedName);
      if (feed) {
          handleSelectFeed(feed);
      }
  };

  const handleHidePost = (postId: string) => { setHiddenPostIds(prev => new Set(prev).add(postId)); };

  useEffect(() => {
    document.body.style.backgroundColor = '#050505'; 
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isManageFeedsOpen || selectedFeedInfo) return;
      if (showFollowingSortMenu && followingMenuRef.current && !(followingMenuRef.current as any).contains(event.target as Node)) setShowFollowingSortMenu(false);
      if (showForYouMenu && forYouMenuRef.current && !(forYouMenuRef.current as any).contains(event.target as Node) && forYouDropdownRef.current && !(forYouDropdownRef.current as any).contains(event.target as Node)) setShowForYouMenu(false);
      if (showStoriesMenu && storiesMenuRef.current && !(storiesMenuRef.current as any).contains(event.target as Node) && storiesDropdownRef.current && !(storiesDropdownRef.current as any).contains(event.target as Node)) setShowStoriesMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFollowingSortMenu, showForYouMenu, showStoriesMenu, isManageFeedsOpen, selectedFeedInfo]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            if (isFocusLocked) { setIsFocusLocked(false); setIsPaused(false); return; }
            if (isContextMenuOpen) { setContextMenuOpen(false); if (!isUserPaused) setIsPaused(false); return; }
            if (isProfileMenuOpen) { setIsProfileMenuOpen(false); if (!viewingUser && !isUserPaused) setIsPaused(false); return; }
            if (isShareDrawerOpen) { setShareDrawerOpen(false); if (!isUserPaused) setIsPaused(false); return; }
            if (isCommentDrawerOpen) { setCommentDrawerOpen(false); if (!isUserPaused) setIsPaused(false); return; }
            if (isCreateModalOpen) { setCreateModalOpen(false); if (!isUserPaused) setIsPaused(false); return; }
            if (viewingUser) { setViewingUser(null); if (!isUserPaused) setIsPaused(false); return; }
            if (selectedFeedInfo) { setSelectedFeedInfo(null); return; }
            if (isIdentityDetailsOpen) { setIsIdentityDetailsOpen(false); if (!isUserPaused) setIsPaused(false); return; }
            if (isLinksDrawerOpen) { setIsLinksDrawerOpen(false); if (!isUserPaused) setIsPaused(false); return; }
            if (isEditProfileOpen) { setIsEditProfileOpen(false); if (!isUserPaused) setIsPaused(false); return; }
            if (isSettingsOpen) { setIsSettingsOpen(false); if (!isUserPaused) setIsPaused(false); return; }
            if (isManageFeedsOpen) { setIsManageFeedsOpen(false); if (!isUserPaused) setIsPaused(false); return; }
            if (isLibraryDrawerOpen) { setIsLibraryDrawerOpen(false); if (!isUserPaused) setIsPaused(false); return; }
            if (isMenuOpen) { setIsMenuOpen(false); if (!isUserPaused) setIsPaused(false); return; }
            if (isNotificationsOpen) { setIsNotificationsOpen(false); if (!isUserPaused) setIsPaused(false); return; }
            if (showFollowingSortMenu) { setShowFollowingSortMenu(false); return; }
            if (showForYouMenu) { setShowForYouMenu(false); return; }
            if (showStoriesMenu) { setShowStoriesMenu(false); return; }
            if (profileSelectedPost) { setProfileSelectedPost(null); if (!isUserPaused) setIsPaused(false); return; }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isContextMenuOpen, isProfileMenuOpen, isShareDrawerOpen, isCommentDrawerOpen, isCreateModalOpen, viewingUser, selectedFeedInfo, isIdentityDetailsOpen, isLinksDrawerOpen, isEditProfileOpen, isSettingsOpen, isManageFeedsOpen, isLibraryDrawerOpen, isMenuOpen, isNotificationsOpen, showFollowingSortMenu, showForYouMenu, showStoriesMenu, isUserPaused, isFocusLocked, profileSelectedPost]);

  const handleHorizontalScroll = () => {
    if (mainScrollRef.current) {
        const el = mainScrollRef.current as any;
        const scrollLeft = el.scrollLeft;
        const width = el.clientWidth;
        const index = Math.round(scrollLeft / width);
        if (index !== activeIndex) setActiveIndex(index);
    }
  };

  const handleFeedScroll = () => {
    if (feedContainerRef.current) {
      const el = feedContainerRef.current as any;
      const scrollTop = el.scrollTop;
      const height = el.clientHeight;
      const index = Math.round(scrollTop / height);
      if (index !== activeFeedItemIndex) {
          setActiveFeedItemIndex(index);
          setIsUserPaused(false); // Reset manual pause on scroll
      }
      if (!isFetchingMore && realFeed.length > 0 && index >= realFeed.length - 3) handleLoadMore();
    }
  };

  // Pull-to-Refresh Handlers
  const handlePullStart = (e: React.TouchEvent) => {
      if (feedContainerRef.current?.scrollTop === 0) {
          pullStartY.current = e.touches[0].clientY;
          isPullingRef.current = true;
          initAudio(); // Initialize audio context on user interaction
      } else {
          isPullingRef.current = false;
      }
  };

  const handlePullMove = (e: React.TouchEvent) => {
      if (!isPullingRef.current) return;
      const y = e.touches[0].clientY;
      const delta = y - pullStartY.current;
      if (delta > 0) {
          // Logarithmic resistance curve for natural feel
          const damped = Math.min(delta * 0.5, 200); 
          setPullY(damped);
          
          // Modulate sound based on pull progress
          if (damped > 10) {
             playPullSound(Math.min(damped / 150, 1));
          }

          if (e.cancelable && delta > 10) e.preventDefault(); 
      } else {
          setPullY(0);
      }
  };

  const handlePullEnd = () => {
      isPullingRef.current = false;
      if (pullY > 70) {
          stopPullSound(true); // Snap sound
          setIsRefreshing(true);
          setPullY(70); 
          loadFeed(true);
      } else {
          stopPullSound(false);
          setPullY(0);
      }
  };

  // UPDATED EFFECT: Preserve manual pause on feed scroll
  useEffect(() => { 
      if (isUserPaused) {
          setIsPaused(true);
      } else {
          setIsPaused(false);
      }
  }, [activeFeedItemIndex, activeFeedType, isUserPaused]);

  useEffect(() => { if (activeFeedType === 'STORIES') { if (showStoriesMenu) setIsPaused(true); else if (!isUserPaused) setIsPaused(false); } }, [showStoriesMenu, activeFeedType, isUserPaused]);
  useEffect(() => {
    const container = feedContainerRef.current as any;
    if (container) {
      container.addEventListener('scroll', handleFeedScroll);
      return () => container.removeEventListener('scroll', handleFeedScroll);
    }
  }, [activeFeedItemIndex, isFetchingMore, realFeed.length]);

  const scrollToPage = useCallback((targetIndex: number) => {
      if (mainScrollRef.current) {
          const el = mainScrollRef.current as any;
          const width = el.clientWidth;
          el.scrollTo({ left: width * targetIndex, behavior: 'smooth' });
      }
  }, []);
  
  const handleNavigateToProfile = useCallback((user: User) => {
    setReturnIndex(activeIndex); 
    setProfileUser(user);
    setProfileSelectedPost(null);
    setViewingUser(null);
    setIsPaused(false);
    if (isCommentDrawerOpen) {
        setWasDrawerOpenBeforeProfile(true);
        setCommentDrawerOpen(false);
    }
    scrollToPage(3);
  }, [activeIndex, scrollToPage, isCommentDrawerOpen]);

  const handleProfileBack = useCallback(() => {
    if (profileUser) {
        if (profileSelectedPost) {
            setProfileSelectedPost(null); 
        } else {
            setViewingUser(profileUser);
            setIsPaused(true);
            scrollToPage(returnIndex);
            setTimeout(() => setProfileUser(null), 500);
            if (wasDrawerOpenBeforeProfile) { setCommentDrawerOpen(true); setWasDrawerOpenBeforeProfile(false); }
        }
    } else if (profileSelectedPost) {
        setProfileSelectedPost(null);
    } else {
        setProfileUser(null);
    }
  }, [profileUser, profileSelectedPost, returnIndex, scrollToPage, wasDrawerOpenBeforeProfile]);

  const handleMessageUser = useCallback((user: User) => {
      setPendingChatUser(user);
      setViewingUser(null);
      setIsProfileMenuOpen(false);
      scrollToPage(2); 
  }, [scrollToPage]);

  const handleQuoteClick = useCallback((post: Post) => {
      setQuotePost(post);
      setIsPaused(true);
      setCreateModalOpen(true);
  }, []);

  const handleLibrarySelect = useCallback((tabName: string) => { setLibraryInitialTab(tabName); setIsLibraryDrawerOpen(true); setIsMenuOpen(false); }, []);
  const handleDiscoverFeeds = useCallback(() => { setSearchActiveTab('FEEDS'); scrollToPage(1); setIsMenuOpen(false); }, [scrollToPage]);
  const handleSearchNavigate = useCallback((tab: 'EXPLORE' | 'FEEDS' | 'TRENDS') => { setSearchActiveTab(tab); scrollToPage(1); setIsMenuOpen(false); }, [scrollToPage]);
  const handleOpenSearch = useCallback(() => { setSearchActiveTab('EXPLORE'); setShouldFocusSearch(true); scrollToPage(1); setIsMenuOpen(false); }, [scrollToPage]);
  const handleTagClick = useCallback((tag: string) => { setExternalSearchQuery(tag); setSearchActiveTab('EXPLORE'); scrollToPage(1); setCommentDrawerOpen(false); }, [scrollToPage]);
  const handleManageFeeds = useCallback(() => { setIsManageFeedsOpen(true); setIsMenuOpen(false); }, []);
  const handleOpenSettings = useCallback(() => { setIsSettingsOpen(true); setIsMenuOpen(false); }, []);
  const handleOpenComments = (post: Post) => { setSelectedPost(post); setCommentDrawerOpen(true); setIsPaused(true); };
  const handleOpenShare = (post: Post) => { setShareTarget({ type: 'POST', data: post }); setShareDrawerOpen(true); setIsPaused(true); };
  const handleShareProfile = useCallback((user: User) => { setShareTarget({ type: 'PROFILE', data: user }); setShareDrawerOpen(true); setIsPaused(true); }, []);
  const handleOpenContextMenu = (post: Post) => { setSelectedPost(post); setContextMenuOpen(true); setIsPaused(true); };
  const handleOpenProfileMenu = useCallback((user: User, text?: string, uri?: string, commentId?: string) => { setProfileMenuUser(user); setContextCommentText(text); setContextCommentUri(uri); setContextCommentId(commentId); setIsProfileMenuOpen(true); setIsPaused(true); }, []);
  const handleUserClick = async (user: User) => { setIsPaused(true); const fullProfile = await getProfile(user.id); setViewingUser(fullProfile || user); };
  const handleSelectPostFromSearch = useCallback((post: Post) => { setRealFeed([post]); setActiveFeedItemIndex(0); scrollToPage(0); }, [scrollToPage]);
  const handleEditProfile = useCallback(() => { setIsEditProfileOpen(true); setIsPaused(true); }, []);
  const handleOpenIdentityDetails = useCallback((user: User) => { setIdentityUser(user); setIsIdentityDetailsOpen(true); setIsPaused(true); }, []);
  const handleOpenLinksDrawer = useCallback(() => { setIsLinksDrawerOpen(true); setIsPaused(true); }, []);
  const handleOpenMenu = useCallback(() => { setIsMenuOpen(true); setIsPaused(true); }, []);
  const handleOpenNotifications = useCallback(( ) => { setIsNotificationsOpen(true); setIsPaused(true); }, []);
  const handleProfileTabChange = useCallback((tab: string) => { setProfileActiveTab(tab); }, []);
  const handleToggleMute = useCallback(() => { setIsGlobalMuted(prev => !prev); }, []);
  const handleStoryTogglePause = useCallback(() => { setIsPaused(prev => { const newVal = !prev; setIsUserPaused(newVal); return newVal; }); }, []);
  const handleProfileSelectPost = useCallback((post: Post | null) => { setProfileSelectedPost(post); }, []);

  const currentFeedPosts = useMemo(() => { 
    if (activeFeedType === 'STORIES') return []; 
    const ADULT_LABELS = ['porn', 'sexual', 'nudity', 'nsfw'];
    const isAdultContentEnabled = !!settings['app.bsky.actor.defs#adultContentPref.enabled'];
    let filtered = realFeed.filter(p => !hiddenPostIds.has(p.id));
    if (!isAdultContentEnabled) {
        filtered = filtered.filter(p => {
            if (!p.labels) return true;
            return !p.labels.some(l => ADULT_LABELS.includes(l.toLowerCase()));
        });
    }
    if (settings['hideTextOnly']) {
        filtered = filtered.filter(p => !!p.imageUrl || !!p.videoUrl || (p.images && p.images.length > 0));
    }
    return filtered; 
  }, [activeFeedType, realFeed, hiddenPostIds, settings['hideTextOnly'], settings['app.bsky.actor.defs#adultContentPref.enabled']]);

  const storyGroups: StoryGroup[] = useMemo(() => {
    if (activeFeedType !== 'STORIES') return [];
    const map = new Map<string, Post[]>();
    const order: string[] = [];
    const sourceFeed = realFeed.length > 0 ? realFeed : MOCK_FRIENDS_FEED;
    sourceFeed.forEach(post => { if (!map.has(post.author.id)) { map.set(post.author.id, []); order.push(post.author.id); } map.get(post.author.id)?.push(post); });
    return order.map(userId => { const posts = map.get(userId) || []; return { user: posts[0].author, stories: posts, totalCount: posts.length, lastUpdated: posts[posts.length - 1].createdAt }; });
  }, [activeFeedType, realFeed]);

  const updateStoriesScroll = () => {
    if (!storiesListRef.current) return;
    const el = storiesListRef.current as any;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const shouldShow = scrollHeight > clientHeight;
    if (!shouldShow) { if (storiesScrollState.show) setStoriesScrollState(prev => ({ ...prev, show: false })); return; }
    const thumbHeight = Math.max(20, clientHeight * (clientHeight / scrollHeight));
    setStoriesScrollState(prev => ({ height: thumbHeight, show: true }));
    if (storiesThumbRef.current) { const top = (scrollTop / (scrollHeight - clientHeight)) * (clientHeight - thumbHeight); storiesThumbRef.current.style.transform = `translateY(${top}px)`; }
  };

  const updateFeedsScroll = () => {
    if (!feedsListRef.current) return;
    const el = feedsListRef.current as any;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const shouldShow = scrollHeight > clientHeight;
    if (!shouldShow) { if (feedsScrollState.show) setFeedsScrollState(prev => ({ ...prev, show: false })); return; }
    const thumbHeight = Math.max(20, clientHeight * (clientHeight / scrollHeight));
    setFeedsScrollState(prev => ({ height: thumbHeight, show: true }));
    if (feedsThumbRef.current) { const top = (scrollTop / (scrollHeight - clientHeight)) * (clientHeight - thumbHeight); feedsThumbRef.current.style.transform = `translateY(${top}px)`; }
  };

  useEffect(() => { if (showStoriesMenu && activeFeedType === 'STORIES') { setTimeout(updateStoriesScroll, 50); setTimeout(updateStoriesScroll, 300); } }, [showStoriesMenu, activeFeedType, storyGroups]);
  useEffect(() => { if (showForYouMenu && activeFeedType === 'FOR_YOU') { setTimeout(updateFeedsScroll, 50); setTimeout(updateFeedsScroll, 300); } }, [showForYouMenu, activeFeedType, feeds]);

  const handleScrollToUser = (index: number) => { const container = feedContainerRef.current as any; if (!container) return; const targetTop = Math.max(0, Math.min(index, storyGroups.length - 1)) * container.clientHeight; container.scrollTo({ top: targetTop, behavior: 'smooth' }); };
  const jumpToUser = (userId: string) => { const index = storyGroups.findIndex(g => g.user.id === userId); if (index !== -1) { const container = feedContainerRef.current as any; if (container) container.scrollTo({ top: index * container.clientHeight, behavior: 'auto' }); setShowStoriesMenu(false); } };
  const handleStoryNextUser = (currentIndex: number) => { const nextIndex = currentIndex + 1; if (nextIndex < storyGroups.length) { const nextGroup = storyGroups[nextIndex]; setStoryCursors(prev => ({ ...prev, [nextGroup.user.id]: 0 })); handleScrollToUser(nextIndex); } };
  const handleStoryPrevUser = (currentIndex: number) => { const prevIndex = currentIndex - 1; if (prevIndex >= 0) { const prevGroup = storyGroups[prevIndex]; setStoryCursors(prev => ({ ...prev, [prevGroup.user.id]: Math.max(0, prevGroup.stories.length - 1) })); handleScrollToUser(prevIndex); } };
  const handleFollowingClick = (e: React.MouseEvent) => { e.stopPropagation(); if (activeFeedType === 'FOLLOWING') setShowFollowingSortMenu(!showFollowingSortMenu); else { setActiveFeedType('FOLLOWING'); setShowFollowingSortMenu(false); setShowForYouMenu(false); setShowStoriesMenu(false); if (feedContainerRef.current) (feedContainerRef.current as any).scrollTop = 0; setActiveFeedItemIndex(0); } };
  const handleForYouClick = (e: React.MouseEvent) => { e.stopPropagation(); if (activeFeedType === 'FOR_YOU') setShowForYouMenu(!showForYouMenu); else { setActiveFeedType('FOR_YOU'); setShowForYouMenu(false); setShowFollowingSortMenu(false); setShowStoriesMenu(false); if (feedContainerRef.current) (feedContainerRef.current as any).scrollTop = 0; setActiveFeedItemIndex(0); } };
  const handleStoriesClick = (e: React.MouseEvent) => { e.stopPropagation(); if (activeFeedType === 'STORIES') setShowStoriesMenu(!showStoriesMenu); else { setActiveFeedType('STORIES'); setShowStoriesMenu(false); setShowFollowingSortMenu(false); setShowForYouMenu(false); } };
  
  const handlePinFeed = (e: React.MouseEvent, feedId: string) => { 
      e.stopPropagation(); 
      if (temporaryFeed && temporaryFeed.id === feedId) {
          const pinnedFeed = { ...temporaryFeed, viewerState: { ...temporaryFeed.viewerState, isPinned: true, isSaved: true }};
          setFeeds(prev => [...prev, pinnedFeed]);
          setTemporaryFeed(null);
          setTemporaryFeedId(null);
      } else {
          setFeeds(prev => prev.map(f => f.id === feedId ? { ...f, viewerState: { ...f.viewerState, isPinned: true }} : f)); 
          setTemporaryFeedId(null); 
      }
  };
  
  const handleFeedDropdownSelect = (feedName: string) => { handleSwitchFeed(feedName); setShowForYouMenu(false); };

  const swipeStartRef = useRef<{ x: number, y: number } | null>(null);
  const isSwipeLockedRef = useRef<'VERTICAL' | 'LEFT_MENU' | null>(null);
  const lastDragRef = useRef(0);
  const handleSwipeStart = (e: React.TouchEvent) => { if (activeIndex === 0 && !isScrubbing) { swipeStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; isSwipeLockedRef.current = null; lastDragRef.current = 0; if (sideMenuPanelRef.current) (sideMenuPanelRef.current as any).style.transition = 'none'; if (notifMenuPanelRef.current) (notifMenuPanelRef.current as any).style.transition = 'none'; } else swipeStartRef.current = null; };
  const handleHomeTouchMove = (e: React.TouchEvent) => {
      if (isScrubbing) return;
      const startRef = swipeStartRef.current; if (!startRef) return; const currentX = e.touches[0].clientX; const currentY = e.touches[0].clientY; const diffX = currentX - startRef.x; const diffY = Math.abs(currentY - swipeStartRef.current!.y);
      if (!isSwipeLockedRef.current) { if (Math.abs(diffX) > 10 || diffY > 10) { if (diffY > Math.abs(diffX)) { isSwipeLockedRef.current = 'VERTICAL'; swipeStartRef.current = null; return; } else if (diffX > 0) isSwipeLockedRef.current = 'LEFT_MENU'; else { isSwipeLockedRef.current = 'VERTICAL'; swipeStartRef.current = null; return; } } }
      const sideMenu = sideMenuPanelRef.current as any; if (isSwipeLockedRef.current === 'LEFT_MENU' && sideMenu) { const menuWidth = sideMenu.offsetWidth; const constrainedX = Math.min(0, Math.max(-menuWidth, -menuWidth + diffX)); sideMenu.style.transform = `translateX(${constrainedX}px)`; lastDragRef.current = diffX; const backdrop = sideMenu.parentElement?.querySelector('.backdrop-layer') as HTMLElement; if (backdrop) backdrop.style.opacity = String(Math.min(1, diffX / (menuWidth * 0.5))); }
  };
  const handleSwipeEnd = (e: React.TouchEvent) => {
      if (!swipeStartRef.current || isScrubbing) return; const isLeft = isSwipeLockedRef.current === 'LEFT_MENU'; const draggedAmount = Math.abs(lastDragRef.current); const cleanStyles = () => { if (sideMenuPanelRef.current) { (sideMenuPanelRef.current as any).style.transform = ''; (sideMenuPanelRef.current as any).style.transition = ''; const bd = (sideMenuPanelRef.current as any).parentElement?.querySelector('.backdrop-layer') as HTMLElement; if (bd) bd.style.opacity = ''; } };
      if (isLeft && draggedAmount > 60) { setIsMenuOpen(true); setIsPaused(true); } cleanStyles(); swipeStartRef.current = null; isSwipeLockedRef.current = null; lastDragRef.current = 0;
  };

  const NavButton = ({ index, icon: Icon, filled }: { index: number | 'CREATE', icon: any, filled?: boolean }) => {
     const isActive = index === activeIndex;
     const handleClick = () => {
         if (index === 'CREATE') { setIsPaused(true); setCreateModalOpen(true); return; }
         if (index === 1) { if (activeIndex === 1) searchTabRef.current?.scrollToTop(); else scrollToPage(1); return; }
         if (index === 3) { if (activeIndex !== 3) scrollToPage(3); else { if (profileSelectedPost) setProfileSelectedPost(null); else if (profileUser) setProfileUser(null); } } else { if (index === 3) setProfileUser(null); scrollToPage(index as number); }
     };

     if (index === 'CREATE') {
        return (
            <button onClick={handleClick} className="group relative w-12 h-10 flex items-center justify-center transition-all active:scale-90">
                <div className="absolute inset-0 bg-blue-600 rounded-[14px] rotate-3 group-hover:rotate-6 transition-transform blur-[2px] opacity-40"></div>
                <div className="absolute inset-0 bg-white rounded-[14px] shadow-[0_4px_12px_rgba(255,255,255,0.2)] flex items-center justify-center text-black">
                    <Icons.Plus size={24} strokeWidth={4} />
                </div>
            </button>
        )
     }

     return (
        <button onClick={handleClick} className={`relative flex flex-col items-center justify-center w-12 h-12 transition-all active:scale-90`}>
            {isActive && (
                <div className="absolute inset-0 bg-white/10 rounded-2xl animate-fade-in scale-110" />
            )}
            <div className={`relative transition-transform duration-300 ${isActive ? 'scale-110 -translate-y-0.5' : 'scale-100'}`}>
                <Icon 
                    size={24} 
                    strokeWidth={isActive ? 3 : 2.5} 
                    className={`${isActive ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-zinc-500 hover:text-zinc-400'}`} 
                    filled={isActive} 
                />
            </div>
            {index === 2 && !isActive && (
                <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-black shadow-lg"></div>
            )}
        </button>
     )
  };

  const handleCreatorClickFromFeed = async (handle: string) => {
    setIsPaused(true);
    const profile = await getProfile(handle);
    if (profile) setViewingUser(profile);
  };

  const handleToggleSaveFeed = async (uri: string) => {
    const success = await toggleSaveFeed(uri);
    if (success) {
      const updatedSaved = await getSavedFeeds();
      setFeeds([MOCK_ALL_FEEDS[0], ...updatedSaved]);
      if (selectedFeedInfo?.uri === uri) {
          const fresh = updatedSaved.find(f => f.uri === uri);
          setSelectedFeedInfo(fresh || { ...selectedFeedInfo, viewerState: { isSaved: false, isPinned: false } });
      }
    }
  };

  const handleTogglePinFeed = async (uri: string) => {
    if (!agent.session) return;
    try {
        const prefsRes = await agent.app.bsky.actor.getPreferences();
        let preferences = [...prefsRes.data.preferences];
        const savedFeedsPref = preferences.find(p => p.$type === 'app.bsky.actor.defs#savedFeedsPref') as any;
        if (savedFeedsPref) {
            const isPinned = savedFeedsPref.pinned.includes(uri);
            if (isPinned) savedFeedsPref.pinned = savedFeedsPref.pinned.filter((f: string) => f !== uri);
            else { if (!savedFeedsPref.saved.includes(uri)) savedFeedsPref.saved.push(uri); savedFeedsPref.pinned.push(uri); }
        } else {
            preferences.push({ $type: 'app.bsky.actor.defs#savedFeedsPref', saved: [uri], pinned: [uri] });
        }
        await agent.app.bsky.actor.putPreferences({ preferences });
        const updatedSaved = await getSavedFeeds();
        setFeeds([MOCK_ALL_FEEDS[0], ...updatedSaved]);
        if (selectedFeedInfo?.uri === uri) {
            const fresh = updatedSaved.find(f => f.uri === uri);
            if (fresh) setSelectedFeedInfo(fresh);
        }
    } catch (e) { console.error("Pin feed error", e); }
  };

  const getFeedIcon = (feedName: string, defaultIcon: string) => { const name = (feedName || '').toLowerCase(); if (name.includes('discover') || name.includes('popular')) return Icons.Zap; if (name.includes('science') || name.includes('sky')) return Icons.Cloud; if (name.includes('for you') || name.includes('mixed')) return Icons.Layers; if (name.includes('art') || name.includes('design')) return Icons.Palette; if (name.includes('tech') || name.includes('code')) return Icons.Cpu; if (name.includes('photo')) return Icons.Camera; if (name.includes('garden')) return Icons.Sun; if (name.includes('keys')) return Icons.Keyboard; if (name.includes('cats') || name.includes('smile')) return Icons.Smile; if (name.includes('brutal')) return Icons.Box; if (name.includes('video') || name.includes('reel') || name.includes('media')) return Icons.Play; if (name.includes('news')) return Icons.Newspaper; if (name.includes('hot') || name.includes('trend')) return Icons.Flame; return (Icons as any)[defaultIcon] || Icons.Hash; };
  const tempFeed = temporaryFeed || (temporaryFeedId ? feeds.find(f => f.id === temporaryFeedId) : null);
  const showTempFeed = tempFeed && !tempFeed.viewerState?.isPinned;
  
  if (isAuthChecking) return <div className="flex h-screen w-full bg-black items-center justify-center text-white">Loading...</div>;
  const isGlobalFocused = isFullScreenHeld || isFocusLocked;
  const shouldHideBottomNav = isGlobalFocused || isChatOpen;
  const shouldHideTopHeader = isGlobalFocused || isScrubbing;

  // Refined liquid timing for Apple-like smoothness
  const headerDockTransition = 'all 450ms cubic-bezier(0.32, 0.72, 0, 1)';

  return (
    <HashRouter>
      <div className={`flex flex-col h-[100dvh] w-full dark:bg-black bg-white font-sans text-white overflow-hidden max-w-md mx-auto relative shadow-none border-none`}>
        {!isAuthenticated && <LoginOverlay onLoginSuccess={handleLoginSuccess} />}
        {isGlobalFocused && (<div className="absolute top-4 left-4 z-[500] animate-fade-in pointer-events-auto"><button onClick={(e) => { e.stopPropagation(); setIsFocusLocked(false); setIsFullScreenHeld(false); if (!isUserPaused) setIsPaused(false); }} className={`w-9 h-9 rounded-xl flex items-center justify-center backdrop-blur-xl border transition-all duration-[800ms] ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-90 relative overflow-hidden group ${isFocusLocked ? 'bg-blue-600/15 border-blue-400/15 shadow-[0_0_15px_rgba(59,130,246,0.25)]' : 'bg-white/5 border-white/5 opacity-50 hover:opacity-100'}`}><div className={`absolute inset-0 transition-opacity duration-[800ms] ${isFocusLocked ? 'opacity-10 bg-blue-400' : 'opacity-0'}`} /><div className="relative z-10 flex items-center justify-center"><Icons.Cloud size={16} filled className={`transition-all duration-[800ms] ${isFocusLocked ? 'text-blue-200/90 drop-shadow-[0_0_10px_rgba(255,255,255,0.6)] scale-110' : 'text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]'}`} /></div></button></div>)}
        <div 
          className={`absolute top-0 left-0 right-0 z-[150] h-[52px] px-3 flex justify-between items-start pt-[7px] pointer-events-none transition-all`}
          style={{ transition: headerDockTransition, opacity: shouldHideTopHeader ? 0 : 1, transform: shouldHideTopHeader ? 'translateY(-20px)' : 'translateY(0)' }}
        >
            <button 
                onClick={() => isMenuOpen ? setIsMenuOpen(false) : handleOpenMenu()} 
                className={`${isNotificationsOpen ? 'blur-[2px] opacity-60 pointer-events-none' : 'pointer-events-auto'} h-[40px] w-[40px] min-w-[40px] flex items-center justify-center rounded-full bg-black/60 backdrop-blur-3xl border border-white/20 text-white hover:bg-white/10 transition-all duration-300 shadow-2xl`}
            >
                {isMenuOpen ? <Icons.X size={20} /> : <Icons.Menu size={20} />}
            </button>
            <NotificationButton 
                onClick={() => isNotificationsOpen ? setIsNotificationsOpen(false) : handleOpenNotifications()} 
                isOpen={isNotificationsOpen} 
                className={`transition-all duration-300 ${isMenuOpen ? 'blur-[2px] opacity-60 pointer-events-none' : 'pointer-events-auto'}`}
            />
        </div>
        <SideMenu ref={sideMenuPanelRef} isOpen={isMenuOpen} onClose={() => { setIsMenuOpen(false); if (!isUserPaused) setIsPaused(false); }} onTabChange={(index) => scrollToPage(index)} onLibrarySelect={handleLibrarySelect} onSearchNavigate={handleSearchNavigate} onOpenSettings={handleOpenSettings} onManageFeeds={handleManageFeeds} onOpenSearch={handleOpenSearch} currentUser={currentUserProfile} />
        <NotificationsMenu ref={notifMenuPanelRef} isOpen={isNotificationsOpen} onClose={() => { setIsNotificationsOpen(false); if (!isUserPaused) setIsPaused(false); }} />
        <FeedInfoModal 
            isOpen={!!selectedFeedInfo} 
            onClose={() => setSelectedFeedInfo(null)} 
            feed={selectedFeedInfo} 
            onCreatorClick={handleCreatorClickFromFeed}
            onToggleSave={handleToggleSaveFeed}
            onTogglePin={handleTogglePinFeed}
        />
        <UserCardModal 
            user={viewingUser} 
            onClose={() => { setViewingUser(null); if (!isUserPaused) setIsPaused(false); }} 
            onOpenProfileMenu={handleOpenProfileMenu} 
            onShareProfile={handleShareProfile} 
            onOpenIdentityDetails={handleOpenIdentityDetails} 
            onNavigateToProfile={handleNavigateToProfile} 
            onMessageUser={handleMessageUser}
            onUserClick={handleUserClick} 
        />
        <ContextMenuDrawer isOpen={isContextMenuOpen} onClose={() => { setContextMenuOpen(false); if (!isUserPaused) setIsPaused(false); }} post={selectedPost} onPostHidden={handleHidePost} isSaved={selectedPost ? !!bookmarkedPosts[selectedPost.uri] : false} onToggleSave={selectedPost ? () => handleToggleBookmark(selectedPost) : undefined} />
        <ProfileContextMenu isOpen={isProfileMenuOpen} onClose={() => { setIsProfileMenuOpen(false); if (!viewingUser && !isUserPaused) setIsPaused(false); }} user={profileMenuUser} commentText={contextCommentText} commentUri={contextCommentUri} commentId={contextCommentId} />
        <EditProfileDrawer isOpen={isEditProfileOpen} onClose={() => { setIsEditProfileOpen(false); if (!isUserPaused) setIsPaused(false); }} />
        <IdentityDetailsDrawer isOpen={isIdentityDetailsOpen} onClose={() => { setIsIdentityDetailsOpen(false); if (!isUserPaused) setIsPaused(false); }} user={identityUser} />
        <LinksDrawer isOpen={isLinksDrawerOpen} onClose={() => { setIsLinksDrawerOpen(false); if (!isUserPaused) setIsPaused(false); }} />
        <ManageFeedsDrawer isOpen={isManageFeedsOpen} onClose={() => { setIsManageFeedsOpen(false); if (!isUserPaused) setIsPaused(false); }} feeds={feeds} setFeeds={setFeeds} onFeedInfo={setSelectedFeedInfo} onFeedSelect={handleSwitchFeed} onDiscoverFeeds={handleDiscoverFeeds} />
        <SettingsDrawer isOpen={isSettingsOpen} onClose={() => { setIsSettingsOpen(false); if (!isUserPaused) setIsPaused(false); }} settings={settings} onUpdateSetting={handleUpdateSetting} />
        <LibraryDrawer isOpen={isLibraryDrawerOpen} onClose={() => { setIsLibraryDrawerOpen(false); if (!isUserPaused) setIsPaused(false); }} initialTab={libraryInitialTab} />
        
        {/* MAIN APP SHELL WITH NEW DOCK DESIGN */}
        <div className="flex-1 flex flex-col min-h-0 bg-black">
          {/* CONTENT AREA: Rounded Bottom to create visual separation from dock */}
          <div className="flex-1 min-h-0 rounded-b-[32px] overflow-hidden bg-black relative z-10 transition-all duration-300">
            
            {/* Liquid Filter Definition */}
            <svg style={{ position: 'absolute', width: 0, height: 0 }}>
              <filter id="goo">
                <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
                <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
                <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
              </filter>
            </svg>

            {/* Reference-style Edge Overlay */}
            <div className={`absolute inset-0 pointer-events-none z-[100] rounded-b-[32px] overflow-hidden transition-opacity duration-300 ${isGlobalFocused ? 'opacity-0' : 'opacity-100'}`}>
                <div 
                    className="absolute inset-0 rounded-b-[32px] border-b border-x border-white/10 shadow-[inset_0_-0.5px_0_0_rgba(255,255,255,0.2)]"
                />
            </div>

            <div ref={mainScrollRef} onScroll={handleHorizontalScroll} className={`h-full w-full flex flex-row ${isGlobalFocused ? 'overflow-x-hidden' : 'overflow-x-auto snap-x snap-mandatory'} no-scrollbar`}>
                <div className="min-w-full h-full snap-start snap-stop-always relative bg-black z-10" onTouchStart={handleSwipeStart} onTouchMove={handleHomeTouchMove} onTouchEnd={handleSwipeEnd}>
                    <div className="w-full h-full relative">
                        <div 
                          className={`absolute top-0 left-0 right-0 z-50 pointer-events-none transition-all`}
                          style={{ transition: headerDockTransition, opacity: shouldHideTopHeader ? 0 : 1, transform: shouldHideTopHeader ? 'translateY(-10px)' : 'translateY(0)' }}
                        >
                            <div className="absolute top-0 left-0 right-0 h-[52px] bg-gradient-to-b from-black/40 to-transparent pointer-events-none z-0" />
                            <div className="flex justify-center items-center h-[52px] px-16 relative z-20">
                                <div className="pointer-events-auto relative z-10 h-[40px] flex items-center bg-black/60 backdrop-blur-3xl border border-white/20 rounded-full p-1 shadow-2xl mx-auto transition-all duration-300 gap-1">
                                    <div className="relative h-full flex items-center" ref={followingMenuRef}>
                                        <button onClick={handleFollowingClick} className={`h-full px-3 rounded-full text-[13px] font-bold transition-all flex items-center justify-center gap-1 leading-none whitespace-nowrap ${activeFeedType === 'FOLLOWING' ? 'bg-white text-black shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>Following {activeFeedType === 'FOLLOWING' && (<Icons.ChevronDown size={10} className={`opacity-70 ${showFollowingSortMenu ? 'rotate-180' : ''} transition-transform`} />)}</button>
                                        <AnimatedDropdown isOpen={showFollowingSortMenu} className="absolute top-full left-0 mt-2 z-50 origin-top-left"><div className="bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-1.5 min-w-[140px] overflow-hidden"><button onClick={() => { setFollowingSort('TIME'); setShowFollowingSortMenu(false); }} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-bold transition-colors ${followingSort === 'TIME' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><span>Time</span>{followingSort === 'TIME' && <Icons.Check size={14} className="text-blue-500" />}</button><button onClick={() => { setFollowingSort('RELEVANCE'); setShowFollowingSortMenu(false); }} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-bold transition-colors ${followingSort === 'RELEVANCE' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><span>Relevance</span>{followingSort === 'RELEVANCE' && <Icons.Check size={14} className="text-blue-500" />}</button></div></AnimatedDropdown>
                                    </div>
                                    <div className="relative h-full flex items-center" ref={forYouMenuRef}>
                                        <button onClick={handleForYouClick} className={`h-full px-3 rounded-full text-[13px] font-bold transition-all flex items-center justify-center gap-1 leading-none whitespace-nowrap ${activeFeedType === 'FOR_YOU' ? 'bg-white text-black shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'}`}><ScrollingTabLabel text={selectedFeedTitle} containerClass="max-w-[100px]" textClass="text-[13px] font-bold leading-none" fadeLeft={true} />{activeFeedType === 'FOR_YOU' && (<Icons.ChevronDown size={10} className={`opacity-70 ${showForYouMenu ? 'rotate-180' : ''} transition-transform flex-shrink-0`} />)}</button>
                                        <div ref={forYouDropdownRef}><AnimatedDropdown isOpen={showForYouMenu} className="fixed top-[46px] left-1/2 -translate-x-1/2 mt-0 z-[60] origin-top"><div className="bg-black/95 backdrop-blur-3xl saturate-150 border border-white/20 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,1)] w-[240px] flex flex-col overflow-hidden relative"><div className="px-4 py-1.5 bg-black text-[8px] font-black text-zinc-400 uppercase tracking-[0.2em] text-center border-b border-white/5 select-none rounded-t-xl">Pinned Feeds</div><div className="bg-transparent overflow-y-auto no-scrollbar py-0.5 max-h-[260px] relative scroll-smooth" onScroll={updateFeedsScroll} ref={feedsListRef}>{showTempFeed && tempFeed && (<div onClick={() => handleFeedDropdownSelect(tempFeed.name)} className="flex items-center gap-3.5 px-5 py-0.5 bg-blue-500/10 border-l-[3px] border-blue-500 transition-all cursor-pointer group"><div className="flex-shrink-0 text-blue-400 group-hover:scale-110 transition-transform">{React.createElement(getFeedIcon(tempFeed.name, tempFeed.icon), { size: 17, strokeWidth: 2.5 })}</div><div className="flex-1 min-w-0"><div className="text-[13px] font-bold text-blue-400 truncate leading-tight tracking-tight">{tempFeed.name}</div><div className="text-[8px] text-blue-300/60 font-black uppercase tracking-wider">Active Now</div></div><div className="flex items-center gap-1"><button onClick={(e) => handlePinFeed(e, tempFeed.id)} className="p-1 text-blue-700 hover:text-blue-400 transition-colors"><Icons.Plus size={16} strokeWidth={3} /></button><button onClick={(e) => { e.stopPropagation(); setSelectedFeedInfo(tempFeed); }} className="p-1 text-blue-700 hover:text-blue-400 transition-colors"><Icons.Info size={16} /></button></div></div>)}{feeds.filter(f => f.viewerState?.isPinned && f.id !== 'feed1').map(feed => { const FeedIcon = getFeedIcon(feed.name, feed.icon); const isSelected = selectedFeedTitle === feed.name; return (<div key={feed.id} onClick={() => handleFeedDropdownSelect(feed.name)} className={`flex items-center gap-3.5 px-5 py-1 transition-all cursor-pointer group ${isSelected ? 'bg-blue-500/10 border-l-[3px] border-blue-500' : 'hover:bg-white/5 border-l-[3px] border-transparent'}`}><div className={`flex-shrink-0 transition-all duration-300 ${isSelected ? 'text-blue-400 scale-110' : 'text-zinc-500 group-hover:text-white'}`}><FeedIcon size={17} strokeWidth={isSelected ? 3 : 2} /></div><div className={`flex-1 text-[13px] font-bold truncate leading-tight tracking-tight ${isSelected ? 'text-blue-400' : 'text-zinc-300 group-hover:text-white'}`}>{feed.name}</div><button onClick={(e) => { e.stopPropagation(); setSelectedFeedInfo(feed); }} className={`p-1 transition-colors ${isSelected ? 'text-blue-700 hover:text-blue-400' : 'text-zinc-700 hover:text-zinc-500'}`}><Icons.Info size={15} /></button></div>); })}</div><div className="absolute right-1 top-[35px] bottom-[40px] w-0.5 pointer-events-none transition-opacity duration-300" style={{ opacity: feedsScrollState.show ? 0.3 : 0 }}><div ref={feedsThumbRef} className="w-full bg-white/60 rounded-full" style={{ height: `${feedsScrollState.height}px` }} /></div><button onClick={handleManageFeeds} className="flex items-center justify-center gap-2 py-1.5 bg-black border-t border-white/5 hover:bg-white/10 transition-all group active:bg-white/15 rounded-b-xl"><Icons.Settings size={13} className="text-zinc-500 group-hover:text-white transition-colors" /><span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 group-hover:text-white transition-colors">Manage Feeds</span></button></div></AnimatedDropdown></div>
                                    </div>
                                    <div className="relative h-full flex items-center" ref={storiesMenuRef}>
                                        <button onClick={handleStoriesClick} className={`h-full px-3 rounded-full text-[13px] font-bold transition-all flex items-center justify-center gap-1 whitespace-nowrap ${activeFeedType === 'STORIES' ? 'bg-white shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'}`} title="Stories"><Icons.Zap size={18} className={activeFeedType === 'STORIES' ? 'text-black' : ''} />{activeFeedType === 'STORIES' && (<Icons.ChevronDown size={10} className={`text-black opacity-100 ${showStoriesMenu ? 'rotate-180' : ''} transition-transform`} />)}</button>
                                        <div ref={storiesDropdownRef}><AnimatedDropdown isOpen={showStoriesMenu} className="absolute top-full right-0 mt-2 z-50 origin-top-right"><div className="bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-1.5 w-[220px] flex flex-col max-h-[400px]"><div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center justify-between"><span>Recent Stories</span><span className="bg-white/10 px-1.5 py-0.5 rounded text-white">{storyGroups.length}</span></div><div className="overflow-y-auto no-scrollbar flex-1 space-y-0.5" ref={storiesListRef}>{storyGroups.map((group, idx) => { const isActive = idx === activeFeedItemIndex && activeFeedType === 'STORIES'; return (<button key={group.user.id} onClick={() => jumpToUser(group.user.id)} className={`w-full flex items-center gap-3 px-2 py-2 rounded-xl text-left transition-all group ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`}><div className={`relative p-[1.5px] rounded-full ${isActive ? 'bg-gradient-to-tr from-yellow-400 to-red-500' : 'bg-white/20 group-hover:bg-white/40'}`}><img src={group.user.avatarUrl} className="w-8 h-8 rounded-full border-2 border-[#1a1a1a] object-cover" alt="" /></div><div className="flex-1 min-w-0"><div className={`text-[12px] font-bold truncate ${isActive ? 'text-white' : 'text-gray-300'}`}>{group.user.displayName}</div><div className="text-[10px] text-gray-500 font-medium truncate">{group.lastUpdated}</div></div>{isActive && <div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse"></div>}</button>); })}</div><div className="absolute right-1 top-10 bottom-2 w-1 pointer-events-none opacity-0 transition-opacity duration-300" style={{ opacity: storiesScrollState.show ? 1 : 0 }}><div ref={storiesThumbRef} className="w-full bg-white/30 rounded-full" style={{ height: `${storiesScrollState.height}px` }} /></div></div></AnimatedDropdown></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* REFRESH BACKGROUND & INDICATOR LAYER */}
                        <div className="absolute inset-x-0 top-0 h-[400px] z-0 pointer-events-none overflow-hidden flex justify-center">
                             {/* Textured Background (Revealed on Pull) */}
                             <div 
                                className="absolute inset-0 transition-opacity duration-300 will-change-opacity"
                                style={{ opacity: Math.min(pullY / 40, 1) }}
                             >
                                 <div className="absolute inset-0 bg-gradient-to-b from-[#1c1c1c] via-[#111] to-black" />
                                 <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-60" />
                                 <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                             </div>

                             {/* Liquid Wrapper */}
                             <div 
                               className="relative w-full h-full flex justify-center"
                               style={{ filter: 'url(#goo)' }}
                             >
                                {/* The Connector (Stretches) */}
                                <div 
                                    className="absolute top-0 w-1 bg-blue-500 rounded-b-full transition-all duration-75 will-change-[height, opacity]"
                                    style={{ 
                                        height: `${pullY * 0.8}px`,
                                        opacity: Math.max(0, 1 - (pullY / 120)), // Fades out as it stretches too far (snaps)
                                        width: `${Math.max(2, 10 - (pullY * 0.1))}px` // Thins out
                                    }}
                                />

                                {/* Dynamic Motion Icon */}
                                <div 
                                className="relative mt-[70px] flex flex-col items-center z-10 will-change-transform"
                                style={{ 
                                    transform: `translateY(${pullY * 0.65}px)`, 
                                    opacity: Math.min(pullY / 30, 1)
                                }}
                                >
                                    <div className={`w-11 h-11 rounded-full flex items-center justify-center shadow-[0_4px_24px_rgba(0,0,0,0.5)] transition-all duration-300 border backdrop-blur-xl ${pullY > 70 ? 'bg-blue-500 text-white border-blue-400 scale-110 shadow-[0_0_30px_rgba(59,130,246,0.4)]' : 'bg-black/60 text-white/70 border-white/10 scale-100'}`}>
                                    {isRefreshing ? (
                                        <Icons.Loader2 size={20} className="animate-spin text-white" strokeWidth={2.5} />
                                    ) : (
                                        <Icons.RefreshCw 
                                            size={20} 
                                            className={`transition-all duration-100 ${pullY > 70 ? 'text-white' : 'text-gray-400'}`}
                                            style={{ transform: `rotate(${pullY * 3}deg)` }}
                                            strokeWidth={2.5}
                                        />
                                    )}
                                    </div>
                                    
                                    {/* Dynamic Text Label */}
                                    <div 
                                        className={`mt-3 flex flex-col items-center transition-all duration-300 ${pullY > 20 ? 'opacity-100 transform-none' : 'opacity-0 -translate-y-2'}`}
                                    >
                                        <span className={`text-[10px] font-black uppercase tracking-[0.25em] transition-colors duration-300 ${pullY > 70 ? 'text-blue-400' : 'text-white/40'}`}>
                                            {isRefreshing ? 'Syncing Feed' : pullY > 70 ? 'Release' : 'Pull to Refresh'}
                                        </span>
                                        {pullY > 70 && !isRefreshing && (
                                            <div className="w-1 h-1 bg-blue-500 rounded-full mt-1.5 animate-ping" />
                                        )}
                                    </div>
                                </div>
                             </div>
                        </div>

                        <div 
                            key={activeFeedType + (activeFeedUri || '')} 
                            ref={feedContainerRef} 
                            className="w-full h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar overscroll-behavior-y-contain rounded-b-[20px] relative z-20 bg-black shadow-[0_-20px_60px_rgba(0,0,0,0.8)]"
                            style={{ 
                                transform: `translateY(${pullY}px)`, 
                                transition: isRefreshing ? 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)' : (pullY === 0 ? 'transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275), filter 0.3s ease' : 'none'),
                                filter: isRefreshing ? 'none' : `blur(${Math.min(pullY / 40, 10)}px)`,
                                willChange: 'transform, filter'
                            }}
                            onTouchStart={handlePullStart}
                            onTouchMove={handlePullMove}
                            onTouchEnd={handlePullEnd}
                        >
                            {isLoadingFeed ? (<div className="w-full h-full flex flex-col items-center justify-center text-gray-500"><div className="animate-spin mb-3"><Icons.Loader2 size={32}/></div><span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Syncing Protocol Feed</span></div>) : activeFeedType === 'STORIES' ? (storyGroups.map((group, index) => Math.abs(index - activeFeedItemIndex) <= 2 ? (<FeedItem key={group.user.id} stories={group.stories} post={group.stories[0]} isActive={index === activeFeedItemIndex && activeIndex === 0} onCommentClick={handleOpenComments} onShareClick={handleOpenShare} onStoryComplete={() => handleStoryNextUser(index)} onStoryPrevUser={() => handleStoryPrevUser(index)} onUserClick={handleUserClick} onTagClick={handleTagClick} isPaused={isPaused} onTogglePause={handleStoryTogglePause} onContextMenuClick={handleOpenContextMenu} onSetFullScreen={setIsFullScreenHeld} onSetPaused={setIsPaused} isMuted={isGlobalMuted} onToggleMute={handleToggleMute} initialStoryIndex={storyCursors[group.user.id] || 0} isFocusLocked={isFocusLocked} onToggleFocusLock={setIsFocusLocked} />) : <div key={group.user.id} className="w-full h-full snap-start snap-stop-always bg-black" />)) : (currentFeedPosts.map((post, index) => Math.abs(index - activeFeedItemIndex) <= 2 ? (<FeedItem key={post.id} post={post} isActive={index === activeFeedItemIndex && activeIndex === 0} onCommentClick={handleOpenComments} onShareClick={handleOpenShare} hideOverlay={isGlobalFocused} onUserClick={handleUserClick} onTagClick={handleTagClick} isPaused={isPaused} onTogglePause={handleStoryTogglePause} onContextMenuClick={handleOpenContextMenu} onSetFullScreen={setIsFullScreenHeld} onSetPaused={setIsPaused} isMuted={isGlobalMuted} onToggleMute={handleToggleMute} isSaved={!!bookmarkedPosts[post.uri]} onToggleSave={handleToggleBookmark} onScrubStateChange={setIsScrubbing} isFocusLocked={isFocusLocked} onToggleFocusLock={setIsFocusLocked} onQuoteClick={handleQuoteClick} />) : <div key={post.id} className="w-full h-full snap-start snap-stop-always bg-black" />))}
                            {isFetchingMore && activeFeedType !== 'STORIES' && (<div className="w-full h-24 flex items-center justify-center text-gray-500 snap-start snap-stop-always"><div className="animate-spin mr-2"><Icons.Loader2 size={20}/></div><span>Loading more...</span></div>)}
                            {!isLoadingFeed && currentFeedPosts.length === 0 && activeFeedType !== 'STORIES' && (<div className="w-full h-full flex flex-col items-center justify-center text-gray-500 p-8 text-center snap-start snap-stop-always"><Icons.VideoOff size={48} className="mb-4 opacity-20" /><h3 className="text-lg font-bold text-white mb-1">No videos yet</h3><p className="text-sm">Follow more people or try a different feed to discover content.</p></div>)}
                        </div>
                    </div>
                </div>
                <div className="min-w-full h-full snap-start snap-stop-always overflow-hidden z-20">
                    <SearchTab 
                        ref={searchTabRef}
                        isAuthenticated={isAuthenticated}
                        onOpenMenu={handleOpenMenu} 
                        onOpenNotifications={handleOpenNotifications} 
                        activeTab={searchActiveTab} 
                        onTabChange={setSearchActiveTab} 
                        shouldFocusSearch={shouldFocusSearch} 
                        onSearchFocusHandled={() => setShouldFocusSearch(false)} 
                        externalSearchQuery={externalSearchQuery} 
                        onExternalSearchHandled={() => setExternalSearchQuery('')} 
                        onUserClick={handleUserClick} 
                        onPostClick={handleSelectPostFromSearch} 
                        onFeedClick={handleSelectFeed} 
                        onFeedInfo={setSelectedFeedInfo} 
                        savedFeeds={feeds}
                        onToggleSave={handleToggleSaveFeed}
                        onCommentClick={handleOpenComments}
                        onShareClick={handleOpenShare}
                        onTogglePause={handleStoryTogglePause}
                        isPaused={isPaused}
                        isMuted={isGlobalMuted}
                        onToggleMute={handleToggleMute}
                        onContextMenuClick={handleOpenContextMenu}
                        isFullScreen={isGlobalFocused}
                        onQuoteClick={handleQuoteClick}
                    />
                </div>
                <div className="min-w-full h-full snap-start snap-stop-always overflow-hidden z-20"><ActivityTab onOpenMenu={handleOpenMenu} onOpenNotifications={handleOpenNotifications} startChatWithUser={pendingChatUser} onChatStarted={() => setPendingChatUser(null)} onChatOpen={(isOpen) => setIsChatOpen(isOpen)} onUserInfoClick={handleUserClick} /></div>
                <div className="min-w-full h-full snap-start snap-stop-always overflow-hidden z-20">
                    <ProfileTab 
                        user={profileUser || currentUserProfile} 
                        currentUser={currentUserProfile} 
                        onBack={handleProfileBack} 
                        onOpenMenu={handleOpenMenu} 
                        onOpenNotifications={handleOpenNotifications} 
                        activeTab={profileActiveTab} 
                        onTabChange={handleProfileTabChange} 
                        onOpenProfileMenu={handleOpenProfileMenu} 
                        onShareProfile={handleShareProfile} 
                        onEditProfile={handleEditProfile} 
                        onOpenIdentityDetails={handleOpenIdentityDetails} 
                        onOpenLinks={handleOpenLinksDrawer} 
                        onMessageUser={handleMessageUser}
                        selectedPost={profileSelectedPost}
                        onSelectPost={handleProfileSelectPost}
                        onCommentClick={handleOpenComments}
                        onShareClick={handleOpenShare}
                        onUserClick={handleUserClick}
                        onTagClick={handleTagClick}
                        onTogglePause={handleStoryTogglePause}
                        isPaused={isPaused}
                        isMuted={isGlobalMuted}
                        onToggleMute={handleToggleMute}
                        onToggleSave={handleToggleBookmark}
                        onContextMenuClick={handleOpenContextMenu}
                        onSetFullScreen={setIsFullScreenHeld}
                        onSetPaused={setIsPaused}
                        checkIsSaved={(post) => !!bookmarkedPosts[post.uri]}
                        onQuoteClick={handleQuoteClick}
                    />
                </div>
            </div>
          </div>

          {/* NEW DOCK AREA: The gap below content */}
          <div 
            className={`bg-black relative transition-all pointer-events-auto`}
            style={{ 
                transition: headerDockTransition, 
                height: shouldHideBottomNav ? '0' : '56px',
                opacity: shouldHideBottomNav ? 0 : 1,
                transform: shouldHideBottomNav ? 'translateY(40px)' : 'translateY(0)'
            }}
          >
            {/* Inverted Corner CSS Tricks - Using Radial Gradient Mask for seamless Dock/Curve integration */}
            <div className="absolute top-0 left-0 w-8 h-8 pointer-events-none -translate-y-full">
               <div 
                   className="w-full h-full bg-black"
                   style={{
                       maskImage: 'radial-gradient(circle at 100% 0%, transparent 32px, black 32.5px)',
                       WebkitMaskImage: 'radial-gradient(circle at 100% 0%, transparent 32px, black 32.5px)'
                   }}
               />
            </div>
            <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none -translate-y-full">
               <div 
                   className="w-full h-full bg-black"
                   style={{
                       maskImage: 'radial-gradient(circle at 0% 0%, transparent 32px, black 32.5px)',
                       WebkitMaskImage: 'radial-gradient(circle at 0% 0%, transparent 32px, black 32.5px)'
                   }}
               />
            </div>

            {/* DOCK CONTAINER: Starker Bolder Icons */}
            <div className="flex justify-between items-center px-6 h-full pt-1 pb-1 overflow-hidden">
               <NavButton index={0} icon={Icons.Home} />
               <NavButton index={1} icon={Icons.Compass} />
               <NavButton index={'CREATE'} icon={Icons.Plus} />
               <NavButton index={2} icon={Icons.MessageCircle} />
               <NavButton index={3} icon={Icons.User} />
            </div>
          </div>
        </div>

        <CreatePostModal isOpen={isCreateModalOpen} onClose={() => { setCreateModalOpen(false); if (!isUserPaused) setIsPaused(false); setQuotePost(null); }} currentUser={currentUserProfile} quotedPost={quotePost} />
        <CommentDrawer isOpen={isCommentDrawerOpen} onClose={() => { setCommentDrawerOpen(false); if (!isUserPaused) setIsPaused(false); setWasDrawerOpenBeforeProfile(false); }} post={selectedPost} currentUser={currentUserProfile} onUserClick={handleUserClick} onTagClick={handleTagClick} onOpenProfileMenu={handleOpenProfileMenu} />
        <ShareDrawer isOpen={isShareDrawerOpen} onClose={() => { setShareDrawerOpen(false); if (!isUserPaused) setIsPaused(false); }} post={shareTarget?.type === 'POST' ? shareTarget.data as Post : null} profile={shareTarget?.type === 'PROFILE' ? shareTarget.data as User : undefined} />
      </div>
    </HashRouter>
  );
};

export default App;