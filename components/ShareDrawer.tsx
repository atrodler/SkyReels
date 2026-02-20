
// ... imports ...
import React, { useRef, useState, useEffect } from 'react';
import { Icons, MOCK_USERS } from '../constants';
import { Post, User } from '../types';
import UserHandle from './UserHandle';

interface ShareDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post | null;
  profile?: User;
}

// ... helper components (ContactItem, AppItem, ShareActionButton) ...
const ContactItem: React.FC<{ user: any, onClick?: () => void }> = ({ user, onClick }) => (
    <div className="flex flex-col items-center gap-2 cursor-pointer group active:scale-95 transition-transform flex-shrink-0 w-[64px]" onClick={onClick}>
        <div className="relative w-14 h-14">
            <img src={user.avatarUrl} className="w-full h-full rounded-full object-cover border border-white/10 group-hover:border-white/40 transition-colors shadow-lg" alt={user.displayName} />
            <div className="absolute inset-0 rounded-full shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]"></div>
            {/* Online Indicator Mock */}
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#121212] rounded-full"></div>
        </div>
        <span className="text-[10px] text-gray-400 font-medium truncate w-full text-center leading-tight group-hover:text-white transition-colors">
            {user.displayName.split(' ')[0]}
        </span>
    </div>
);

const AppItem: React.FC<{ icon: any, label: string, colorClass: string, onClick?: () => void }> = ({ icon: Icon, label, colorClass, onClick }) => (
    <div className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition-transform" onClick={onClick}>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg border border-white/5 group-hover:border-white/20 transition-colors ${colorClass}`}>
            {Icon && <Icon size={22} className="text-white drop-shadow-md" />}
        </div>
        <span className="text-[10px] text-gray-400 font-medium truncate w-full text-center leading-tight group-hover:text-white transition-colors">
            {label}
        </span>
    </div>
);

const ShareActionButton: React.FC<{ 
    icon: any, 
    label: string, 
    subLabel?: string, 
    onClick?: () => void, 
    variant?: 'primary' | 'secondary' | 'glass' 
}> = ({ icon: Icon, label, subLabel, onClick, variant = 'glass' }) => {
    
    let bgClass = 'bg-white/5 border-white/5 hover:bg-white/10 text-white';
    let iconBgClass = 'bg-white/10 text-white';
    let subLabelClass = 'text-gray-500';

    if (variant === 'primary') {
        bgClass = 'bg-white text-black border-white hover:bg-gray-200';
        iconBgClass = 'bg-black/10 text-black';
        subLabelClass = 'text-black/60';
    } else if (variant === 'secondary') {
        bgClass = 'bg-blue-600/20 border-blue-500/30 text-blue-400 hover:bg-blue-600/30';
        iconBgClass = 'bg-blue-500/20 text-blue-400';
        subLabelClass = 'text-blue-400/60';
    }

    return (
        <button 
            onClick={onClick}
            className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all active:scale-95 group text-left ${bgClass}`}
        >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBgClass}`}>
                {Icon && <Icon size={20} strokeWidth={2.5} />}
            </div>
            <div className="flex flex-col">
                <span className="text-sm font-bold leading-none">{label}</span>
                {subLabel && <span className={`text-[10px] mt-1 font-medium ${subLabelClass}`}>{subLabel}</span>}
            </div>
        </button>
    );
};

