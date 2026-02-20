
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Icons, MOCK_NOTIFICATIONS } from '../constants';
import UserHandle from './UserHandle';
import { getNotifications, markNotificationsSeen } from '../services/atp';
import { Notification } from '../types';

interface NotificationsMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

const NotificationsMenu = forwardRef<HTMLDivElement, NotificationsMenuProps>(({ isOpen, onClose }, ref) => {
  // Internal Gesture State (For Closing)
  const [internalDragX, setInternalDragX] = useState(0); 
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef(null);
  
  // Data State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  
  const menuRef = useRef(null);
  useImperativeHandle(ref, () => menuRef.current!);

  // Fetch Notifications when opened
  useEffect(() => {
      if (isOpen) {
          const fetchNotifs = async () => {
              // Only show loader if we don't have data yet
              if (!hasLoadedOnce) setLoading(true);
              
              const { notifications: newNotifs } = await getNotifications();
              
              // If we have data, use it. Otherwise fall back to mock if empty (to avoid empty screen in demo)
              if (newNotifs.length > 0) {
                  setNotifications(newNotifs);
                  // Mark as seen after loading
                  markNotificationsSeen();
              } else if (!hasLoadedOnce) {
                  // Fallback for demo purposes if the account has absolutely zero activity
                  // setNotifications(MOCK_NOTIFICATIONS);
              }
              
              setLoading(false);
              setHasLoadedOnce(true);
          };
          
          fetchNotifs();
      }
  }, [isOpen]);

  // --- GESTURE HANDLING (Swipe Right to Close) ---
  const handleTouchStart = (e: React.TouchEvent) => {
      (dragStartRef.current as any) = e.touches[0].clientX;
      setIsDragging(true);
      if (menuRef.current) {
          (menuRef.current as any).style.transition = 'none'; 
      }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      const start = dragStartRef.current as any;
      if (start === null) return;
      const currentX = e.touches[0].clientX;
      const diff = currentX - start;
      
      // Only allow dragging to the RIGHT (Positive) to close
      if (diff > 0) {
          setInternalDragX(diff);
      }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
      setIsDragging(false);
      (dragStartRef.current as any) = null;
      if (menuRef.current) {
        (menuRef.current as any).style.transition = ''; 
      }
      
      // Threshold to close
      if (internalDragX > 100) {
          onClose();
      } else {
          setInternalDragX(0); 
      }
  };

  // Filter Logic
  const filteredNotifications = notifications.filter(notif => {
      if (activeFilter === 'All') return true;
      if (activeFilter === 'Mentions') return notif.type === 'QUOTE'; // Includes mentions mapped to QUOTE
      if (activeFilter === 'Replies') return notif.type === 'COMMENT';
      if (activeFilter === 'Likes') return notif.type === 'LIKE';
      return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className={`absolute inset-0 z-[70] overflow-hidden ${!isOpen ? 'pointer-events-none' : 'pointer-events-auto'}`}>
       {/* Backdrop */}
       <div 
            className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-500 will-change-[opacity] backdrop-layer ${isOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={onClose}
        />

        {/* Menu Panel - Slides from RIGHT */}
        <div 
            ref={menuRef}
            className={`absolute inset-y-0 right-0 w-full max-w-[320px] bg-[#050505]/85 backdrop-blur-3xl saturate-150 border-l border-white/10 text-white flex flex-col shadow-[-10px_0_40px_rgba(0,0,0,0.5)] transform transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform ${isOpen && !isDragging ? 'translate-x-0 opacity-100' : 'translate-x-[110%] opacity-0 invisible'}`}
            style={isDragging ? { transform: `translateX(${internalDragX}px)`, opacity: 1, visibility: 'visible' } : undefined}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Header Row */}
            <div className="flex-shrink-0 px-4 pt-[7px] pb-2 z-20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <h1 className="text-lg font-black tracking-tight text-white">Notifications</h1>
                    {unreadCount > 0 && (
                        <div className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.4)] leading-none">{unreadCount}</div>
                    )}
                </div>
                
                {/* Spacer for global fixed Notifications button */}
                <div className="w-[40px] h-[40px] flex-shrink-0" />
            </div>

            {/* Filter Pills */}
            <div className="flex-shrink-0 px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar border-b border-white/5">
                {['All', 'Mentions', 'Replies', 'Likes'].map((filter, i) => (
                    <button 
                        key={filter} 
                        onClick={() => setActiveFilter(filter)}
                        className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold border transition-all active:scale-95 whitespace-nowrap ${activeFilter === filter ? 'bg-white text-black border-white shadow-lg' : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'}`}
                    >
                        {filter}
                    </button>
                ))}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
                
                {loading && !hasLoadedOnce ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-3 opacity-50">
                        <Icons.Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Checking...</span>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {filteredNotifications.map((notif, idx) => (
                        <div key={notif.id + idx} className={`flex items-start px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer border-b border-white/5 last:border-0 ${!notif.isRead ? 'bg-blue-500/5' : ''}`}>
                            
                            {/* Icon Indicator */}
                            <div className="mr-3 mt-0.5 flex-shrink-0">
                                {notif.type === 'LIKE' && <div className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20"><Icons.Heart filled size={14} /></div>}
                                {notif.type === 'FOLLOW' && <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20"><Icons.UserPlus size={16} /></div>}
                                {notif.type === 'COMMENT' && <div className="w-8 h-8 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center border border-green-500/20"><Icons.MessageCircle filled size={14} /></div>}
                                {notif.type === 'REPOST' && <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20"><Icons.RefreshCw size={14} /></div>}
                                {notif.type === 'QUOTE' && <div className="w-8 h-8 rounded-full bg-yellow-500/10 text-yellow-500 flex items-center justify-center border border-yellow-500/20"><Icons.Quote filled size={14} /></div>}
                            </div>

                            <div className="flex-1 min-w-0 pt-0.5">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <img src={notif.user.avatarUrl} className="w-4 h-4 rounded-full object-cover border border-white/10" alt="" />
                                    <span className="text-[13px] font-bold text-white truncate"><UserHandle handle={notif.user.handle} /></span>
                                    <span className="text-gray-500 text-[10px] whitespace-nowrap ml-auto">{notif.createdAt}</span>
                                </div>
                                
                                <p className="text-[12px] text-gray-300 leading-snug">
                                    {notif.type === 'LIKE' && `liked your post`}
                                    {notif.type === 'FOLLOW' && `followed you`}
                                    {notif.type === 'COMMENT' && <span className="text-gray-200">replied: <span className="text-white">"{notif.text}"</span></span>}
                                    {notif.type === 'REPOST' && `reposted your post`}
                                    {notif.type === 'QUOTE' && <span className="text-gray-200">mentioned you: <span className="text-white">"{notif.text}"</span></span>}
                                </p>
                            </div>
                            
                            {/* Post Preview (if applicable) */}
                            {notif.postImage && (
                                <div className="ml-3 w-10 h-10 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 bg-white/5">
                                    <img src={notif.postImage} className="w-full h-full object-cover" alt="Post" />
                                </div>
                            )}
                        </div>
                        ))}
                        
                        {filteredNotifications.length === 0 && (
                            <div className="p-12 text-center flex flex-col items-center justify-center opacity-30 mt-10">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/5">
                                    <Icons.BellOff size={24} className="text-gray-400" />
                                </div>
                                <span className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">No notifications</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
});

export default NotificationsMenu;
