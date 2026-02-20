
// ... imports ...
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Icons, MOCK_SETTINGS_STRUCTURE } from '../constants';
import { logout } from '../services/atp';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Record<string, any>;
  onUpdateSetting: (id: string, value: any) => void;
}

const SettingRow: React.FC<{ 
    item: any, 
    value: any, 
    onChange: (id: string, val: any) => void,
    isLast: boolean 
}> = ({ item, value, onChange, isLast }) => {
    const Icon = (Icons as any)[item.icon] || Icons.Settings;
    const isFunctional = item.isFunctional !== false;
    
    const handleClick = () => {
        if (!isFunctional) return;

        if (item.type === 'toggle') {
            onChange(item.id, !value);
        } else if (item.type === 'value' && item.options) {
            const currIdx = value !== undefined ? item.options.indexOf(value) : -1;
            const nextIndex = (currIdx + 1) % item.options.length;
            onChange(item.id, item.options[nextIndex]);
        }
    };

    // Styling logic
    const isDanger = item.danger;
    
    // Text Color
    let titleColor = 'text-gray-200 group-hover:text-white';
    if (isDanger) titleColor = 'text-red-500';
    else if (!isFunctional) titleColor = 'text-red-400/60 font-medium';

    // Icon Styles
    let iconBg = 'bg-white/5 border-white/5';
    let iconColor = 'text-gray-400 group-hover:text-white';
    
    if (isDanger) {
        iconBg = 'bg-red-500/10 border-red-500/20';
        iconColor = 'text-red-500';
    } else if (!isFunctional) {
        iconBg = 'bg-red-900/10 border-red-500/10';
        iconColor = 'text-red-500/40';
    }

    return (
        <button 
            onClick={handleClick}
            disabled={!isFunctional}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-white/5 transition-colors active:bg-white/10 text-left group ${!isLast ? 'border-b border-white/5' : ''} ${!isFunctional ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
            <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
                <div className={`w-7 h-7 rounded-[10px] flex items-center justify-center flex-shrink-0 ${iconBg} ${iconColor} transition-colors border shadow-sm`}>
                    <Icon size={15} strokeWidth={2} />
                </div>
                <div className="flex flex-col min-w-0">
                    <span className={`text-[12.5px] font-bold ${titleColor} truncate leading-tight tracking-tight`}>{item.label}</span>
                    {!isFunctional ? (
                        <span className="text-[8px] font-bold text-red-500/40 uppercase tracking-widest leading-none mt-0.5">Unavailable</span>
                    ) : item.description ? (
                        <span className="text-[10px] text-gray-500 leading-tight truncate mt-0.5">{item.description}</span>
                    ) : null}
                </div>
            </div>

            <div className="flex-shrink-0">
                {item.type === 'toggle' ? (
                    <div className={`w-[36px] h-[20px] rounded-full relative transition-all duration-300 border ${!isFunctional ? 'bg-red-900/10 border-red-500/10 opacity-60' : (value ? 'bg-blue-600 border-blue-500' : 'bg-zinc-800 border-zinc-600 group-hover:border-zinc-500')}`}>
                        <div 
                            className={`absolute top-[1.5px] w-[15px] h-[15px] bg-white rounded-full shadow-sm transition-all duration-300 cubic-bezier(0.4, 0.0, 0.2, 1) ${value ? 'translate-x-[17px]' : 'translate-x-[1.5px]'}`} 
                        />
                    </div>
                ) : item.type === 'value' ? (
                    <div className={`flex items-center gap-1.5 ${!isFunctional ? 'opacity-30' : ''}`}>
                        <span className={`text-[10px] font-bold ${isFunctional ? 'text-blue-400' : 'text-gray-600'} bg-white/5 border border-white/10 px-2 py-0.5 rounded-md truncate max-w-[90px] transition-all group-hover:border-white/20`}>
                            {value || item.defaultValue}
                        </span>
                        <Icons.ChevronRight size={12} className={`${isFunctional ? 'text-gray-500 group-hover:text-gray-400' : 'text-zinc-800'} transition-colors`} />
                    </div>
                ) : (
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isDanger ? 'text-red-500/50' : 'text-gray-600 group-hover:text-white'} transition-colors`}>
                        <Icons.ChevronRight size={14} strokeWidth={2.5} />
                    </div>
                )}
            </div>
        </button>
    );
};

const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ isOpen, onClose, settings, onUpdateSetting }) => {
  const [isRendered, setIsRendered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [appInfoCopied, setAppInfoCopied] = useState(false);
  
  const [isDragging, setIsDragging] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
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

  // ... (handlers remain the same) ...
  const handleCopyAppInfo = () => {
      navigator.clipboard.writeText("SkyReels Core 0.5.2\nAT Protocol Federated");
      setAppInfoCopied(true);
      setTimeout(() => setAppInfoCopied(false), 2000);
  };

  const filteredData = useMemo(() => {
      let data = MOCK_SETTINGS_STRUCTURE;
      
      // Filter by search
      if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const flatList: any[] = [];
          data.forEach(cat => {
              const matchingItems = cat.items.filter((item: any) => 
                  item.label.toLowerCase().includes(query) || 
                  cat.title.toLowerCase().includes(query)
              );
              if (matchingItems.length > 0) {
                  flatList.push({ ...cat, items: matchingItems });
              }
          });
          data = flatList;
      }

      // Filter out Log Out button (id: deleteSession) from the scrolling list
      // It will be rendered manually at the bottom of the list
      return data.map(cat => ({
          ...cat,
          items: cat.items.filter((item: any) => item.id !== 'deleteSession')
      })).filter(cat => cat.items.length > 0);

  }, [searchQuery]);

  if (!isRendered) return null;

  return (
    <div className="absolute inset-0 z-[160] flex items-end justify-center pointer-events-none">
        <div 
            className={`absolute inset-0 bg-black/70 backdrop-blur-md pointer-events-auto transition-opacity duration-[400ms] ease-out ${isAnimating ? 'opacity-100' : 'opacity-0'}`} 
            onClick={onClose}
        />

        <div 
            ref={drawerRef}
            className={`w-full max-w-md bg-[#0a0a0a]/95 backdrop-blur-3xl saturate-150 rounded-t-[36px] pointer-events-auto border-t border-white/10 shadow-[0_-12px_60px_rgba(0,0,0,0.9)] transform transition-transform duration-[400ms] will-change-transform cubic-bezier(0.32, 0.72, 0, 1) ${isAnimating ? 'translate-y-0' : 'translate-y-full'} flex flex-col h-[92vh]`}
        >
            {/* Sticky Header */}
            <div 
                className="flex-shrink-0 pt-2.5 pb-2 px-4 z-20 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md rounded-t-[36px]"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-3" />
                
                <div className="flex items-center justify-between mb-3 px-1">
                    <h2 className="text-[17px] font-black text-white tracking-tight leading-none pl-1">Settings</h2>
                    <button 
                        onClick={onClose}
                        className="bg-white text-black text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full hover:bg-gray-200 transition-all shadow-lg active:scale-95 no-drag"
                    >
                        Done
                    </button>
                </div>

                <div className="relative group no-drag mb-2">
                    <Icons.Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors" />
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search preferences..."
                        className="w-full bg-[#151515] border border-white/5 focus:border-white/15 text-[13px] font-medium text-white placeholder-gray-600 rounded-xl pl-9 pr-8 py-2.5 outline-none transition-all focus:bg-[#202020]"
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white p-0.5 rounded-full hover:bg-white/10 transition-colors"
                        >
                            <Icons.X size={12} strokeWidth={3} />
                        </button>
                    )}
                </div>
            </div>

            {/* Scrollable Settings List */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-3 pt-3 flex flex-col gap-2 pb-8">
                
                {filteredData.map((category) => {
                    const CategoryIcon = (Icons as any)[category.icon] || Icons.List;
                    return (
                        <div key={category.id} className="animate-slide-up">
                            <div className="px-2 mb-1 flex items-center gap-1.5 opacity-60">
                                <CategoryIcon size={10} className="text-blue-400" />
                                <span className="text-[9px] font-black text-blue-100 uppercase tracking-[0.15em]">{category.title}</span>
                            </div>
                            
                            <div className="bg-[#121212] rounded-xl overflow-hidden border border-white/5 shadow-sm">
                                {category.items.map((item: any, idx: number) => (
                                    <SettingRow 
                                        key={item.id} 
                                        item={item} 
                                        value={settings[item.id]} 
                                        onChange={onUpdateSetting}
                                        isLast={idx === category.items.length - 1}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}

                {filteredData.length === 0 && (
                    <div className="text-center py-20 text-gray-700">
                        <Icons.Search size={32} className="mx-auto mb-3 opacity-10" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">No matching settings</p>
                    </div>
                )}

                {/* Footer Content (Scrolls with list) */}
                {!searchQuery && (
                    <div className="mt-3 flex flex-col gap-3 px-1">
                        {/* Log Out Button */}
                        <button 
                            onClick={() => logout()}
                            className="w-full py-2.5 rounded-xl bg-red-500/5 border border-red-500/10 text-red-500 font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-500/10 active:scale-[0.98] transition-all group"
                        >
                            <Icons.LogOut size={14} className="group-hover:translate-x-0.5 transition-transform" />
                            Log Out
                        </button>

                        {/* Interactive App Info */}
                        <div className="flex justify-center pb-6 mt-1">
                            <button 
                                onClick={handleCopyAppInfo}
                                className="text-center group transition-all active:scale-95"
                            >
                                <div className={`text-[9px] font-mono uppercase tracking-[0.25em] transition-all duration-500 ${appInfoCopied ? 'text-green-400 font-bold text-glow-green' : 'text-gray-700 group-hover:text-gray-500'}`}>
                                    {appInfoCopied ? 'Copied' : 'SkyReels v0.5.2'}
                                </div>
                                <div className={`text-[8px] font-bold uppercase tracking-[0.1em] mt-0.5 transition-all duration-500 ${appInfoCopied ? 'text-green-500/70' : 'text-gray-800 group-hover:text-gray-600'}`}>
                                    AT Protocol Federated
                                </div>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
        
        <style>{`
            .text-glow-green {
                text-shadow: 0 0 10px rgba(74, 222, 128, 0.5);
            }
        `}</style>
    </div>
  );
};

export default SettingsDrawer;
