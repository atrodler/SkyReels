
// ... imports ...
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Icons, MOCK_PROFILE_TABS_DATA } from '../constants';

interface LibraryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: string;
}

// ... MediaGrid and ListsView ...
interface MediaGridProps {
    items: any[];
    type: string;
    isManageMode: boolean;
    selectedIds: Set<string | number>;
    onToggleSelect: (id: string | number) => void;
}

const MediaGrid: React.FC<MediaGridProps> = ({ items, type, isManageMode, selectedIds, onToggleSelect }) => {
    return (
        <div className="grid grid-cols-3 gap-1 w-full pb-32 px-1">
            {items.map((item) => {
                const isSelected = selectedIds.has(item.id);
                return (
                    <div 
                        key={item.id} 
                        onClick={() => isManageMode ? onToggleSelect(item.id) : null}
                        className={`relative group cursor-pointer overflow-hidden bg-[#1a1a1a] aspect-[3/4] rounded-lg border transition-all duration-200 ${isManageMode && isSelected ? 'border-blue-500 opacity-100' : 'border-white/5'}`}
                    >
                        <img 
                            src={`https://picsum.photos/400/600?random=${item.seed}`} 
                            className={`w-full h-full object-cover transition-all duration-300 ${isManageMode ? 'scale-95' : 'opacity-90 hover:opacity-100'}`} 
                            loading="lazy"
                            alt=""
                        />
                        
                        {/* Type Badges (Normal Mode) */}
                        {!isManageMode && type === 'History' && (
                            <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-bold text-white/90 shadow-sm border border-white/10">
                                {item.seed % 12 + 1}h
                            </div>
                        )}
                        {!isManageMode && type === 'Likes' && (
                            <div className="absolute top-1 right-1 p-1 rounded-full bg-black/20 backdrop-blur-sm">
                                <Icons.Heart size={10} className="fill-white text-white" />
                            </div>
                        )}

                        {/* Passive Selection Indicator (Manage Mode) */}
                        {isManageMode && (
                            <div className="absolute inset-0 bg-black/10 transition-colors">
                                <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${isSelected ? 'bg-blue-500 border-blue-500 scale-110' : 'border-white/60 bg-black/40'}`}>
                                    {isSelected && <Icons.Check size={14} className="text-white" strokeWidth={3} />}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

// --- LISTS VIEW COMPONENT ---
interface ListsViewProps {
    items: any[];
    isManageMode: boolean;
    selectedIds: Set<string | number>;
    onToggleSelect: (id: string | number) => void;
    onReorder: (fromIndex: number, toIndex: number) => void;
}

const ListsView: React.FC<ListsViewProps> = ({ items, isManageMode, selectedIds, onToggleSelect, onReorder }) => {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnter = (e: React.DragEvent, index: number) => {
        if (draggedIndex === null || draggedIndex === index) return;
        onReorder(draggedIndex, index);
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    return (
        <div className="space-y-2 p-4 pb-32">
            {items.map((list, index) => {
                const isSelected = selectedIds.has(list.id);
                const isDragging = draggedIndex === index;

                return (
                    <div 
                        key={list.id} 
                        draggable={isManageMode}
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnter={(e) => handleDragEnter(e, index)}
                        onDragEnd={handleDragEnd}
                        onClick={() => isManageMode ? onToggleSelect(list.id) : null}
                        className={`bg-[#121212] rounded-2xl p-3 border transition-all duration-200 flex items-center gap-3 group cursor-pointer 
                            ${isManageMode && isSelected ? 'border-blue-500/50 bg-blue-500/10' : 'border-white/5 hover:border-white/10'}
                            ${isDragging ? 'opacity-50 scale-95 border-dashed border-white/40' : 'opacity-100'}
                        `}
                    >
                        {isManageMode && (
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-white/20 bg-transparent'}`}>
                                {isSelected && <Icons.Check size={14} className="text-white" strokeWidth={3} />}
                            </div>
                        )}

                        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-400 group-hover:text-white transition-colors flex-shrink-0">
                            <Icons.List size={20} />
                        </div>
                        
                        <div className="flex-1 min-w-0 select-none">
                            <h3 className={`font-bold text-sm truncate ${isSelected ? 'text-white' : 'text-gray-200'}`}>{list.name}</h3>
                            <p className="text-xs text-gray-500 font-medium">{list.count} items</p>
                        </div>

                        {isManageMode ? (
                            <div className="text-gray-500 px-2 cursor-grab active:cursor-grabbing hover:text-white transition-colors">
                                <Icons.GripVertical size={20} />
                            </div>
                        ) : (
                            <div className="flex -space-x-2 flex-shrink-0">
                                {list.avatars?.map((avatar: string, i: number) => (
                                    <img key={i} src={avatar} className="w-6 h-6 rounded-full border-2 border-[#121212]" alt="" />
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
            
            {!isManageMode && (
                <button className="w-full py-4 border-2 border-dashed border-white/5 rounded-2xl flex items-center justify-center gap-2 text-gray-500 hover:text-white hover:bg-white/5 transition-all group mt-2">
                    <Icons.Plus size={18} />
                    <span className="text-xs font-bold uppercase tracking-wide">Create New List</span>
                </button>
            )}
        </div>
    );
};

const LibraryDrawer: React.FC<LibraryDrawerProps> = ({ isOpen, onClose, initialTab = 'Saved' }) => {
  const [isRendered, setIsRendered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  
  const [isManageMode, setIsManageMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  const [gridData, setGridData] = useState<Record<string, any[]>>({
      'Saved': Array.from({ length: 24 }).map((_, i) => ({ id: `s-${i}`, seed: i + 200 })),
      'Likes': Array.from({ length: 24 }).map((_, i) => ({ id: `l-${i}`, seed: i + 100 })),
      'History': Array.from({ length: 24 }).map((_, i) => ({ id: `h-${i}`, seed: i + 300 })),
  });
  const [listsData, setListsData] = useState(MOCK_PROFILE_TABS_DATA.Lists);

  const [isDragging, setIsDragging] = useState(false);
  const drawerRef = useRef(null);
  const startYRef = useRef(0);

  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const pillRef = useRef<HTMLDivElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  const TABS = [
      { id: 'Saved', icon: Icons.Bookmark },
      { id: 'Lists', icon: Icons.List },
      { id: 'Likes', icon: Icons.Heart },
      { id: 'History', icon: Icons.Clock },
  ];

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (isOpen) {
      setIsRendered(true);
      setActiveTab(initialTab);
      setIsManageMode(false);
      setSelectedIds(new Set());

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
  }, [isOpen, initialTab]);

  useEffect(() => {
      setIsManageMode(false);
      setSelectedIds(new Set());
  }, [activeTab]);

  // ... (rest of logic remains same) ...
  useEffect(() => {
      const updatePill = () => {
          const activeEl = tabRefs.current[activeTab];
          const pillEl = pillRef.current;
          if (activeEl && pillEl) {
              pillEl.style.transform = `translateX(${activeEl.offsetLeft}px)`;
              pillEl.style.width = `${activeEl.offsetWidth}px`;
          }
      };
      requestAnimationFrame(updatePill);
      const resizeObserver = new ResizeObserver(() => updatePill());
      if (tabsContainerRef.current) {
          resizeObserver.observe(tabsContainerRef.current);
          Object.values(tabRefs.current).forEach((el) => { if (el) resizeObserver.observe(el as Element); });
      }
      return () => resizeObserver.disconnect();
  }, [activeTab, isRendered]);

  useEffect(() => {
    const container = tabsContainerRef.current;
    const tab = tabRefs.current[activeTab];
    if (container && tab) {
        const scrollLeft = tab.offsetLeft - (container.clientWidth / 2) + (tab.offsetWidth / 2);
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [activeTab]);

  const handleTouchStart = (e: React.TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.no-drag') || target.closest('.overflow-y-auto')) return;
      
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

  const toggleSelection = (id: string | number) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedIds(newSet);
  };

  const handleListReorder = (fromIndex: number, toIndex: number) => {
      const updated = [...listsData];
      const [movedItem] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, movedItem);
      setListsData(updated);
  };

  const handleAction = () => {
      if (activeTab === 'Lists') {
          setListsData(prev => prev.filter(item => !selectedIds.has(item.id)));
      } else {
          setGridData(prev => ({
              ...prev,
              [activeTab]: prev[activeTab].filter(item => !selectedIds.has(item.id))
          }));
      }
      setSelectedIds(new Set());
  };

  const handleCancelManage = () => {
      setIsManageMode(false);
      setSelectedIds(new Set());
  };

  const handleDoneManage = () => {
      setIsManageMode(false);
      setSelectedIds(new Set());
  };

  const getActionLabel = () => {
      const count = selectedIds.size;
      const suffix = count > 0 ? `(${count})` : '';
      switch (activeTab) {
          case 'Saved': return `Unsave ${suffix}`;
          case 'Likes': return `Unlike ${suffix}`;
          case 'History': return `Remove ${suffix}`;
          case 'Lists': return `Delete ${suffix}`;
          default: return `Remove ${suffix}`;
      }
  };

  if (!isRendered) return null;

  return (
    <div className="absolute inset-0 z-[160] flex items-end justify-center pointer-events-none">
        <div 
            className={`absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity duration-[400ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${isAnimating ? 'opacity-100' : 'opacity-0'}`} 
            onClick={onClose}
        />

        <div 
            ref={drawerRef}
            className={`w-full max-w-md rounded-t-[35px] pointer-events-auto border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] transform transition-transform duration-[400ms] will-change-transform cubic-bezier(0.32, 0.72, 0, 1) ${isAnimating ? 'translate-y-0' : 'translate-y-full'} relative h-[92vh] overflow-hidden`}
        >
            <div className="absolute top-[64px] bottom-0 left-0 right-0 bg-[#0a0a0a]/80 backdrop-blur-3xl saturate-150 -z-10" />

            <div 
                className="absolute top-0 left-0 right-0 z-30 pt-3 px-6 pb-2 bg-[#0a0a0a]/80 backdrop-blur-3xl saturate-150 border-b border-white/5"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-3 pointer-events-none" />
                
                <div className="flex items-center justify-center relative h-[44px]">
                    <div className="absolute left-0 transition-all duration-300 no-drag z-50">
                         {isManageMode ? (
                             <button onClick={handleCancelManage} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white text-[11px] font-bold uppercase tracking-wide transition-colors">Cancel</button>
                         ) : (
                             <button onClick={() => setIsManageMode(true)} className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors active:scale-90" title="Edit"><Icons.SlidersHorizontal size={20} /></button>
                         )}
                    </div>

                    <div className="flex-1 flex justify-center no-drag overflow-hidden px-14">
                        {isManageMode ? (
                            <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] animate-fade-in leading-none self-center">Manage {activeTab}</h2>
                        ) : (
                            <div ref={tabsContainerRef} className="flex items-center gap-1 overflow-x-auto no-scrollbar relative w-full px-2">
                                <div ref={pillRef} className="absolute h-[32px] bg-white rounded-full transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]" />
                                {TABS.map((tab) => {
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button key={tab.id} ref={(el) => { tabRefs.current[tab.id] = el; }} onClick={() => setActiveTab(tab.id)} className={`relative z-10 px-4 h-[32px] flex items-center gap-2 rounded-full transition-colors duration-300 flex-shrink-0 ${isActive ? 'text-black' : 'text-gray-500 hover:text-white'}`}>
                                            <tab.icon size={14} filled={isActive} />
                                            <span className="text-[11px] font-black uppercase tracking-wider">{tab.id}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="absolute right-0 no-drag z-50">
                        {isManageMode ? (
                            <button onClick={handleDoneManage} className="px-5 py-2 bg-white rounded-full text-black text-[11px] font-bold uppercase tracking-wide transition-all active:scale-95 shadow-lg">Done</button>
                        ) : (
                            <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"><Icons.X size={18} strokeWidth={3} /></button>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pt-[84px] relative z-10">
                {activeTab === 'Lists' ? (
                    <ListsView items={listsData} isManageMode={isManageMode} selectedIds={selectedIds} onToggleSelect={toggleSelection} onReorder={handleListReorder} />
                ) : (
                    <MediaGrid items={gridData[activeTab] || []} type={activeTab} isManageMode={isManageMode} selectedIds={selectedIds} onToggleSelect={toggleSelection} />
                )}
            </div>

            {isManageMode && (
                <div className="absolute bottom-0 left-0 right-0 z-40 p-6 pb-10 bg-gradient-to-t from-black via-black/90 to-transparent animate-slide-up pointer-events-none">
                    <button onClick={handleAction} disabled={selectedIds.size === 0} className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all duration-300 pointer-events-auto shadow-2xl ${selectedIds.size > 0 ? 'bg-red-600 text-white shadow-red-900/20 translate-y-0 opacity-100' : 'bg-zinc-800 text-zinc-600 translate-y-4 opacity-0'}`}>
                        <Icons.Trash2 size={18} />
                        {getActionLabel()}
                    </button>
                </div>
            )}
        </div>
    </div>
  );
};

export default LibraryDrawer;
