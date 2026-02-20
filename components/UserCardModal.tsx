
// ... imports ...
import React, { useEffect, useState, useRef } from 'react';
import { Icons, PUBLIC_SERVERS, linkifyText } from '../constants';
import { User } from '../types';
import UserHandle from './UserHandle';
import { followUser, unfollowUser, getProfile } from '../services/atp';

interface UserCardModalProps {
  user: User | null;
  onClose: () => void;
  onOpenProfileMenu?: (user: User) => void;
  onShareProfile?: (user: User) => void;
  onOpenIdentityDetails?: (user: User) => void;
  onNavigateToProfile?: (user: User) => void;
  onMessageUser?: (user: User) => void;
  onUserClick?: (user: User) => void;
}

const UserCardModal: React.FC<UserCardModalProps> = ({ user, onClose, onOpenProfileMenu, onShareProfile, onOpenIdentityDetails, onNavigateToProfile, onMessageUser, onUserClick }) => {
  const [internalUser, setInternalUser] = useState<User | null>(null);
  const [isRendered, setIsRendered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [copiedDid, setCopiedDid] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Local Stats & Follow State
  const [isFollowing, setIsFollowing] = useState(false);
  const [followUri, setFollowUri] = useState<string | undefined>(undefined);
  const [followersCount, setFollowersCount] = useState(0);
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  const drawerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const drawerMetricsRef = useRef({ top: 0, height: 0 });
  const [dragOffset, setDragOffset] = useState(0);

  // Constants for Animation
  const ANIMATION_DURATION = 500; 
  const ANIMATION_EASING = 'cubic-bezier(0.2, 0.8, 0.2, 1)'; 

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    
    if (user) {
      setInternalUser(user); 
      setIsRendered(true);
      setIsNavigating(false);
      setIsFollowing(!!user.viewer?.following);
      setFollowUri(user.viewer?.following);
      setFollowersCount(user.followers);
      setIsBioExpanded(false);
      setDragOffset(0);
      
      requestAnimationFrame(() => {
          requestAnimationFrame(() => {
              setIsAnimating(true);
          });
      });
    } else {
      // Exit Sequence
      if (isNavigating) {
          timeout = setTimeout(() => setIsRendered(false), ANIMATION_DURATION + 100);
      } else {
          setIsAnimating(false);
          timeout = setTimeout(() => setIsRendered(false), ANIMATION_DURATION); // Match animation
      }
    }
    return () => clearTimeout(timeout);
  }, [user]); 

  // ... (rest of component remains same) ...
  const handleTouchStart = (e: React.TouchEvent) => {
      const scrollEl = scrollContainerRef.current;
      if (scrollEl && scrollEl.scrollTop > 0) return;

      setIsDragging(true);
      startYRef.current = e.touches[0].clientY;
      
      if (drawerRef.current) {
          drawerRef.current.style.transition = 'none';
          const rect = drawerRef.current.getBoundingClientRect();
          drawerMetricsRef.current = { top: rect.top, height: rect.height };
      }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      if (!isDragging || isNavigating) return;
      const currentY = e.touches[0].clientY;
      let deltaY = currentY - startYRef.current;
      const limit = drawerMetricsRef.current.top; 
      
      if (deltaY < 0) { 
          if (Math.abs(deltaY) > limit) {
              deltaY = -limit - ((Math.abs(deltaY) - limit) * 0.25);
          }
      }
      setDragOffset(deltaY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
      if (!isDragging || isNavigating) return;
      setIsDragging(false);
      
      const limit = drawerMetricsRef.current.top; 
      
      if (dragOffset > 120) {
          if (drawerRef.current) {
             drawerRef.current.style.transition = 'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1), height 0.4s cubic-bezier(0.32, 0.72, 0, 1), border-radius 0.4s ease';
          }
          onClose();
      } else if (dragOffset < -60) {
          if (drawerRef.current) {
             drawerRef.current.style.transition = `all ${ANIMATION_DURATION}ms ${ANIMATION_EASING}`;
          }
          handleExpandToProfile();
      } else {
          if (drawerRef.current) {
             drawerRef.current.style.transition = 'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1), height 0.4s cubic-bezier(0.32, 0.72, 0, 1), border-radius 0.4s ease';
          }
          setDragOffset(0);
      }
  };

  const handleExpandToProfile = () => {
      if (!internalUser) return;
      setIsNavigating(true);
      setTimeout(() => {
          onNavigateToProfile?.(internalUser);
      }, ANIMATION_DURATION - 50); 
  };

  const handleFollowToggle = async () => {
    if (!internalUser) return;
    const originalFollowing = isFollowing;
    const originalUri = followUri;
    const originalCount = followersCount;
    setIsFollowing(!originalFollowing);
    setFollowersCount(originalFollowing ? originalCount - 1 : originalCount + 1);
    try {
        if (originalFollowing && originalUri) {
            await unfollowUser(originalUri);
            setFollowUri(undefined);
        } else {
            const res = await followUser(internalUser.id);
            if (res && res.uri) setFollowUri(res.uri);
        }
    } catch (e) {
        setIsFollowing(originalFollowing);
        setFollowUri(originalUri);
        setFollowersCount(originalCount);
    }
  };

  const handleBioHandleClick = async (handle: string) => {
      if (onUserClick) {
          const profile = await getProfile(handle);
          if (profile) onUserClick(profile);
      }
  };

  if (!isRendered || !internalUser) return null;

  const cleanHandle = internalUser.handle.replace('@', '');
  const handleParts = cleanHandle.split('.');
  const hostServer = handleParts.length > 1 ? handleParts.slice(-2).join('.') : 'bsky.social';
  const isCustomDomain = !PUBLIC_SERVERS.includes(hostServer);
  const pdsHost = isCustomDomain ? cleanHandle : hostServer;
  const didDisplay = `${internalUser.id.substring(0, 15)}...${internalUser.id.substring(internalUser.id.length - 4)}`; 
  const fullDid = internalUser.id;

  const handleCopyDid = () => {
      navigator.clipboard.writeText(fullDid);
      setCopiedDid(true);
      setTimeout(() => setCopiedDid(false), 2000);
  };

  const currentTransform = isNavigating 
      ? `translate3d(0, 0, 0)` 
      : `translate3d(0, ${isAnimating ? 0 : 100}%, 0) translateY(${dragOffset}px)`;

  const transitionString = isDragging ? 'none' : `transform ${ANIMATION_DURATION}ms ${ANIMATION_EASING}, height ${ANIMATION_DURATION}ms ${ANIMATION_EASING}, border-radius ${ANIMATION_DURATION}ms ${ANIMATION_EASING}, background-color 300ms ease`;

  // --- LAYOUT MORPH CONSTANTS ---
  const AVATAR_SIZE_RESTING = 64;
  const AVATAR_SIZE_NAV = 80; // Matches ProfileTab
  const GAP_SIZE = 16; // Matches 'gap-4' (16px) in ProfileTab
  
  // Resting: Name Left, Avatar Right, Stats Bottom
  const RESTING_CONTAINER_HEIGHT = 146; 
  const RESTING_STATS_TOP = 76; // Below Name/Avatar row
  
  // Navigating: Stats Left, Avatar Right (Matches ProfileTab)
  const NAV_CONTAINER_HEIGHT = 80; 
  const NAV_STATS_TOP = 11; // Vertically centered relative to 80px Avatar (80-58)/2 = 11

  const bioText = internalUser.description || "Digital creator exploring the decentralized web. 🌌 Building cool things for the future of social.";
  const shouldTruncate = bioText.length > 140; 

  return (
    <div className={`absolute inset-0 z-[900] flex items-end justify-center overflow-hidden ${isNavigating ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div 
            className={`absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity duration-300 ease-out ${isAnimating && !isNavigating ? 'opacity-100' : 'opacity-0'}`} 
            onClick={onClose} 
        />
        <div 
            ref={drawerRef} 
            className={`w-full max-w-md bg-[#0a0a0a]/95 backdrop-blur-3xl saturate-150 rounded-t-[35px] pointer-events-auto border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.6)] transform will-change-transform flex flex-col`} 
            style={{ 
                transform: currentTransform,
                height: isNavigating ? '100%' : 'auto', 
                borderRadius: isNavigating ? '0px' : '35px 35px 0 0',
                backgroundColor: isNavigating ? '#000000' : 'rgba(10, 10, 10, 0.95)',
                transition: transitionString
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* ... Content ... */}
            <div className="absolute top-[99%] left-0 right-0 h-[100vh] bg-[#0a0a0a]/90 backdrop-blur-3xl pointer-events-none -z-10" />

            {/* FAKE NAV HEADER */}
            <div 
                className={`flex items-start justify-between px-3 pt-[7px] absolute top-0 left-0 right-0 z-30 h-[52px] bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5 shadow-sm transition-all ease-out ${isNavigating ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}
                style={{ transitionDuration: `${ANIMATION_DURATION}ms` }}
            >
                <div className="flex items-center gap-1 flex-shrink-0 min-w-[40px]">
                    <button className="w-[40px] h-[40px] flex items-center justify-center rounded-full bg-black/60 backdrop-blur-3xl border border-white/20 text-white hover:bg-white/10 shadow-2xl">
                        <Icons.Menu size={20} />
                    </button>
                    <button onClick={onClose} className="w-[40px] h-[40px] flex items-center justify-center rounded-full bg-black/60 backdrop-blur-3xl border border-white/20 text-white hover:bg-white/10 shadow-2xl">
                        <Icons.ChevronLeft size={20} />
                    </button>
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center h-[40px] overflow-hidden mx-2">
                    <div className={`flex flex-col items-center justify-center transition-all duration-[600ms] delay-100 ${isNavigating ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                        <span className="text-lg font-black text-white leading-tight truncate text-center w-full">{internalUser.displayName}</span>
                    </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0 min-w-[40px]">
                    <button className={`w-[40px] h-[40px] flex items-center justify-center rounded-full bg-black/60 backdrop-blur-3xl border border-white/20 text-white shadow-2xl`}>
                        <Icons.MoreHorizontal size={20} />
                    </button>
                    <button className={`w-[40px] h-[40px] flex items-center justify-center rounded-full bg-black/60 backdrop-blur-3xl border border-white/20 text-white shadow-2xl`}>
                        <Icons.Bell size={20} />
                    </button>
                </div>
            </div>

            {/* Grab Handle */}
            <div className={`flex flex-col items-center pt-3 pb-2 flex-shrink-0 group cursor-grab active:cursor-grabbing transition-opacity duration-300 ${isNavigating ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <div className={`w-10 h-1 rounded-full transition-all duration-300 ${dragOffset < -20 ? 'bg-blue-500 scale-x-125' : 'bg-white/20'}`} />
            </div>

            <div 
                ref={scrollContainerRef} 
                className={`flex-1 px-6 pb-10 pt-2 flex flex-col gap-0 overflow-visible transition-[padding] ease-out ${isNavigating ? 'pt-[54px]' : ''}`}
                style={{ transitionDuration: `${ANIMATION_DURATION}ms` }}
            >
                {/* MORPH CONTAINER */}
                <div 
                    className="relative w-full transition-all ease-[cubic-bezier(0.2,0.8,0.2,1)]"
                    style={{
                        height: isNavigating ? `${NAV_CONTAINER_HEIGHT}px` : `${RESTING_CONTAINER_HEIGHT}px`,
                        transitionDuration: `${ANIMATION_DURATION}ms`,
                        marginBottom: isNavigating ? '6px' : '4px' // Matches gap-1.5 in ProfileTab (6px)
                    }}
                > 
                    {/* Name/Handle: Resting: Left. Navigating: Fades Out. */}
                    <div 
                        className={`absolute flex flex-col justify-center transition-all ease-[cubic-bezier(0.2,0.8,0.2,1)]`}
                        style={{
                            top: isNavigating ? '-20px' : `0px`,
                            left: 0,
                            right: `${AVATAR_SIZE_RESTING + 12}px`,
                            opacity: isNavigating ? 0 : 1,
                            transform: isNavigating ? 'translateY(-10px)' : 'translateY(0)',
                            transitionDuration: `${ANIMATION_DURATION * 0.6}ms`,
                            alignItems: 'flex-start',
                            textAlign: 'left'
                        }}
                    >
                        <h2 className="text-2xl font-black text-white leading-tight truncate tracking-tighter w-full">{internalUser.displayName}</h2>
                        <button onClick={() => onOpenIdentityDetails?.(internalUser)} className="mt-1 transform active:scale-[0.95] inline-flex items-center gap-1 cursor-pointer group hover:opacity-80 transition-opacity origin-left">
                            <UserHandle handle={internalUser.handle} /><Icons.ChevronRight size={12} className="text-white/30 group-hover:text-white/60 transition-colors" />
                        </button>
                    </div>

                    {/* Stats: Resting: Bottom Row. Navigating: Left side (Matches ProfileTab) */}
                    <div 
                        className={`absolute transition-all ease-[cubic-bezier(0.2,0.8,0.2,1)] will-change-[width,transform,top,left]`}
                        style={{
                            top: isNavigating ? `${NAV_STATS_TOP}px` : `${RESTING_STATS_TOP}px`,
                            left: 0,
                            width: isNavigating ? `calc(100% - ${AVATAR_SIZE_NAV + GAP_SIZE}px)` : '100%',
                            transitionDuration: `${ANIMATION_DURATION}ms`
                        }}
                    >
                        <div 
                            onClick={() => handleExpandToProfile()} 
                            className={`flex items-center justify-between bg-white/5 rounded-2xl p-2.5 border border-white/5 active:bg-white/10 cursor-pointer shadow-inner h-[58px]`} 
                        >
                            <div className="text-center flex-1 border-r border-white/5 last:border-0"><div className="text-base font-black text-white">{internalUser.postsCount || 0}</div><div className="text-[9px] uppercase font-bold text-gray-500">Posts</div></div>
                            <div className="text-center flex-1 border-r border-white/5 last:border-0"><div className="text-base font-black text-white">{followersCount.toLocaleString()}</div><div className="text-[9px] uppercase font-bold text-gray-500">Followers</div></div>
                            <div className="text-center flex-1"><div className="text-base font-black text-white">{internalUser.following.toLocaleString()}</div><div className="text-[9px] uppercase font-bold text-gray-500">Following</div></div>
                        </div>
                    </div>

                    {/* Avatar: Scales and stays RIGHT anchored */}
                    <div 
                        className={`absolute top-0 transition-all ease-[cubic-bezier(0.2,0.8,0.2,1)] will-change-[width,height,right]`}
                        style={{
                            width: isNavigating ? `${AVATAR_SIZE_NAV}px` : `${AVATAR_SIZE_RESTING}px`,
                            height: isNavigating ? `${AVATAR_SIZE_NAV}px` : `${AVATAR_SIZE_RESTING}px`,
                            right: 0, 
                            transitionDuration: `${ANIMATION_DURATION}ms`
                        }}
                    >
                        <div 
                            className="w-full h-full rounded-full bg-gradient-to-tr from-white/20 to-white/5 border border-white/10 shadow-xl overflow-hidden active:scale-95 transition-all cursor-pointer" 
                            style={{ padding: isNavigating ? '2px' : '2px', transitionDuration: `${ANIMATION_DURATION}ms` }}
                            onClick={() => handleExpandToProfile()}
                        >
                            <img src={internalUser.avatarUrl} className="w-full h-full rounded-full object-cover bg-black" alt={internalUser.displayName} />
                        </div>
                    </div>
                </div>

                {/* Content below (Actions, Bio, ID) */}
                <div className="flex flex-col gap-1.5"> 
                    
                    {/* Actions - Tight Spacing (gap-1.5 is 6px) */}
                    <div className="flex items-center gap-2">
                        {!internalUser.cannotMessage && (
                            <button 
                                onClick={() => onMessageUser?.(internalUser)}
                                className="h-11 w-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition-all active:scale-90 shadow-lg"
                            >
                                <Icons.MessageCircle size={20} />
                            </button>
                        )}
                        <button 
                            onClick={handleFollowToggle}
                            className={`h-11 flex-1 rounded-xl font-bold text-sm shadow-[0_0_15px_rgba(255,255,255,0.15)] hover:scale-[1.01] active:scale-95 transition-all ${isFollowing ? 'bg-white/10 text-white border border-white/20' : 'bg-white text-black'}`}
                        >
                            {isFollowing ? 'Following' : 'Follow'}
                        </button>
                        <button onClick={() => onShareProfile?.(internalUser)} className="h-11 w-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition-all active:scale-90 shadow-lg" title="Share">
                            <Icons.Share2 size={20} />
                        </button>
                        <button onClick={() => onOpenProfileMenu?.(internalUser)} className="h-11 w-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition-all active:scale-90 shadow-lg">
                            <Icons.MoreHorizontal size={20} />
                        </button>
                    </div>

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
                    
                    {/* Identity Info Box */}
                    <div className={`bg-[#0a0a0a]/40 rounded-2xl border border-white/5 flex flex-col overflow-hidden transition-opacity duration-[400ms] ${isNavigating ? 'opacity-0' : 'opacity-100'}`}>
                        <div className="p-3 flex items-center justify-between border-b border-white/5">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/5 text-gray-400`}><Icons.Server size={14} /></div>
                                <div className="min-w-0">
                                    <span className="text-[9px] uppercase font-bold text-gray-500 block">PDS Host</span>
                                    <div className="text-xs font-mono text-gray-300 truncate max-w-[150px]">{pdsHost}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-500 uppercase bg-white/5 px-2 py-1 rounded border border-white/5"><Icons.Globe size={10} /><span>Federated</span></div>
                        </div>
                        <button onClick={handleCopyDid} className="p-3 flex items-center justify-between hover:bg-white/5 transition-colors group text-left relative">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/5 text-gray-400"><Icons.Hash size={14} /></div>
                                <div className="min-w-0">
                                    <span className="text-[9px] uppercase font-bold text-gray-500 block">DID (Identity)</span>
                                    <div className="text-xs font-mono text-gray-300 truncate max-w-[200px] opacity-80">{didDisplay}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                {copiedDid ? <Icons.Check size={14} className="text-green-500"/> : <Icons.Copy size={14} className="text-gray-600 group-hover:text-white transition-colors" />}
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default UserCardModal;
