
// ... imports ...
import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../constants';
import { Post } from '../types';
import UserHandle from './UserHandle';
import { muteUser, blockUser, reportPost, muteThread } from '../services/atp';

interface ContextMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post | null;
  onPostHidden?: (postId: string) => void;
  isSaved?: boolean;
  onToggleSave?: () => void;
}

// ... helper components (QuickActionButton, FeedbackButton, ListActionItem) ...
const QuickActionButton: React.FC<{ icon: any, label: string, onClick?: () => void, active?: boolean }> = ({ icon: Icon, label, onClick, active }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center justify-center gap-1.5 hover:bg-white/10 active:scale-95 transition-all rounded-xl p-2.5 border h-20 ${active ? 'bg-blue-500/20 border-blue-500/30' : 'bg-white/5 border-white/5'}`}
    >
        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${active ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/90'}`}>
            {Icon && <Icon size={16} filled={active} />}
        </div>
        <span className={`text-[10px] font-bold leading-tight text-center w-full px-1 ${active ? 'text-blue-400' : 'text-gray-300'}`}>{label}</span>
    </button>
);

const FeedbackButton: React.FC<{ icon: any, label: string, onClick?: () => void }> = ({ icon: Icon, label, onClick }) => (
    <button 
        onClick={onClick}
        className="flex-1 flex items-center justify-center gap-2 py-2.5 hover:bg-white/5 active:bg-white/10 transition-colors"
    >
        {Icon && <Icon size={16} className="text-gray-400" />}
        <span className="text-[11px] font-bold text-gray-300 whitespace-nowrap">{label}</span>
    </button>
);

const ListActionItem: React.FC<{ icon: any, label: React.ReactNode, subLabel?: string, onClick?: () => void, danger?: boolean, active?: boolean }> = ({ icon: Icon, label, subLabel, onClick, danger, active }) => (
    <button 
        onClick={onClick}
        className="w-full flex items-center justify-between px-3.5 py-3 hover:bg-white/5 transition-colors group"
    >
        <div className="flex items-center gap-3 min-w-0 overflow-hidden w-full">
             {Icon && <Icon size={18} filled={active} className={danger ? "text-red-500 shrink-0" : active ? "text-blue-400 shrink-0" : "text-gray-400 group-hover:text-white transition-colors shrink-0"} />}
             <div className="text-left min-w-0 flex-1">
                 <div className={`text-[12px] font-bold truncate flex items-center gap-1.5 ${danger ? "text-red-500" : active ? "text-blue-400" : "text-gray-200 group-hover:text-white"}`}>
                    {label}
                 </div>
                 {subLabel && <div className="text-[10px] text-gray-500 font-medium truncate">{subLabel}</div>}
             </div>
        </div>
        <Icons.ChevronDown size={12} className={`-rotate-90 shrink-0 ml-2 ${danger ? "text-red-500/50" : active ? "text-blue-400/50" : "text-gray-700"}`} />
    </button>
);