const ShareDrawer: React.FC<ShareDrawerProps> = ({ isOpen, onClose, post, profile }) => {
  const [isRendered, setIsRendered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Drag State
  const [isDragging, setIsDragging] = useState(false);
  const drawerRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const startYRef = useRef(0);
  
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    
    if (isOpen) {
      setIsRendered(true);
      requestAnimationFrame(() => {
          requestAnimationFrame(() => {
              setIsAnimating(true);
          });
      });
    } else {
      setIsAnimating(false);
      timeout = setTimeout(() => setIsRendered(false), 400); // 400ms
    }
    
    return () => clearTimeout(timeout);
  }, [isOpen]);

  // Drag Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
      const scrollEl = scrollContainerRef.current as any;
      if (scrollEl && scrollEl.scrollTop > 0) return;
      setIsDragging(true);
      startYRef.current = e.touches[0].clientY;
      const drawerEl = drawerRef.current as any;
      if (drawerEl) drawerEl.style.transition = 'none';
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      const drawerEl = drawerRef.current as any;
      if (!isDragging || !drawerEl) return;
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startYRef.current;
      if (deltaY > 0) drawerEl.style.transform = `translateY(${deltaY}px)`;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
      const drawerEl = drawerRef.current as any;
      if (!isDragging || !drawerEl) return;
      setIsDragging(false);
      const currentY = e.changedTouches[0].clientY;
      const deltaY = currentY - startYRef.current;
      
      drawerEl.style.transition = 'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)';
      drawerEl.style.transform = ''; 

      if (deltaY > 100) onClose();
  };

  const handleSystemShare = async () => {
      if (navigator.share) {
          try {
              await navigator.share({
                  title: 'SkyReels',
                  text: 'Check out this post!',
                  url: window.location.href
              });
              onClose();
          } catch (err) {
              console.log('Share canceled');
          }
      } else {
          // Fallback
          onClose();
      }
  };

  if (!isRendered) return null;

  const contacts = MOCK_USERS.filter(u => u.displayName.toLowerCase().includes(searchQuery.toLowerCase()));

  // Render Logic based on context (Post vs Profile)
  const isProfile = !!profile;
  const title = isProfile ? 'Share Profile' : 'Share Post';

  return (
    <div className="absolute inset-0 z-[920] flex items-end justify-center pointer-events-none">
       {/* Backdrop */}
       <div 
         className={`absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity duration-[400ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${isAnimating ? 'opacity-100' : 'opacity-0'}`} 
         onClick={onClose}
       />

       {/* Drawer */}
       <div 
         ref={drawerRef}
         className={`w-full max-w-md bg-[#0a0a0a]/60 backdrop-blur-3xl saturate-150 rounded-t-[35px] pointer-events-auto border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.6)] transform transition-transform duration-[400ms] will-change-transform cubic-bezier(0.32, 0.72, 0, 1) ${isAnimating ? 'translate-y-0' : 'translate-y-full'} max-h-[90vh] flex flex-col`}
         onTouchStart={handleTouchStart}
         onTouchMove={handleTouchMove}
         onTouchEnd={handleTouchEnd}
       >
           {/* ... Drawer Content ... */}
           {/* Handle */}
           <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-2 pointer-events-none flex-shrink-0" />
           
           <div className="text-center pb-2 text-[11px] font-bold text-gray-500 uppercase tracking-widest">{title}</div>

           <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto no-scrollbar px-5 pb-8 space-y-6"
           >
                {/* --- PROFILE SHARE MODE --- */}
                {isProfile ? (
                    <div className="flex flex-col gap-6 pt-2">
                        {/* 1. Identity Pass Card */}
                        <div className="bg-[#121212] border border-white/10 rounded-3xl p-5 flex flex-col items-center shadow-2xl relative overflow-hidden group">
                            {/* Card Glow */}
                            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-b from-blue-500/10 via-transparent to-transparent opacity-50 pointer-events-none" />
                            
                            <div className="relative z-10 flex flex-col items-center">
                                <img src={profile.avatarUrl} className="w-16 h-16 rounded-full border-4 border-[#121212] shadow-lg mb-3" />
                                <h3 className="text-xl font-black text-white">{profile.displayName}</h3>
                                <div className="scale-90 opacity-80 mt-1 mb-6">
                                    <UserHandle handle={profile.handle} />
                                </div>
                                
                                {/* Simulated QR Code */}
                                <div className="bg-white p-3 rounded-2xl shadow-inner">
                                    <div className="w-32 h-32 flex items-center justify-center opacity-90">
                                        {Icons.QrCode && <Icons.QrCode size={100} className="text-black" />}
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-4">Scan to Follow</p>
                            </div>
                        </div>

                        {/* 2. Share to Apps Grid (External) */}
                        <div>
                            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 pl-1">Share via</h3>
                            <div className="grid grid-cols-4 gap-4 px-1">
                                <AppItem icon={Icons.MessageCircle} label="Messages" colorClass="bg-green-600" onClick={onClose} />
                                <AppItem icon={Icons.AtSign} label="X" colorClass="bg-black" onClick={onClose} />
                                <AppItem icon={Icons.Zap} label="Messenger" colorClass="bg-blue-600" onClick={onClose} />
                                <AppItem icon={Icons.Share2} label="System" colorClass="bg-gray-700" onClick={onClose} />
                            </div>
                        </div>

                        {/* 3. Send to Contacts (Internal) */}
                        <div>
                            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 pl-1">Send to</h3>
                            <div className="grid grid-cols-4 gap-4 px-1">
                                    {MOCK_USERS.slice(0, 4).map((user, i) => (
                                        <ContactItem key={i} user={user} onClick={onClose} />
                                    ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* --- POST SHARE MODE (Redesigned) --- */
                    <>
                        {/* 0. Context Preview Card */}
                        {post && (
                            <div className="flex gap-3 bg-[#1a1a1a] rounded-xl p-2 border border-white/5 items-center mb-1">
                                <img src={post.imageUrl} className="w-10 h-10 rounded-lg object-cover bg-gray-800" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-[10px] font-bold text-gray-400">Sharing post by</div>
                                    <div className="text-xs font-bold text-white truncate">{post.author.displayName}</div>
                                </div>
                            </div>
                        )}

                        {/* 1. Search */}
                        <div className="relative group">
                            <Icons.Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors" />
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search for people..." 
                                className="w-full bg-[#1a1a1a] border border-white/5 rounded-2xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/20 focus:bg-[#202020] transition-all font-medium"
                            />
                        </div>

                        {/* 2. Frequent Contacts Rail (Horizontal) */}
                        <div>
                            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2 pt-1 px-1">
                                {/* Create Group Button */}
                                <div className="flex flex-col items-center gap-2 cursor-pointer group active:scale-95 transition-transform flex-shrink-0 w-[64px]">
                                    <div className="w-14 h-14 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center bg-white/5 group-hover:bg-white/10 group-hover:border-white/40 transition-colors">
                                        <Icons.Plus size={24} className="text-gray-400 group-hover:text-white" />
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-medium text-center leading-tight">New Group</span>
                                </div>
                                
                                {contacts.map((user, i) => (
                                    <ContactItem key={i} user={user} onClick={onClose} />
                                ))}
                            </div>
                        </div>

                        <div className="h-[1px] w-full bg-white/5 my-1"></div>

                        {/* 3. Action Grid (Bento Style) */}
                        <div className="flex flex-col gap-3">
                            <div className="grid grid-cols-2 gap-3">
                                {/* Primary Network Actions */}
                                <ShareActionButton icon={Icons.RefreshCw} label="Repost" subLabel="Share to feed" onClick={onClose} variant="primary" />
                                <ShareActionButton icon={Icons.Quote} label="Quote" subLabel="Add thought" onClick={onClose} variant="glass" />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                {/* Utility Actions */}
                                <ShareActionButton icon={Icons.Link} label="Copy Link" onClick={onClose} variant="glass" />
                                <ShareActionButton icon={Icons.Share} label="Share via..." subLabel="More options" onClick={handleSystemShare} variant="secondary" />
                            </div>
                        </div>
                   </>
                )}

           </div>
       </div>
    </div>
  );
};

export default ShareDrawer;
