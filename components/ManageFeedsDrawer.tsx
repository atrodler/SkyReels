
// ... imports ...
import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../constants';

interface ManageFeedsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  feeds: any[];
  setFeeds: (feeds: any[]) => void;
  onFeedInfo?: (feed: any) => void;
  onFeedSelect?: (feedName: string) => void;
  onDiscoverFeeds?: () => void;
  onSave?: (feeds: any[]) => void;
}

const ManageFeedsDrawer: React.FC<ManageFeedsDrawerProps> = ({ isOpen, onClose, feeds, setFeeds, onFeedInfo, onFeedSelect, onDiscoverFeeds, onSave }) => {
  const [isRendered, setIsRendered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Modes
  const [isManageMode, setIsManageMode] = useState(false);
  const [selectedFeedIds, setSelectedFeedIds] = useState<Set<string>>(new Set());

  // Undo / Snapshot State
  const initialFeedsRef = useRef<any[]>([]);

  // Drag State (Drawer)
  const [isDraggingDrawer, setIsDraggingDrawer] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);

  // Drag State (List Items)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    
    if (isOpen) {
      setIsRendered(true);
      setIsManageMode(false);
      setSelectedFeedIds(new Set());
      setDragOffset(0);
      
      const sorted = getSortedFeeds(feeds);
      if (JSON.stringify(sorted.map(f => f.id)) !== JSON.stringify(feeds.map(f => f.id))) {
          setFeeds(sorted);
      }

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

  // ... (rest of logic remains same) ...
  const getSortedFeeds = (currentFeeds: any[]) => {
      const followingFeed = currentFeeds.find(f => f.id === 'feed1');
      const pinnedFeeds = currentFeeds.filter(f => f.viewerState?.isPinned && f.id !== 'feed1');
      const unpinnedFeeds = currentFeeds.filter(f => !f.viewerState?.isPinned && f.id !== 'feed1');

      return followingFeed ? [followingFeed, ...pinnedFeeds, ...unpinnedFeeds] : [...pinnedFeeds, ...unpinnedFeeds];
  };

  const handleTouchStart = (e: React.TouchEvent) => {
      if (draggedIndex !== null) return;
      
      const scrollEl = scrollRef.current;
      // We only initiate drawer dragging if we are at the top of the scrollable content
      const isAtTop = scrollEl ? scrollEl.scrollTop <= 0 : true;
      
      if (!isAtTop) return;

      setIsDraggingDrawer(true);
      startYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      if (!isDraggingDrawer) return;
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startYRef.current;
      
      // Allow dragging down
      if (deltaY > 0) {
          setDragOffset(deltaY);
      } else {
          setDragOffset(0);
      }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
      if (!isDraggingDrawer) return;
      setIsDraggingDrawer(false);
      
      if (dragOffset > 150) {
          onClose();
      } else {
          setDragOffset(0);
      }
  };

  const toggleSelection = (feedId: string) => {
      if (feedId === 'feed1') return;
      const newSet = new Set(selectedFeedIds);
      if (newSet.has(feedId)) newSet.delete(feedId);
      else newSet.add(feedId);
      setSelectedFeedIds(newSet);
  };

  const deleteSelected = () => {
      const remaining = feeds.filter(f => !selectedFeedIds.has(f.id));
      setFeeds(remaining);
      setSelectedFeedIds(new Set());
  };

  const bulkTogglePin = () => {
      const selectedFeeds = feeds.filter(f => selectedFeedIds.has(f.id));
      if (selectedFeeds.length === 0) return;
      const allPinned = selectedFeeds.every(f => f.viewerState?.isPinned);
      const targetState = !allPinned; 

      const updated = feeds.map(f => {
          if (selectedFeedIds.has(f.id)) {
              return { ...f, viewerState: { ...f.viewerState, isPinned: targetState }};
          }
          return f;
      });
      
      setFeeds(getSortedFeeds(updated));
      setSelectedFeedIds(new Set());
  };

  const handleIndividualPinToggle = (feedId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (feedId === 'feed1') return;
      const updated = feeds.map(f => {
          if (f.id === feedId) {
              return { ...f, viewerState: { ...f.viewerState, isPinned: !f.viewerState?.isPinned }};
          }
          return f;
      });
      setFeeds(getSortedFeeds(updated));
  };

  const handleDragStart = (index: number) => {
      if (feeds[index]?.id === 'feed1') return;
      setDraggedIndex(index);
  };

  const handleDragEnter = (index: number) => {
      if (draggedIndex === null || draggedIndex === index || index === 0) return;
      
      const draggedFeed = feeds[draggedIndex];
      const targetFeed = feeds[index];
      if (!draggedFeed || !targetFeed) return;

      const draggedIsPinned = draggedFeed.viewerState?.isPinned;
      const targetIsPinned = targetFeed.viewerState?.isPinned;

      if (draggedIsPinned !== targetIsPinned) return; 

      const newFeeds = [...feeds];
      const draggedItem = newFeeds[draggedIndex];
      newFeeds.splice(draggedIndex, 1);
      newFeeds.splice(index, 0, draggedItem);
      
      setFeeds(newFeeds);
      setDraggedIndex(index);
  };

  const handleDragEnd = () => {
      setDraggedIndex(null);
  };

  const handleManageToggle = () => {
      if (isManageMode) {
          setFeeds(initialFeedsRef.current);
          setIsManageMode(false);
          setSelectedFeedIds(new Set());
      } else {
          initialFeedsRef.current = [...feeds];
          setIsManageMode(true);
      }
  };

  const handleDone = () => {
      setIsManageMode(false);
      setSelectedFeedIds(new Set());
      if (onSave) onSave(feeds);
      if (!isManageMode) onClose();
  };

  const handleFeedClick = (feed: any) => {
      if (isManageMode) {
           if (feed.id !== 'feed1') toggleSelection(feed.id);
      } else {
           if (onFeedSelect) {
                onFeedSelect(feed.name);
                onClose();
           }
      }
  };

  const getFeedIcon = (feedName: string, defaultIcon: string) => {
      const name = feedName.toLowerCase();
      if (name.includes('discover') || name.includes('popular')) return Icons.Zap;
      if (name.includes('science') || name.includes('sky')) return Icons.Cloud;
      if (name.includes('for you') || name.includes('mixed')) return Icons.Layers;
      if (name.includes('art') || name.includes('design')) return Icons.Palette;
      if (name.includes('tech') || name.includes('code')) return Icons.Cpu;
      if (name.includes('photo')) return Icons.Camera;
      if (name.includes('garden')) return Icons.Sun;
      if (name.includes('keys')) return Icons.Keyboard;
      if (name.includes('cats') || name.includes('smile')) return Icons.Smile;
      if (name.includes('brutal')) return Icons.Box;
      if (name.includes('video') || name.includes('reel') || name.includes('media')) return Icons.Play;
      if (name.includes('news')) return Icons.Newspaper;
      if (name.includes('hot') || name.includes('trend')) return Icons.Flame;
      return (Icons as any)[defaultIcon] || Icons.Hash;
  };

  const getBulkActionState = () => {
      const selectedFeeds = feeds.filter(f => selectedFeedIds.has(f.id));
      if (selectedFeeds.length === 0) return { canPin: false, pinLabel: '' };
      const allPinned = selectedFeeds.every(f => f.viewerState?.isPinned);
      const allUnpinned = selectedFeeds.every(f => !f.viewerState?.isPinned);
      if (allPinned) return { canPin: true, pinLabel: 'Unpin' };
      if (allUnpinned) return { canPin: true, pinLabel: 'Pin' };
      return { canPin: false, pinLabel: '' }; 
  };

  const bulkState = getBulkActionState();

  if (!isRendered) return null;

  return (
    <div className="absolute inset-0 z-[160] flex items-end justify-center pointer-events-none">
       <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity duration-[400ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${isAnimating ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />

       <div 
         ref={drawerRef}
         className={`w-full max-w-md bg-[#0a0a0a]/90 backdrop-blur-3xl saturate-150 rounded-t-[35px] pointer-events-auto border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.6)] transform will-change-transform flex flex-col min-h-[50vh] max-h-[90vh] transition-all duration-300 ${!isDraggingDrawer ? 'cubic-bezier(0.32, 0.72, 0, 1)' : ''}`}
         style={{ transform: `translateY(${isAnimating ? dragOffset : 100}%)` }}
         onTouchStart={handleTouchStart}
         onTouchMove={handleTouchMove}
         onTouchEnd={handleTouchEnd}
       >
           {/* ... Content ... */}
           <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-white/20 rounded-full pointer-events-none z-20" />
           
           <div className="h-[60px] flex items-center justify-between px-6 border-b border-white/5 flex-shrink-0 relative">
               <button onClick={handleManageToggle} className={`text-[11px] font-bold uppercase tracking-wide px-4 py-1.5 rounded-full shadow-lg transition-all active:scale-95 ${isManageMode ? 'bg-red-500 text-white' : 'bg-white text-black'}`}>
                    {isManageMode ? 'Cancel' : 'Manage'}
               </button>
               <h3 className="text-sm font-black text-white uppercase tracking-wider absolute left-1/2 -translate-x-1/2 pointer-events-none">
                   {isManageMode && selectedFeedIds.size > 0 ? `Selected (${selectedFeedIds.size})` : 'My Feeds'}
               </h3>
               <button onClick={handleDone} className="text-[11px] font-bold uppercase tracking-wide px-4 py-1.5 rounded-full shadow-lg transition-all active:scale-95 bg-white text-black">
                    {isManageMode ? 'Save' : 'Done'}
               </button>
           </div>

           <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar p-3">
                <div className={`space-y-1.5 transition-all duration-300 ${isManageMode && selectedFeedIds.size > 0 ? 'pb-24' : 'pb-2'}`}>
                    {feeds.map((feed, index) => {
                        const Icon = getFeedIcon(feed.name, feed.icon);
                        const isPinned = feed.viewerState?.isPinned;
                        const isSelected = selectedFeedIds.has(feed.id);
                        const isDraggingItem = draggedIndex === index;
                        const isFollowing = feed.id === 'feed1';

                        const showPinnedHeader = index === 0 && isPinned;
                        const showUnpinnedHeader = !isPinned && (index === 0 || feeds[index-1]?.viewerState?.isPinned);

                        return (
                            <React.Fragment key={feed.id}>
                                {showPinnedHeader && (
                                    <div className="flex items-center gap-2 pl-2 mb-1 mt-1 opacity-80">
                                        <Icons.Pin size={10} className="text-blue-400" />
                                        <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">PINNED</div>
                                    </div>
                                )}
                                {showUnpinnedHeader && (
                                    <div className="mt-3 mb-1 pl-2 opacity-60">
                                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">More Feeds</div>
                                    </div>
                                )}

                                <div 
                                    draggable={isManageMode && !isFollowing}
                                    onDragStart={() => handleDragStart(index)}
                                    onDragEnter={() => handleDragEnter(index)}
                                    onDragEnd={handleDragEnd}
                                    onClick={() => handleFeedClick(feed)}
                                    className={`feed-item-interactive relative flex items-center gap-3 p-2.5 rounded-xl transition-all border ${isDraggingItem ? 'opacity-50 scale-95 z-50' : 'opacity-100'} ${isSelected ? 'bg-blue-500/20 border-blue-500/50' : isPinned ? 'bg-white/5 border-white/10' : 'bg-black/20 border-white/5 hover:bg-white/5'} ${!isManageMode ? 'cursor-pointer active:scale-[0.98]' : (!isFollowing ? 'cursor-pointer' : '')}`}
                                >
                                    {isManageMode && (
                                        <div className="no-drag flex-shrink-0 w-6 flex items-center justify-center">
                                            {isFollowing ? <Icons.Lock size={12} className="text-gray-500" /> : <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-white/20 bg-transparent'}`}>{isSelected && <Icons.Check size={12} className="text-white" />}</div>}
                                        </div>
                                    )}

                                    <div className="flex-1 flex items-center gap-3 min-w-0">
                                        {feed.avatar ? (
                                            <img src={feed.avatar} alt="" className={`w-9 h-9 rounded-xl object-cover border flex-shrink-0 ${isPinned ? 'border-blue-500/30' : 'border-white/10'}`} />
                                        ) : (
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border transition-colors ${isPinned ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-white/5 text-gray-400 border-white/5'}`}>
                                                <Icon size={18} strokeWidth={2} />
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <h3 className={`text-[13px] font-bold truncate leading-tight ${isPinned ? 'text-white' : 'text-gray-200'}`}>
                                                {feed.name}
                                            </h3>
                                            <p className="text-[10px] text-gray-400 truncate leading-tight mt-0.5">
                                                {feed.description}
                                            </p>
                                            
                                            <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[9px] font-medium text-gray-600 uppercase tracking-wide">
                                                <span className="text-blue-400">@{feed.creatorHandle || 'system.app'}</span>
                                                {feed.type && feed.type !== 'Custom Feed' && (
                                                    <>
                                                        <span className="w-0.5 h-0.5 bg-gray-600 rounded-full shrink-0" />
                                                        <span className="shrink-0">{feed.type}</span>
                                                    </>
                                                )}
                                                {feed.subscribers && feed.subscribers !== '0' && (
                                                    <>
                                                        <span className="w-0.5 h-0.5 bg-gray-600 rounded-full shrink-0" />
                                                        <span className="shrink-0">{feed.subscribers} subs</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 no-drag">
                                        {isManageMode ? (
                                            isFollowing ? <div className="px-2 text-gray-600 text-[8px] font-bold uppercase tracking-tight">Main Tab</div> : (
                                                <>
                                                    <button onClick={(e) => handleIndividualPinToggle(feed.id, e)} className={`p-1.5 rounded-lg transition-colors ${isPinned ? 'text-blue-500' : 'text-gray-600'}`}><Icons.Pin size={16} className={isPinned ? 'fill-current' : ''} /></button>
                                                    <div className="text-gray-600 p-1.5"><Icons.GripVertical size={18} /></div>
                                                </>
                                            )
                                        ) : <button onClick={(e) => { e.stopPropagation(); onFeedInfo?.(feed); }} className="p-2 rounded-lg text-gray-600 hover:text-white hover:bg-white/10 transition-colors"><Icons.Info size={18} /></button>}
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>

                {!isManageMode && (
                    <button onClick={() => { onDiscoverFeeds?.(); onClose(); }} className="w-full py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 border-dashed text-blue-400 font-bold text-xs flex items-center justify-center gap-2 mt-4 active:scale-[0.98] transition-all">
                        <Icons.Compass size={18} /> EXPLORE MORE FEEDS
                    </button>
                )}
           </div>

           {isManageMode && selectedFeedIds.size > 0 && (
                <div className="absolute bottom-8 left-6 right-6 flex gap-3 z-50 animate-slide-up">
                    {bulkState.canPin && (
                        <button onClick={bulkTogglePin} className={`flex-1 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-2xl transition-all active:scale-95 ${bulkState.pinLabel === 'Pin' ? 'bg-blue-600 text-white' : 'bg-white text-black'}`}>
                            <Icons.Pin size={18} />
                            {bulkState.pinLabel}
                        </button>
                    )}
                    <button onClick={deleteSelected} className="flex-1 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-2xl bg-red-500 text-white transition-all active:scale-95">
                        <Icons.Trash size={18} />
                        Delete
                    </button>
                </div>
           )}
       </div>
    </div>
  );
};

export default ManageFeedsDrawer;
