
// ... imports ...
import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../constants';
import { User } from '../types';
import { muteUser, blockUser, followUser, muteThread, reportPost } from '../services/atp';

interface ProfileContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  commentText?: string;
  commentUri?: string;
  commentId?: string; 
}

const QuickActionButton: React.FC<{ 
    icon: any, 
    label: string, 
    onClick?: () => void 
}> = ({ icon: Icon, label, onClick }) => (
    <button 
        onClick={onClick}
        className="flex flex-col items-center justify-center gap-1 bg-white/5 hover:bg-white/10 active:scale-95 transition-all rounded-xl p-2 h-[66px] border border-white/5"
    >
        <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-white/90">
            {Icon && <Icon size={15} />}
        </div>
        <span className="text-[9.5px] font-bold text-zinc-400 leading-tight text-center w-full px-1">{label}</span>
    </button>
);

const ProfileActionItem: React.FC<{ 
    icon?: any, 
    label: React.ReactNode, 
    onClick?: () => void, 
    subLabel?: string, 
    danger?: boolean 
}> = ({ icon: Icon, label, onClick, subLabel, danger }) => (
    <button 
        onClick={onClick}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/10 transition-all group border-b border-white/5 last:border-0 active:scale-[0.99]"
    >
        <div className="flex items-center gap-3 min-w-0">
            {Icon && <Icon size={16} className={`flex-shrink-0 transition-colors ${danger ? 'text-red-500/70 group-hover:text-red-500' : 'text-zinc-500 group-hover:text-white'}`} />}
            <div className="text-left min-w-0">
                <div className={`text-[12.5px] font-bold transition-colors truncate ${danger ? 'text-red-500' : 'text-zinc-200 group-hover:text-white'}`}>
                    {label}
                </div>
                {subLabel && <div className="text-[9.5px] text-zinc-500 font-medium mt-0.5 truncate max-w-[200px]">{subLabel}</div>}
            </div>
        </div>
        <Icons.ChevronRight size={12} className={`opacity-20 group-hover:opacity-100 transition-all ${danger ? 'text-red-500' : 'text-white'}`} />
    </button>
);

