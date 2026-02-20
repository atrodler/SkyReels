
import React, { useState, useEffect, useRef } from 'react';
import { Post, User } from '../types';
import { Icons, linkifyText } from '../constants';
import { likePost, unlikePost, repostPost, deleteRepost, getProfile } from '../services/atp';
import UserHandle from './UserHandle';
// @ts-ignore
import Hls from 'hls.js';

interface ActionButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  color?: 'red' | 'blue' | 'green';
  disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ children, onClick, active, color = 'red', disabled = false }) => {
  let activeStyle = '';
  
  if (color === 'blue') {
    activeStyle = 'bg-blue-600/50 border-blue-500/60 text-white shadow-[0_0_20px_rgba(59,130,246,0.6)]';
  } else if (color === 'green') {
    activeStyle = 'bg-emerald-600/50 border-emerald-500/60 text-white shadow-[0_0_20px_rgba(16,185,129,0.6)]';
  } else {
    activeStyle = 'bg-red-600/50 border-red-500/60 text-white shadow-[0_0_20px_rgba(239,68,68,0.6)]';
  }

  const baseStyle = 'bg-black/20 border-white/20 text-white hover:bg-black/40 backdrop-blur-lg';

  return (
    <button 
      onClick={(e) => { if (!disabled) { e.stopPropagation(); onClick?.(); } }}
      className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all duration-200 active:scale-90 ${disabled ? 'pointer-events-none' : 'pointer-events-auto'} ${active 
        ? activeStyle 
        : baseStyle}`}
    >
      <div className="flex items-center justify-center filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.6)]">
        {children}
      </div>
    </button>
  );
};

interface FeedItemProps {
  post: Post;
  stories?: Post[];
  initialStoryIndex?: number;
  isActive: boolean;
  onCommentClick: (post: Post) => void;
  onShareClick: (post: Post) => void;
  onQuoteClick?: (post: Post) => void;
  isStory?: boolean;
  onNavigateStory?: (targetId: string, behavior?: ScrollBehavior) => void;
  onStoryComplete?: () => void;
  onStoryPrevUser?: () => void;
  hideOverlay?: boolean;
  onUserClick?: (user: User) => void;
  onTagClick?: (tag: string) => void;
  isPaused?: boolean;
  onTogglePause?: () => void;
  onToggleMute?: () => void;
  onToggleMuteVideo?: (muted: boolean) => void;
  onToggleSave?: (post: Post) => void;
  onContextMenuClick?: (post: Post) => void;
  onSetFullScreen?: (isFull: boolean) => void;
  onSetPaused?: (paused: boolean) => void;
  isMuted?: boolean;
  isSaved?: boolean;
  onScrubStateChange?: (isScrubbing: boolean) => void;
  isFocusLocked?: boolean;
  onToggleFocusLock?: (locked: boolean) => void;
}

const FeedItem: React.FC<FeedItemProps> = ({ 
    post: initialPost, 
    stories, 
    initialStoryIndex = 0,
    isActive, 
    onCommentClick, 
    onShareClick,
    onQuoteClick,
    isStory = false, 
    onNavigateStory, 
    onStoryComplete, 
    onStoryPrevUser,
    hideOverlay = false, 
    onUserClick, 
    onTagClick, 
    isPaused, 
    onTogglePause, 
    onContextMenuClick, 
    onSetFullScreen, 
    onSetPaused, 
    isMuted = true, 
    onToggleMute, 
    isSaved = false,
    onToggleSave,
    onScrubStateChange,
    isFocusLocked = false,
    onToggleFocusLock
}) => {
  const isStoryMode = !!stories && stories.length > 0;
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [storyProgress, setStoryProgress] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubTooltipX, setScrubTooltipX] = useState(0);
  const activePost = isStoryMode ? (stories ? stories[currentStoryIndex] : null) : initialPost;

  const [liked, setLiked] = useState(activePost?.isLiked || false);
  const [likesCount, setLikesCount] = useState(activePost?.likesCount || 0);
  const [likeUri, setLikeUri] = useState(activePost?.likeUri);
  
  const [reposted, setReposted] = useState(activePost?.isReposted || false);
  const [repostsCount, setRepostsCount] = useState(activePost?.sharesCount || 0);
  const [repostUri, setRepostUri] = useState(activePost?.repostUri);
  
  const [showRepostConfirmation, setShowRepostConfirmation] = useState(false);
  const [isRepostModalVisible, setIsRepostModalVisible] = useState(false);
  const [shouldRenderRepostModal, setShouldRenderRepostModal] = useState(false);

  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState({ 
      width: typeof window !== 'undefined' ? Math.min(window.innerWidth, 480) : 0, 
      height: typeof window !== 'undefined' ? window.innerHeight : 0 
  });

  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasLockedOnDownRef = useRef(false);
  const lastTapTimeRef = useRef(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const prevImageRef = useRef(activePost?.imageUrl);
  const wasPlayingBeforeScrubRef = useRef(false);
  const storyElapsedTimeRef = useRef(0);
  const lastFrameTimeRef = useRef<number | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const progressContainerRef = useRef<HTMLDivElement>(null);
  const STORY_DURATION = 5000;

  // We rely on hoisted videoUrl/imageUrl for displaying media
  const isTextOnly = activePost ? (!activePost.imageUrl && !activePost.videoUrl) : false;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (showRepostConfirmation) {
        setShouldRenderRepostModal(true);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setIsRepostModalVisible(true);
            });
        });
    } else {
        setIsRepostModalVisible(false);
        timer = setTimeout(() => {
            setShouldRenderRepostModal(false);
        }, 200); 
    }
    return () => clearTimeout(timer);
  }, [showRepostConfirmation]);

  useEffect(() => {
      if (!containerRef.current) return;
      const observer = new ResizeObserver((entries) => {
          for (const entry of entries) {
              setContainerDimensions({ width: entry.contentRect.width, height: entry.contentRect.height });
          }
      });
      observer.observe(containerRef.current);
      return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!activePost) return;
    setLiked(activePost.isLiked);
    setLikesCount(activePost.likesCount);
    setLikeUri(activePost.likeUri);
    setReposted(activePost.isReposted);
    setRepostsCount(activePost.sharesCount);
    setRepostUri(activePost.repostUri);
    setVideoProgress(0);
    setIsExpanded(false);
    setAspectRatio(null); 
    if (activePost.imageUrl !== prevImageRef.current) {
        setImageLoaded(false);
        prevImageRef.current = activePost.imageUrl;
    }
  }, [activePost?.id]);

  useEffect(() => {
      if (isActive && isStoryMode) {
          setCurrentStoryIndex(initialStoryIndex);
          setStoryProgress(0);
          storyElapsedTimeRef.current = 0;
      }
  }, [initialStoryIndex, isActive, isStoryMode]);

  useEffect(() => {
    if (!activePost) return;
    const video = videoRef.current;
    if (!video || !activePost.videoUrl) return;

    if (activePost.videoUrl.includes('.m3u8')) {
        if (Hls.isSupported()) {
            if (hlsRef.current) { hlsRef.current.destroy(); }
            const hls = new Hls({ enableWorker: true, lowLatencyMode: false, backBufferLength: 90, startLevel: -1, capLevelToPlayerSize: false, maxBufferLength: 30, maxMaxBufferLength: 60, abrEwmaDefaultEstimate: 100000000, minAutoBitrate: 2000000 });
            hlsRef.current = hls;
            hls.loadSource(activePost.videoUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, (event: any, data: any) => { if (isActive && !isPaused && !isScrubbing) { video.play().catch(e => console.debug("HLS Auto-play blocked", e)); } });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) { video.src = activePost.videoUrl; }
    } else { video.src = activePost.videoUrl; }

    return () => { if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; } };
  }, [activePost?.videoUrl, activePost?.id]);

  const handleNextStory = () => { if (!isStoryMode || !stories) return; if (currentStoryIndex < stories.length - 1) { setCurrentStoryIndex(prev => prev + 1); setStoryProgress(0); storyElapsedTimeRef.current = 0; lastFrameTimeRef.current = null; } else { onStoryComplete?.(); } };
  useEffect(() => { if (!activePost) return; let animationFrameId: number; if (isActive && isStoryMode && !isPaused && !isHolding) { const animate = (time: number) => { if (lastFrameTimeRef.current === null) { lastFrameTimeRef.current = time; } const delta = time - lastFrameTimeRef.current; lastFrameTimeRef.current = time; const video = videoRef.current; if (activePost.videoUrl) { if (video && video.duration > 0) { const currentProgress = (video.currentTime / video.duration) * 100; setStoryProgress(currentProgress); } } else { storyElapsedTimeRef.current += delta; const progress = Math.min((storyElapsedTimeRef.current / STORY_DURATION) * 100, 100); setStoryProgress(progress); if (progress >= 100) { handleNextStory(); return; } } animationFrameId = requestAnimationFrame(animate); }; animationFrameId = requestAnimationFrame(animate); } else { lastFrameTimeRef.current = null; } return () => { if (animationFrameId) cancelAnimationFrame(animationFrameId); }; }, [isActive, isStoryMode, isPaused, isHolding, currentStoryIndex, activePost?.videoUrl]);
  const handlePrevStory = () => { if (!isStoryMode || !stories) return; if (currentStoryIndex > 0) { setCurrentStoryIndex(prev => prev - 1); setStoryProgress(0); storyElapsedTimeRef.current = 0; lastFrameTimeRef.current = null; } else { onStoryPrevUser?.(); } };
  const handleVideoEnded = () => { if (isStoryMode) { handleNextStory(); } };
  const handleTimeUpdate = () => { if (videoRef.current && !isStoryMode && !isScrubbing) { const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100; setVideoProgress(progress); } };
  
  const handleScrubbing = (e: React.PointerEvent | PointerEvent) => { 
    if (!videoRef.current || isStoryMode || !progressContainerRef.current) return; 
    const duration = videoRef.current.duration; 
    if (!isFinite(duration) || isNaN(duration) || duration <= 0) return; 
    
    const rect = progressContainerRef.current.getBoundingClientRect(); 
    const clientX = (e as any).clientX !== undefined ? (e as any).clientX : ((e as any).touches && (e as any).touches[0]?.clientX); 
    if (clientX === undefined) return; 
    
    const x = clientX - rect.left; 
    const pos = Math.max(0, Math.min(1, x / rect.width)); 
    const seekTime = pos * duration; 
    
    if (isFinite(seekTime)) { 
        videoRef.current.currentTime = seekTime; 
        setVideoProgress(pos * 100); 
    } 
    
    if (containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const progressBarLeftOffset = rect.left - containerRect.left;
        const rawTooltipX = progressBarLeftOffset + (pos * rect.width);
        const containerW = containerRect.width;
        const halfTooltipW = 75; 
        const margin = 16;
        const minX = halfTooltipW + margin;
        const maxX = containerW - halfTooltipW - margin;
        const clampedTooltipX = Math.max(minX, Math.min(rawTooltipX, maxX));
        setScrubTooltipX(clampedTooltipX);
    }
  };

  const handleScrubStart = (e: React.PointerEvent) => { e.stopPropagation(); if (!videoRef.current || isStoryMode) return; setIsScrubbing(true); onScrubStateChange?.(true); wasPlayingBeforeScrubRef.current = !videoRef.current.paused; videoRef.current.pause(); handleScrubbing(e); const onGlobalMove = (event: PointerEvent) => handleScrubbing(event); const onGlobalUp = (event: PointerEvent) => { setIsScrubbing(false); onScrubStateChange?.(false); if (wasPlayingBeforeScrubRef.current && videoRef.current) { videoRef.current.play().catch(err => console.debug("Scrub resume fail", err)); } window.removeEventListener('pointermove', onGlobalMove); window.removeEventListener('pointerup', onGlobalUp); }; window.addEventListener('pointermove', onGlobalMove); window.addEventListener('pointerup', onGlobalUp); };
  useEffect(() => { if (!activePost) return; const video = videoRef.current; if (isActive && !isPaused && !isScrubbing) { if (video && video.readyState >= 2) { video.play().catch((error) => console.debug("Auto-play prevented:", error)); } } else { if (video) video.pause(); } }, [isActive, isPaused, isScrubbing, activePost?.videoUrl, activePost?.id]); 
  
  const handleToggleLike = async () => { if (!activePost) return; const isNowLiked = !liked; setLiked(isNowLiked); setLikesCount(prev => isNowLiked ? prev + 1 : prev - 1); try { if (isNowLiked) { const res = await likePost(activePost.uri, activePost.cid); if (res && res.uri) setLikeUri(res.uri); } else if (likeUri) { await unlikePost(likeUri); setLikeUri(undefined); } } catch (e) { setLiked(!isNowLiked); setLikesCount(prev => !isNowLiked ? prev + 1 : prev - 1); } };

  const handleToggleRepost = async () => {
      if (!activePost) return;
      if (reposted) {
          setReposted(false);
          setRepostsCount(prev => prev - 1);
          try {
              if (repostUri) {
                  await deleteRepost(repostUri);
                  setRepostUri(undefined);
              }
          } catch (e) {
              setReposted(true);
              setRepostsCount(prev => prev + 1);
          }
      } else {
          setShowRepostConfirmation(true);
      }
  };

  const confirmRepost = async () => {
      if (!activePost) return;
      setShowRepostConfirmation(false);
      setReposted(true);
      setRepostsCount(prev => prev + 1);
      try {
          const res = await repostPost(activePost.uri, activePost.cid);
          if (res && res.uri) setRepostUri(res.uri);
      } catch (e) {
          setReposted(false);
          setRepostsCount(prev => prev - 1);
      }
  };

  const handleQuote = () => {
      if (!activePost) return;
      setShowRepostConfirmation(false);
      onQuoteClick?.(activePost);
  };

  const handleDoubleTapLike = async () => { if (!activePost) return; setShowHeartAnimation(true); setTimeout(() => setShowHeartAnimation(false), 1000); if (!liked) { setLiked(true); setLikesCount(prev => prev + 1); try { const res = await likePost(activePost.uri, activePost.cid); if (res && res.uri) setLikeUri(res.uri); } catch (e) { setLiked(false); setLikesCount(prev => prev - 1); } } };
  const toggleMute = (e: React.MouseEvent) => { e.stopPropagation(); onToggleMute?.(); };
  const handlePointerDown = (e: React.PointerEvent) => { if ((e.target as HTMLElement).closest('.progress-bar-container')) return; const now = Date.now(); if (now - lastTapTimeRef.current < 300) { handleDoubleTapLike(); lastTapTimeRef.current = 0; } else { lastTapTimeRef.current = now; } wasLockedOnDownRef.current = isFocusLocked; holdTimerRef.current = setTimeout(() => { setIsHolding(true); onSetFullScreen?.(true); }, 250); lockTimerRef.current = setTimeout(() => { onToggleFocusLock?.(true); setIsHolding(false); if (lockTimerRef.current) { lockTimerRef.current = null; } }, 3000); };
  const handlePointerUp = (e: React.PointerEvent) => { if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; } const reachedLockThreshold = lockTimerRef.current === null; if (lockTimerRef.current) { clearTimeout(lockTimerRef.current); lockTimerRef.current = null; } if (isFocusLocked && wasLockedOnDownRef.current && !isHolding && !reachedLockThreshold) { onToggleFocusLock?.(false); onSetFullScreen?.(false); return; } if (isHolding) { setIsHolding(false); if (!isFocusLocked) { onSetFullScreen?.(false); } } else if (!reachedLockThreshold && !isStoryMode && activePost && (activePost.videoUrl || isTextOnly) && !isScrubbing) { onTogglePause?.(); } };
  const handlePointerLeave = (e: React.PointerEvent) => { if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; } if (lockTimerRef.current) { clearTimeout(lockTimerRef.current); lockTimerRef.current = null; } if (isHolding && !isFocusLocked) { setIsHolding(false); onSetFullScreen?.(false); } };
  const handleStoryTap = (e: React.MouseEvent, direction: 'NEXT' | 'PREV') => { e.stopPropagation(); if (direction === 'NEXT') handleNextStory(); else handlePrevStory(); };
  const handleInTextHandleClick = async (handle: string) => { if (onUserClick) { const profile = await getProfile(handle); if (profile) onUserClick(profile); } };
  const handleInTextTagClick = (tag: string) => { if (onTagClick) { onTagClick(tag); } };
  const handleVideoMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => { const v = e.currentTarget; if (v.videoWidth && v.videoHeight) { setAspectRatio(v.videoWidth / v.videoHeight); } };
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => { setImageLoaded(true); const img = e.currentTarget; if (img.naturalWidth && img.naturalHeight) { setAspectRatio(img.naturalWidth / img.naturalHeight); } };

  if (!activePost) return null;

  const isFocused = isHolding || isFocusLocked;
  const shouldHideOverlay = hideOverlay || isFocused || isScrubbing;

  const getContainerStyle = () => {
      if (!isFocused) return { width: '100%', height: '100%' };
      const currentAR = aspectRatio || (isTextOnly ? 0.8 : 9/16); 
      const horizontalMargin = 24; const verticalMargin = 24;
      const maxW = containerDimensions.width - horizontalMargin; const maxH = containerDimensions.height - verticalMargin;
      let w = maxW; let h = w / currentAR;
      if (h > maxH) { h = maxH; w = h * currentAR; }
      return { width: `${w}px`, height: `${h}px` };
  };

  const focusTransition = 'all 600ms cubic-bezier(0.32, 0.72, 0, 1)';
  const isRepost = !!activePost.repostedBy;
  const isQuote = !!activePost.quotedPost;
  const reposterHandle = activePost.repostedBy?.handle;
  const quotedHandle = activePost.quotedPost?.author?.handle;

  // Determine text display
  // Prioritize the quoter's text (commentary) as the main description.
  const primaryText = activePost.text;
  // If quoted text exists, show it as context (in a bubble or similar), or just skip if user only wants media + commentary
  const secondaryText = isQuote ? activePost.quotedPost?.text : null;

  return (
    <div ref={containerRef} className={`relative w-full h-full snap-start snap-stop-always bg-black overflow-hidden flex-shrink-0 will-change-transform`}>
      <div className={`absolute inset-0 z-0 bg-black transition-opacity duration-[500ms] cubic-bezier(0.32, 0.72, 0, 1) ${isFocused ? 'opacity-100' : 'opacity-0'}`} />

      {isStoryMode && !isFocused && (
          <>
            <div className="absolute top-16 bottom-0 left-0 w-[15%] z-40" onClick={(e) => handleStoryTap(e, 'PREV')} />
            <div className="absolute top-16 bottom-0 right-0 w-[15%] z-40" onClick={(e) => handleStoryTap(e, 'NEXT')} />
            <div className="absolute top-16 bottom-0 left-[15%] right-[15%] z-40" onClick={(e) => { e.stopPropagation(); onTogglePause?.(); }} />
          </>
      )}

      <div 
        className={`absolute inset-0 flex items-center justify-center cursor-pointer select-none transition-all duration-[600ms] cubic-bezier(0.32, 0.72, 0, 1) ${isFocused ? 'bg-black' : 'bg-[#050505]'}`}
        onPointerDown={handlePointerDown} 
        onPointerUp={handlePointerUp} 
        onPointerLeave={handlePointerLeave}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div 
          className={`relative flex items-center justify-center transition-all overflow-visible will-change-[width,height,transform] translate-z-0`}
          style={{ ...getContainerStyle(), transition: focusTransition }}
        >
             {/* Background Aura */}
             <div 
                className={`absolute inset-0 z-0 transition-opacity pointer-events-none translate-z-0`}
                style={{ transition: focusTransition, opacity: isFocused ? 1 : 0 }}
             >
                <div className="absolute inset-[-6px] rounded-[32px] overflow-hidden blur-[14px] opacity-40 will-change-opacity">
                     <div className="absolute inset-[-150%] w-[400%] h-[400%] animate-plasma-swirl">
                         <div className="w-full h-full" style={{ background: 'conic-gradient(from 0deg, #3b82f6, #8b5cf6, #3730a3, #0ea5e9, #3b82f6)' }} />
                    </div>
                </div>
             </div>

             {/* Content Layer */}
             <div className={`relative z-10 overflow-hidden bg-black transition-all flex items-center justify-center w-full h-full will-change-[border-radius,box-shadow,transform] translate-z-0 ${isFocused ? 'rounded-[28px] shadow-[0_40px_160px_rgba(0,0,0,1)]' : 'rounded-none shadow-none'}`} style={{ transition: focusTransition }}>
                {activePost.videoUrl ? (
                    <video 
                        key={activePost.id} 
                        ref={videoRef} 
                        poster={activePost.imageUrl} 
                        className={`pointer-events-none block w-full h-full transition-opacity duration-500 backface-hidden object-cover translate-z-0`} 
                        playsInline 
                        loop={!isStoryMode} 
                        muted={isMuted} 
                        onEnded={handleVideoEnded} 
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleVideoMetadata}
                    />
                ) : activePost.imageUrl ? (
                    <img 
                        src={activePost.imageUrl} 
                        alt="Content" 
                        loading={isActive ? "eager" : "lazy"} 
                        className={`pointer-events-none block w-full h-full transition-opacity duration-[800ms] backface-hidden translate-z-0 ${imageLoaded ? 'opacity-100' : 'opacity-0'} ${isFocused ? 'object-cover' : 'object-cover animate-pan-image'}`} 
                        onLoad={handleImageLoad} 
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center p-8 bg-[#0a0a0a] relative overflow-hidden translate-z-0">
                         <div className="absolute inset-0 z-0 pointer-events-none">
                             <img src={activePost.author.avatarUrl} className="w-full h-full object-cover blur-[80px] scale-[1.5] opacity-50 saturate-200 animate-pulse-slow" alt="" />
                             <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
                             <div className="absolute inset-0 bg-black/20" />
                         </div>

                         <div className="relative z-10 text-center max-w-sm">
                            <p className="text-3xl font-black text-white leading-tight tracking-tighter">{linkifyText(activePost.text)}</p>
                            {/* Visual Representation of Quoted Post in Text Mode */}
                            {activePost.quotedPost && (
                                <div className="mt-6 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 text-left relative overflow-hidden">
                                    <div className="flex items-center gap-2 mb-2">
                                        <img src={activePost.quotedPost.author.avatarUrl} className="w-5 h-5 rounded-full" />
                                        <span className="text-xs font-bold">{activePost.quotedPost.author.displayName}</span>
                                    </div>
                                    <p className="text-xs text-gray-200 line-clamp-3">{activePost.quotedPost.text}</p>
                                    {activePost.quotedPost.imageUrl && (
                                        <div className="mt-2 rounded-lg overflow-hidden h-20 w-full relative">
                                            <img src={activePost.quotedPost.imageUrl} className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>
                            )}
                            {activePost.tags.length > 0 && (
                                <div className="mt-6 flex flex-wrap justify-center gap-2">
                                    {activePost.tags.map(tag => <span key={tag} className="text-sm font-bold text-white/90 bg-white/10 px-3 py-1 rounded-full border border-white/20 backdrop-blur-md shadow-lg">#{tag}</span>)}
                                </div>
                            )}
                         </div>
                    </div>
                )}
             </div>

             {/* Border Aura */}
             <div 
                className={`absolute inset-0 z-20 transition-opacity pointer-events-none translate-z-0`}
                style={{ transition: focusTransition, opacity: isFocused ? 1 : 0 }}
             >
                <div 
                    className="absolute inset-[-3px] rounded-[31px] will-change-opacity" 
                    style={{ padding: '3px', overflow: 'hidden', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' } as any}
                >
                    <div className="absolute inset-[-150%] w-[400%] h-[400%] animate-plasma-swirl opacity-100">
                         <div className="w-full h-full blur-[120px] saturate-[1.3] brightness-[1.02]" style={{ background: 'conic-gradient(from 0deg, #3b82f6, #8b5cf6, #3730a3, #0ea5e9, #3b82f6)' }} />
                    </div>
                </div>
             </div>
        </div>
      </div>

      {showHeartAnimation && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="animate-heart-beat">
            <svg width="130" height="130" viewBox="0 0 24 24" fill="#ef4444" stroke="none" style={{ filter: 'drop-shadow(0 0 15px rgba(239, 68, 68, 0.8)) drop-shadow(0 0 35px rgba(239, 68, 68, 0.4))' }}>
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
            </svg>
          </div>
        </div>
      )}

      <div className={`absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none z-40 transition-opacity duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${shouldHideOverlay ? 'opacity-0' : 'opacity-100'}`} />

      <div className={`absolute inset-0 pointer-events-none z-50 transition-opacity duration-200 ${shouldHideOverlay ? 'opacity-0' : 'opacity-100'}`}>
          {activePost.videoUrl && isPaused && (
              <div className={`absolute top-[50px] left-[13px] flex flex-col gap-1 z-[60] ${shouldHideOverlay ? 'pointer-events-none opacity-0' : 'pointer-events-auto opacity-100'} animate-slide-down origin-top`}>
                   <button onClick={(e) => { e.stopPropagation(); onTogglePause?.(); }} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/80 hover:bg-black/60 transition-colors border border-white/10"><Icons.Play size={18} className="ml-0.5" filled /></button>
                   <button onClick={toggleMute} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/80 hover:bg-black/60 transition-colors border border-white/10">{isMuted ? <Icons.VolumeX size={18} /> : <Icons.Volume2 size={18} />}</button>
              </div>
          )}
          
          <div className="absolute right-[10px] bottom-0 pb-4 flex flex-col justify-end items-center w-[44px] flex-shrink-0 pointer-events-none">
                <div className={`flex flex-col items-center relative mb-0.5 ${shouldHideOverlay ? 'pointer-events-none' : 'pointer-events-auto'}`}>
                    <button onClick={(e) => { e.stopPropagation(); onContextMenuClick?.(activePost); }} className="w-11 h-11 flex items-center justify-center text-white transition-transform active:scale-90 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"><Icons.MoreHorizontal size={20} /></button>
                </div>
                <div className={`flex flex-col items-center gap-0.5 mb-1 ${shouldHideOverlay ? 'pointer-events-none' : 'pointer-events-auto'}`}>
                    <ActionButton onClick={handleToggleLike} active={liked} color="red" disabled={shouldHideOverlay}><Icons.Heart filled={liked} size={22} /></ActionButton>
                    <span className="text-[10px] font-bold leading-none text-white pt-0.5 drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.9)]">{likesCount || 0}</span>
                </div>
                {!isStoryMode && (
                    <div className={`flex flex-col items-center gap-0.5 mb-1 ${shouldHideOverlay ? 'pointer-events-none' : 'pointer-events-auto'}`}>
                        <ActionButton onClick={() => onCommentClick(activePost)} disabled={shouldHideOverlay}><Icons.MessageCircle size={20} /></ActionButton>
                        <span className="text-[10px] font-bold leading-none text-white pt-0.5 drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.9)]">{activePost.commentsCount || 0}</span>
                    </div>
                )}
                <div className={`flex flex-col items-center gap-0.5 mb-1 ${shouldHideOverlay ? 'pointer-events-none' : 'pointer-events-auto'}`}>
                    <ActionButton onClick={handleToggleRepost} active={reposted} color="green" disabled={shouldHideOverlay}><Icons.Repeat size={20} className={reposted ? "text-emerald-400" : ""} /></ActionButton>
                    <span className="text-[10px] font-bold leading-none text-white pt-0.5 drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.9)]">{repostsCount || 0}</span>
                </div>
                <div className={`flex flex-col items-center gap-1 ${shouldHideOverlay ? 'pointer-events-none' : 'pointer-events-auto'}`}>
                    <ActionButton onClick={() => onShareClick(activePost)} disabled={shouldHideOverlay}><Icons.Share2 size={19} /></ActionButton>
                </div>
          </div>
          <div className={`absolute bottom-0 right-20 left-[13px] pb-4 flex flex-col justify-end items-start transition-all duration-300 pointer-events-none`}>
             <div className={`flex items-center space-x-3 mb-2 ${shouldHideOverlay ? 'pointer-events-none' : 'pointer-events-auto'}`}>
                <img src={activePost.author.avatarUrl} className="w-9 h-9 rounded-full border border-white/20 shadow-lg object-cover bg-black cursor-pointer" alt="User" onClick={(e) => { e.stopPropagation(); onUserClick?.(activePost.author); }} />
                <div onClick={(e) => { e.stopPropagation(); onUserClick?.(activePost.author); }} className="cursor-pointer flex flex-col items-start">
                    <UserHandle handle={activePost.author.handle} variant="content" timestamp={activePost.createdAt} />
                    {(isRepost || isQuote) && (
                        <div className="flex items-center gap-1 mt-0.5 ml-1 text-white/80 drop-shadow-md">
                            <Icons.CornerDownRight size={10} className="stroke-[3]" />
                            <span className="text-[10px] font-bold leading-none tracking-wide">{isQuote ? `Quoting @${quotedHandle?.split('.')[0]}` : `Reposted by @${reposterHandle?.split('.')[0]}`}</span>
                        </div>
                    )}
                </div>
             </div>
             
             {/* Secondary Text Bubble (Original Quote Content if applicable) */}
             {secondaryText && (
                 <div className={`bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/10 max-w-[90%] mb-2 ${shouldHideOverlay ? 'pointer-events-none' : 'pointer-events-auto'}`}>
                     <p className="text-[12px] text-white font-medium line-clamp-3">{secondaryText}</p>
                 </div>
             )}

             <div className={`w-full text-white pr-2 ${shouldHideOverlay ? 'pointer-events-none' : 'pointer-events-auto'}`}>
                <div className={`text-[12.5px] leading-normal transition-all duration-300 font-normal drop-shadow-[0_2px_4px_rgba(0,0,0,1)] ${isExpanded ? '' : 'line-clamp-3'}`} onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}>
                    {linkifyText(primaryText, handleInTextHandleClick, activePost.facets, handleInTextTagClick)}
                    {activePost.tags.map(tag => <span key={tag} className="font-medium text-white/80 ml-1.5">#{tag}</span>)}
                </div>
                
                {/* Standard Quote Card (if NOT using secondary bubble, e.g. text-only quote card inside text-only post) */}
                {activePost.quotedPost && !secondaryText && !activePost.videoUrl && (
                    <div className="mt-2 mb-1 bg-white/10 backdrop-blur-md rounded-lg p-2 border border-white/10 flex items-center gap-2 max-w-[80%] cursor-pointer active:scale-95 transition-transform" onClick={(e) => { e.stopPropagation(); onQuoteClick?.(activePost.quotedPost!); }}>
                        {activePost.quotedPost.imageUrl ? (
                            <img src={activePost.quotedPost.imageUrl} className="w-8 h-8 rounded-md object-cover bg-black" />
                        ) : (
                            <div className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center"><Icons.MessageSquare size={14} /></div>
                        )}
                        <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-bold text-white truncate">@{activePost.quotedPost.author.handle.split('.')[0]}</div>
                            <div className="text-[10px] text-gray-300 truncate">{activePost.quotedPost.text}</div>
                        </div>
                    </div>
                )}
             </div>
             {!isStoryMode && !isTextOnly && (
                <div className={`flex items-center space-x-2 bg-white/5 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/5 mt-2 ${shouldHideOverlay ? 'pointer-events-none' : 'pointer-events-auto'}`}>
                    <Icons.Music size={10} className="text-white" />
                    <div className="text-[10px] font-medium text-white scrolling-text truncate max-w-[150px]">Original Sound • {activePost.author.displayName}</div>
                </div>
             )}
          </div>
      </div>
      
      {!isStoryMode && activePost.videoUrl && (
        <div ref={progressContainerRef} className={`progress-bar-container absolute bottom-[1px] left-[13px] right-[13px] h-3 flex items-end cursor-pointer z-[60] touch-none group/bar transition-all duration-200 opacity-100 pointer-events-auto ${isScrubbing ? 'h-6' : 'hover:h-4'}`} onPointerDown={handleScrubStart}>
          <div className={`w-full bg-white/20 backdrop-blur-md overflow-hidden relative drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] transition-all duration-200 ${isScrubbing ? 'h-2' : 'h-1 group-hover/bar:h-1.5'}`}>
            <div className="h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] relative" style={{ width: `${videoProgress}%` }}>
                <div className={`absolute right-0 top-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)] scale-0 transition-transform duration-200 ${isScrubbing ? 'scale-100' : 'group-hover/bar:scale-75'}`} />
            </div>
          </div>
        </div>
      )}

      {isScrubbing && !isStoryMode && videoRef.current && (
          <div 
            className="absolute bottom-[50px] pointer-events-none z-[100]"
            style={{ left: `${scrubTooltipX}px`, transform: 'translateX(-50%)' }}
          >
              <div className="bg-black/90 backdrop-blur-xl px-5 py-2.5 rounded-full border border-white/10 shadow-[0_12px_48px_rgba(0,0,0,0.9)] flex items-center justify-center gap-2 min-w-[120px] animate-slide-up origin-bottom">
                  <span className="text-[16px] font-bold text-white tabular-nums font-mono tracking-tighter">{Math.floor(videoRef.current.currentTime / 60)}:{Math.floor(videoRef.current.currentTime % 60).toString().padStart(2, '0')}</span>
                  <span className="text-white/20 text-[16px] font-mono">/</span>
                  <span className="text-[16px] font-bold text-white/40 tabular-nums font-mono tracking-tighter">{Math.floor(videoRef.current.duration / 60)}:{Math.floor(videoRef.current.duration % 60).toString().padStart(2, '0')}</span>
              </div>
          </div>
      )}

      {shouldRenderRepostModal && (
            <div className={`absolute inset-0 z-[100] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center cursor-default transition-opacity duration-200 ease-out touch-pan-x ${isRepostModalVisible ? 'opacity-100' : 'opacity-0'}`} onClick={(e) => { e.stopPropagation(); setShowRepostConfirmation(false); }}>
                <div className={`bg-zinc-900/85 backdrop-blur-3xl border border-white/10 rounded-3xl p-5 w-[280px] shadow-2xl flex flex-col transition-all duration-200 ease-[cubic-bezier(0.18,0.89,0.32,1.28)] ${isRepostModalVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-2'}`} onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 border border-green-500/30 shadow-[0_0_15px_rgba(74,222,128,0.2)] flex-shrink-0"><Icons.Repeat size={24} /></div>
                        <div className="flex flex-col items-start min-w-0"><h3 className="text-base font-bold text-white text-left">Repost or Quote</h3><p className="text-gray-400 text-left text-xs leading-relaxed">Share this with your followers</p></div>
                    </div>
                    <div className="flex flex-col gap-2 w-full">
                        <button onClick={(e) => { e.stopPropagation(); confirmRepost(); }} className="w-full py-3 rounded-xl bg-green-500 text-black font-bold text-xs hover:bg-green-400 transition-colors shadow-[0_0_20px_rgba(34,197,94,0.4)] flex items-center justify-center gap-2"><Icons.Repeat size={16} /> Repost</button>
                        <button onClick={(e) => { e.stopPropagation(); handleQuote(); }} className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 transition-colors shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2"><Icons.Quote size={16} fill="currentColor" /> Quote Post</button>
                        <button onClick={(e) => { e.stopPropagation(); setShowRepostConfirmation(false); }} className="w-full py-3 rounded-xl bg-white/5 text-white font-bold text-xs hover:bg-white/10 transition-colors mt-1">Cancel</button>
                    </div>
                </div>
            </div>
      )}
    </div>
  );
};

export default React.memo(FeedItem);