const ContextMenuDrawer: React.FC<ContextMenuDrawerProps> = ({ isOpen, onClose, post, onPostHidden, isSaved, onToggleSave }) => {
  const [isRendered, setIsRendered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Drag State
  const [isDragging, setIsDragging] = useState(false);
  const drawerRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const startYRef = useRef<number>(0);
  
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    
    if (isOpen) {
      setIsRendered(true);
      setToastMessage(null);
      // Small delay to ensure DOM is mounted before starting animation
      requestAnimationFrame(() => {
          requestAnimationFrame(() => {
              setIsAnimating(true);
          });
      });
    } else {
      setIsAnimating(false);
      // Wait for transition (400ms) to finish before unmounting
      timeout = setTimeout(() => setIsRendered(false), 400);
    }
    
    return () => clearTimeout(timeout);
  }, [isOpen]);

  // ... (rest of drag handlers and action functions remain same) ...
  const handleTouchStart = (e: React.TouchEvent) => {
      const scrollEl = scrollContainerRef.current as any;
      if (scrollEl && scrollEl.scrollTop > 0) return;

      setIsDragging(true);
      startYRef.current = e.touches[0].clientY;
      
      const drawerEl = drawerRef.current as any;
      if (drawerEl) {
          drawerEl.style.transition = 'none';
      }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      const drawerEl = drawerRef.current as any;
      if (!isDragging || !drawerEl) return;
      
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startYRef.current;
      
      // Only allow dragging DOWN
      if (deltaY > 0) {
          drawerEl.style.transform = `translateY(${deltaY}px)`;
      }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
      const drawerEl = drawerRef.current as any;
      if (!isDragging || !drawerEl) return;
      setIsDragging(false);
      
      const currentY = e.changedTouches[0].clientY;
      const deltaY = currentY - startYRef.current;
      
      // Restore transition
      drawerEl.style.transition = 'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)';
      drawerEl.style.transform = ''; 

      if (deltaY > 100) {
          onClose();
      }
  };

  const showToast = (message: string) => {
      setToastMessage(message);
      setTimeout(() => {
          setToastMessage(null);
          onClose();
      }, 1500);
  };

  const handleTranslate = () => {
      if (post?.text) {
          window.open(`https://translate.google.com/?sl=auto&tl=en&text=${encodeURIComponent(post.text)}&op=translate`, '_blank');
          onClose();
      }
  };

  const handleCopy = () => {
      if (post?.text) {
          navigator.clipboard.writeText(post.text);
          showToast('Text copied to clipboard');
      }
  };

  const handleHide = () => {
      if (post && onPostHidden) {
          onPostHidden(post.id);
          showToast('Post hidden');
      } else {
          onClose();
      }
  };

  const handleToggleSaveAction = () => {
      if (onToggleSave) {
          onToggleSave();
          showToast(isSaved ? 'Removed from saved' : 'Saved to library');
      }
  };

  const handleFeedback = (type: 'more' | 'less') => {
      if (type === 'less' && post && onPostHidden) {
          onPostHidden(post.id);
          showToast('Got it. Showing less like this.');
      } else {
          showToast('Thanks! We\'ll show more like this.');
      }
  };

  const handleMuteThreadAction = async () => {
      if (post && onPostHidden) {
          await muteThread(post.uri);
          onPostHidden(post.id);
          showToast('Thread muted');
      }
  };

  const handleMuteWords = () => {
      // This usually opens a modal, simulating action
      showToast('Opened filter settings');
  };

  const handleMuteUserAction = async () => {
      if (post?.author.id) {
          const success = await muteUser(post.author.id);
          if (success) {
              if (onPostHidden) onPostHidden(post.id);
              showToast(`@${post.author.handle} muted`);
          } else {
              showToast('Failed to mute user');
          }
      }
  };

  const handleBlockUserAction = async () => {
      if (post?.author.id) {
          const success = await blockUser(post.author.id);
          if (success) {
              if (onPostHidden) onPostHidden(post.id);
              showToast(`@${post.author.handle} blocked`);
          } else {
              showToast('Failed to block user');
          }
      }
  };

  const handleReportAction = async () => {
      if (post?.uri && post?.cid) {
          const success = await reportPost(post.uri, post.cid);
          if (success) {
              if (onPostHidden) onPostHidden(post.id);
              showToast('Report submitted');
          } else {
              showToast('Failed to submit report');
          }
      }
  };

  if (!isRendered) return null;

  return (
    <div className="absolute inset-0 z-[220] flex items-end justify-center pointer-events-none">
       {/* Backdrop */}
       <div 
         className={`absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity duration-[400ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${isAnimating ? 'opacity-100' : 'opacity-0'}`} 
         onClick={onClose}
       />

       {/* Drawer */}
       <div 
         ref={drawerRef}
         className={`w-full max-w-md bg-[#0a0a0a]/60 backdrop-blur-3xl saturate-150 rounded-t-[35px] pointer-events-auto border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.6)] transform transition-transform duration-[400ms] will-change-transform cubic-bezier(0.32, 0.72, 0, 1) ${isAnimating ? 'translate-y-0' : 'translate-y-full'} pb-4 max-h-[85vh] flex flex-col`}
         onTouchStart={handleTouchStart}
         onTouchMove={handleTouchMove}
         onTouchEnd={handleTouchEnd}
       >
           {/* Toast Notification */}
           {toastMessage && (
               <div className="absolute top-[-60px] left-1/2 -translate-x-1/2 bg-white text-black px-4 py-2 rounded-full font-bold text-xs shadow-xl animate-heart-beat z-50 whitespace-nowrap pointer-events-none">
                   {toastMessage}
               </div>
           )}

           {/* Handle */}
           <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-4 pointer-events-none flex-shrink-0" />
           
           <div 
                ref={scrollContainerRef}
                className="px-3 pb-2 space-y-3 overflow-y-auto no-scrollbar"
           >
                
                {/* 1. Quick Actions Grid (Dense) */}
                <div className="grid grid-cols-3 gap-2">
                    <QuickActionButton icon={Icons.Languages || Icons.Globe} label="Translate" onClick={handleTranslate} />
                    <QuickActionButton icon={Icons.Clipboard} label="Copy Text" onClick={handleCopy} />
                    <QuickActionButton icon={Icons.EyeOff} label="Hide Post" onClick={handleHide} />
                </div>

                {/* 2. Primary Actions Group */}
                <div className="bg-white/5 rounded-xl overflow-hidden border border-white/5">
                     <ListActionItem 
                        icon={Icons.Bookmark} 
                        label={isSaved ? "Saved to Library" : "Save to Library"} 
                        subLabel={isSaved ? "Tap to remove" : "Add to your collections"} 
                        onClick={handleToggleSaveAction} 
                        active={isSaved}
                     />
                </div>

                {/* 3. Feedback Segment */}
                <div className="bg-white/5 rounded-xl flex border border-white/5 overflow-hidden">
                    <FeedbackButton icon={Icons.Smile} label="Show more like this" onClick={() => handleFeedback('more')} />
                    <div className="w-[1px] bg-white/10 my-1.5"></div>
                    <FeedbackButton icon={Icons.Frown} label="Show less like this" onClick={() => handleFeedback('less')} />
                </div>

                {/* 4. Filter Options Group */}
                <div className="bg-white/5 rounded-xl overflow-hidden border border-white/5">
                     <ListActionItem icon={Icons.BellOff} label="Mute this thread" subLabel="Stop notifications" onClick={handleMuteThreadAction} />
                     <div className="h-[1px] bg-white/5 mx-3"></div>
                     <ListActionItem icon={Icons.Filter} label="Mute words & tags" subLabel="Manage filters" onClick={handleMuteWords} />
                </div>

                {/* 5. Account Actions Group (Danger) */}
                <div className="bg-white/5 rounded-xl overflow-hidden border border-white/5">
                     <ListActionItem 
                        icon={Icons.BellOff} 
                        label={
                            <>
                                <span>Mute</span>
                                {post && <div className="scale-90 origin-left"><UserHandle handle={post.author.handle} /></div>}
                            </>
                        }
                        onClick={handleMuteUserAction} 
                     />
                     <div className="h-[1px] bg-white/5 mx-3"></div>
                     <ListActionItem 
                        icon={Icons.UserX} 
                        label={
                            <>
                                <span>Block</span>
                                {post && <div className="scale-90 origin-left"><UserHandle handle={post.author.handle} /></div>}
                            </>
                        } 
                        danger 
                        onClick={handleBlockUserAction} 
                     />
                     <div className="h-[1px] bg-white/5 mx-3"></div>
                     <ListActionItem icon={Icons.AlertTriangle} label="Report post" danger onClick={handleReportAction} />
                </div>

           </div>
       </div>
    </div>
  );
};

export default ContextMenuDrawer;