const ProfileContextMenu: React.FC<ProfileContextMenuProps> = ({ isOpen, onClose, user, commentText, commentUri, commentId }) => {
  const [isRendered, setIsRendered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const drawerRef = useRef(null);
  const startYRef = useRef(0);
  
  const isCommentMode = !!commentUri;

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
      timeout = setTimeout(() => {
          setIsRendered(false);
          setToast(null);
      }, 400); // 400ms
    }
    return () => clearTimeout(timeout);
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
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

  const showFeedback = (msg: string) => {
      setToast(msg);
      setTimeout(onClose, 1200);
  };

  if (!isRendered) return null;

  // ... (action handlers same) ...
  const handleCopyText = () => {
      if (commentText) {
          navigator.clipboard.writeText(commentText);
          showFeedback("Copied to clipboard");
      }
  };

  const handleCopyLink = () => {
      const link = isCommentMode ? commentUri : `https://bsky.app/profile/${user?.handle}`;
      if (link) {
          navigator.clipboard.writeText(link);
          showFeedback("Link copied");
      }
  };

  const handleTranslate = () => {
      if (commentText) {
          window.open(`https://translate.google.com/?sl=auto&tl=en&text=${encodeURIComponent(commentText)}&op=translate`, '_blank');
      }
      onClose();
  };

  const handleMuteAction = async () => {
      if (user?.id) {
          await muteUser(user.id);
          showFeedback(`${user.handle} muted`);
      }
  };

  const handleBlockAction = async () => {
      if (user?.id) {
          await blockUser(user.id);
          showFeedback(`${user.handle} blocked`);
      }
  };

  const handleMuteThreadAction = async () => {
      if (commentUri) {
          await muteThread(commentUri);
          showFeedback("Thread muted");
      }
  };

  const handleReportAction = async () => {
      if (isCommentMode && commentUri) {
          await reportPost(commentUri, "", "com.atproto.moderation.defs#reasonSpam");
          showFeedback("Report submitted");
      } else if (user?.id) {
          showFeedback("Account reported");
      }
  };

  const handleSearchPosts = () => {
      if (user?.handle) {
          showFeedback(`Searching from @${user.handle.split('.')[0]}`);
      }
  };

  const cleanHandle = user?.handle.replace('@', '') || 'account';

  return (
    <div className="fixed inset-0 z-[930] flex items-end justify-center pointer-events-none">
       <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity duration-[400ms] ${isAnimating ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
       
       {toast && (
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-black font-black text-xs px-6 py-3 rounded-full shadow-2xl z-[1000] animate-heart-beat border border-white/20">
               {toast}
           </div>
       )}

       <div 
         ref={drawerRef}
         className={`w-full max-w-md bg-[#0a0a0a]/80 backdrop-blur-3xl saturate-150 rounded-t-[35px] pointer-events-auto border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.6)] transform transition-transform duration-[400ms] will-change-transform cubic-bezier(0.32, 0.72, 0, 1) ${isAnimating ? 'translate-y-0' : 'translate-y-full'} flex flex-col max-h-[90vh]`}
         onTouchStart={handleTouchStart}
         onTouchMove={handleTouchMove}
         onTouchEnd={handleTouchEnd}
       >
           <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-2 pointer-events-none flex-shrink-0" />
           
           <div className="overflow-y-auto no-scrollbar px-4 pb-10 space-y-2 pt-1">
                
                {isCommentMode ? (
                    <>
                        <div className="grid grid-cols-3 gap-1.5">
                            <QuickActionButton icon={Icons.Translate} label="Translate" onClick={handleTranslate} />
                            <QuickActionButton icon={Icons.Clipboard} label="Copy text" onClick={handleCopyText} />
                            <QuickActionButton icon={Icons.Link} label="Copy link" onClick={handleCopyLink} />
                        </div>

                        <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                            <ProfileActionItem icon={Icons.BellOff} label="Mute thread" onClick={handleMuteThreadAction} />
                            <ProfileActionItem icon={Icons.Filter} label="Mute words & tags" onClick={() => showFeedback("Filters opened")} />
                            <ProfileActionItem icon={Icons.EyeOff} label="Hide reply for me" onClick={() => showFeedback("Hidden")} />
                        </div>

                        <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                            <ProfileActionItem icon={Icons.UserPlus} label={`Follow @${cleanHandle}`} onClick={async () => { await followUser(user!.id); showFeedback(`Following ${user?.handle}`); }} />
                            <ProfileActionItem icon={Icons.ListPlus} label="Add/remove from List" onClick={() => showFeedback("Lists updated")} />
                        </div>

                        <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                            <ProfileActionItem icon={Icons.MicOff} label={`Mute @${cleanHandle}`} onClick={handleMuteAction} />
                            <ProfileActionItem icon={Icons.VolumeX} label="Mute conversation" onClick={() => showFeedback("Muted")} />
                            <ProfileActionItem icon={Icons.UserX} label={`Block @${cleanHandle}`} danger onClick={handleBlockAction} />
                            <ProfileActionItem icon={Icons.Flag || Icons.AlertTriangle} label="Report post" danger onClick={handleReportAction} />
                        </div>
                    </>
                ) : (
                    <>
                        <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                            <ProfileActionItem icon={Icons.Link} label="Copy link to profile" onClick={handleCopyLink} />
                            <ProfileActionItem icon={Icons.Search} label="Search posts" onClick={handleSearchPosts} />
                        </div>

                        <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                            <ProfileActionItem icon={Icons.Sparkles} label="Add to starter packs" onClick={() => showFeedback("Opening starter packs...")} />
                            <ProfileActionItem icon={Icons.ListPlus} label="Add/remove from Lists" onClick={() => showFeedback("Lists updated")} />
                        </div>

                        <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                            <ProfileActionItem icon={Icons.MicOff} label="Mute account" onClick={handleMuteAction} />
                            <ProfileActionItem icon={Icons.UserX} label="Block account" danger onClick={handleBlockAction} />
                            <ProfileActionItem icon={Icons.Flag} label="Report account" danger onClick={handleReportAction} />
                        </div>
                    </>
                )}
           </div>
       </div>
    </div>
  );
};

export default ProfileContextMenu;
