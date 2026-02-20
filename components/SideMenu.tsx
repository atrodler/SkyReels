
import React, { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { Icons, CURRENT_USER, MOCK_ACCOUNTS } from '../constants';
import AnimatedDropdown from './AnimatedDropdown';
import { User } from '../types';

interface SideMenuProps {
    isOpen?: boolean;
    onClose?: () => void;
    // Navigation Handlers
    onTabChange?: (index: number) => void;
    onLibrarySelect?: (tabName: string) => void;
    onSearchNavigate?: (tab: 'EXPLORE' | 'FEEDS' | 'TRENDS') => void;
    onOpenSettings?: () => void;
    onOpenSearch?: () => void;
    // Legacy props kept for compatibility but unused in primary scroller
    onFeedSelect?: (feedName: string) => void;
    onFeedInfo?: (feed: any) => void;
    settings?: Record<string, any>;
    onSettingChange?: (id: string, value: any) => void;
    onDiscoverFeeds?: () => void;
    onManageFeeds?: () => void;
    onOpenLibrary?: () => void;
    feeds?: any[];
    currentUser?: User | null;
}

const ScrollingMenuLabel: React.FC<{ text: string }> = ({ text }) => {
    const [shouldScroll, setShouldScroll] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (containerRef.current && textRef.current) {
            setShouldScroll(textRef.current.offsetWidth > containerRef.current.offsetWidth);
        }
    }, [text]);

    return (
        <div ref={containerRef} className={`flex-1 overflow-hidden relative h-5 flex items-center min-w-0 ${shouldScroll ? 'mask-image-gradient-menu' : ''}`}>
             <style>
                {`
                @keyframes marquee-menu {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee-menu {
                    animation: marquee-menu 10s linear infinite;
                }
                .mask-image-gradient-menu {
                    mask-image: linear-gradient(to right, black 85%, transparent 100%);
                    -webkit-mask-image: linear-gradient(to right, black 85%, transparent 100%);
                }
                `}
            </style>
            
            {shouldScroll ? (
                <div className="flex whitespace-nowrap animate-marquee-menu gap-6">
                    <span className="text-[13px] font-medium text-gray-300 group-hover:text-white tracking-wide transition-colors">{text}</span>
                    <span className="text-[13px] font-medium text-gray-300 group-hover:text-white tracking-wide transition-colors">{text}</span>
                </div>
            ) : (
                <span ref={textRef} className="text-[13px] font-medium text-gray-300 group-hover:text-white tracking-wide transition-colors w-full text-left truncate">
                    {text}
                </span>
            )}
        </div>
    );
};

const MenuRow: React.FC<{ 
    label: string; 
    icon: any; 
    onClick: () => void; 
    badge?: string | number;
    badgeColor?: string;
}> = ({ label, icon: Icon, onClick, badge, badgeColor = 'bg-blue-500' }) => (
    <button 
        onClick={onClick}
        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/10 transition-all group relative overflow-hidden active:scale-[0.98] border-l-2 border-transparent hover:border-white/50"
    >
        <div className="w-5 flex justify-center text-gray-400 group-hover:text-white transition-colors relative z-10 flex-shrink-0">
            <Icon size={18} strokeWidth={2} />
        </div>
        
        <ScrollingMenuLabel text={label} />

        {badge && (
             <span className={`ml-auto text-[9px] font-bold text-white min-w-[18px] h-[18px] flex items-center justify-center rounded-full shadow-[0_0_10px_rgba(59,130,246,0.4)] ${badgeColor} relative z-10 leading-none flex-shrink-0`}>{badge}</span>
        )}
    </button>
);

const CategoryLabel: React.FC<{ children: string }> = ({ children }) => (
    <div className="flex items-center px-4 pt-4 pb-2 opacity-60">
        <div className="w-2 h-[1px] bg-white/60 mr-3"></div>
        <span className="text-[9px] font-black text-white/90 uppercase tracking-[0.15em] whitespace-nowrap mr-3">{children}</span>
        <div className="flex-1 h-[1px] bg-white/10"></div>
    </div>
);

const SideMenu = forwardRef<HTMLDivElement, SideMenuProps>(({ 
    isOpen = false, 
    onClose, 
    onTabChange, 
    onLibrarySelect, 
    onSearchNavigate, 
    onOpenSettings,
    onManageFeeds,
    onDiscoverFeeds,
    onOpenSearch,
    currentUser
}, ref) => {
  const user = currentUser || CURRENT_USER;
  const [activeAccount, setActiveAccount] = useState(user.id);
  const [showUserSwitcher, setShowUserSwitcher] = useState(false);
  
  const [internalDragX, setInternalDragX] = useState(0); 
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<number | null>(null);
  
  const menuRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => menuRef.current!);

  const handleSwitchAccount = (id: string) => {
      setActiveAccount(id);
      setShowUserSwitcher(false);
  };

  const handleNavigation = (action: () => void) => {
      action();
      if (onClose) onClose();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
      dragStartRef.current = e.touches[0].clientX;
      setIsDragging(true);
      if (menuRef.current) menuRef.current.style.transition = 'none'; 
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      const start = dragStartRef.current;
      if (start === null) return;
      const currentX = e.touches[0].clientX;
      const diff = currentX - start;
      if (diff < 0) setInternalDragX(diff);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
      setIsDragging(false);
      dragStartRef.current = null;
      if (menuRef.current) menuRef.current.style.transition = ''; 
      if (internalDragX < -100 && onClose) {
          onClose();
      } else {
          setInternalDragX(0); 
      }
  };

  return (
    <div className={`absolute inset-0 z-[70] overflow-hidden ${!isOpen ? 'pointer-events-none' : 'pointer-events-auto'}`}>
        <div 
            className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-500 will-change-[opacity] backdrop-layer ${isOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={onClose}
        />

        <div 
            ref={menuRef}
            className={`absolute inset-y-0 left-0 w-[280px] bg-[#050505]/85 backdrop-blur-3xl saturate-150 border-r border-white/10 text-white flex flex-col shadow-[10px_0_40px_rgba(0,0,0,0.5)] transform transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform ${isOpen && !isDragging ? 'translate-x-0 opacity-100' : '-translate-x-[110%] opacity-0 invisible'}`}
            style={isDragging ? { transform: `translateX(${internalDragX}px)`, opacity: 1, visibility: 'visible' } : undefined}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <div className="flex-shrink-0 px-3 pt-[7px] pb-2 z-20 flex items-center gap-3">
                {/* Spacer for global fixed Menu button */}
                <div className="w-[40px] h-[40px] flex-shrink-0" />

                <div className="relative flex-1 min-w-0">
                    <button 
                        onClick={() => setShowUserSwitcher(!showUserSwitcher)}
                        className={`w-full flex items-center gap-3 p-1.5 pr-3 rounded-2xl border transition-all active:scale-[0.98] group ${showUserSwitcher ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'}`}
                    >
                        <div className="relative flex-shrink-0">
                            <div className="w-9 h-9 rounded-full p-[1.5px] bg-gradient-to-tr from-white/20 to-white/5 border border-white/10">
                                <img src={user.avatarUrl} className="w-full h-full rounded-full bg-gray-800 object-cover" alt="" />
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 bg-[#09090b] rounded-full p-[1.5px]">
                                <div className="w-2.5 h-2.5 bg-green-500 rounded-full border border-green-400/20 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div>
                            </div>
                        </div>
                        
                        <div className="flex flex-col items-start min-w-0 flex-1">
                            <span className="text-[13px] font-bold text-white truncate w-full text-left leading-tight group-hover:text-blue-200 transition-colors">
                                {user.displayName}
                            </span>
                            <span className="text-[10px] font-medium text-gray-400 truncate w-full text-left leading-none mt-0.5 font-mono">
                                @{user.handle.split('.')[0]}
                            </span>
                        </div>

                        <div className={`w-6 h-6 rounded-full bg-white/5 flex items-center justify-center transition-all flex-shrink-0 ${showUserSwitcher ? 'bg-white/20 text-white rotate-180' : 'text-gray-500 group-hover:text-white'}`}>
                            <Icons.ChevronDown size={14} />
                        </div>
                    </button>

                    <AnimatedDropdown 
                        isOpen={showUserSwitcher}
                        className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[60] origin-top"
                    >
                        <div className="p-1.5 space-y-0.5">
                            <button 
                                key={user.id}
                                onClick={() => handleSwitchAccount(user.id)}
                                className={`w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors bg-white/5`}
                            >
                                <img src={user.avatarUrl} className="w-8 h-8 rounded-full border border-white/10" alt="" />
                                <div className="text-left flex-1 overflow-hidden">
                                    <div className="text-xs font-bold text-white truncate">{user.displayName}</div>
                                    <div className="text-[10px] text-gray-500 truncate">{user.handle}</div>
                                </div>
                                <Icons.Check size={14} className="text-blue-500" />
                            </button>

                            <div className="h-[1px] bg-white/5 my-1 mx-2" />
                            <button className="w-full text-left px-3 py-2.5 text-[11px] font-bold text-gray-400 hover:text-white hover:bg-white/5 rounded-xl flex items-center gap-2 transition-colors">
                                <Icons.Plus size={14} /> Add Account
                            </button>
                        </div>
                    </AnimatedDropdown>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar py-2">
                <CategoryLabel>Personal</CategoryLabel>
                <div className="space-y-0.5">
                    <MenuRow 
                        label="Profile" 
                        icon={Icons.User} 
                        onClick={() => handleNavigation(() => onTabChange?.(3))} 
                    />
                    <MenuRow 
                        label="Messages" 
                        icon={Icons.MessageCircle} 
                        onClick={() => handleNavigation(() => onTabChange?.(2))} 
                        badge="4"
                        badgeColor="bg-red-500"
                    />
                    <MenuRow 
                        label="My Feeds" 
                        icon={Icons.Grid} 
                        onClick={() => handleNavigation(() => onManageFeeds?.())} 
                    />
                </div>

                <CategoryLabel>Discover</CategoryLabel>
                <div className="space-y-0.5">
                    <MenuRow 
                        label="Explore" 
                        icon={Icons.Compass} 
                        onClick={() => handleNavigation(() => onSearchNavigate?.('EXPLORE'))} 
                    />
                    <MenuRow 
                        label="Feeds" 
                        icon={Icons.Hash} 
                        onClick={() => handleNavigation(() => onSearchNavigate?.('FEEDS'))} 
                    />
                    <MenuRow 
                        label="Trends" 
                        icon={Icons.TrendingUp} 
                        onClick={() => handleNavigation(() => onSearchNavigate?.('TRENDS'))} 
                    />
                    <MenuRow 
                        label="Search" 
                        icon={Icons.Search} 
                        onClick={() => handleNavigation(() => onOpenSearch?.())} 
                    />
                </div>

                <CategoryLabel>Library</CategoryLabel>
                <div className="space-y-0.5">
                    <MenuRow 
                        label="Saved" 
                        icon={Icons.Bookmark} 
                        onClick={() => handleNavigation(() => onLibrarySelect?.('Saved'))} 
                    />
                    <MenuRow 
                        label="Lists" 
                        icon={Icons.List} 
                        onClick={() => handleNavigation(() => onLibrarySelect?.('Lists'))} 
                    />
                    <MenuRow 
                        label="Likes" 
                        icon={Icons.Heart} 
                        onClick={() => handleNavigation(() => onLibrarySelect?.('Likes'))} 
                    />
                    <MenuRow 
                        label="History" 
                        icon={Icons.Clock} 
                        onClick={() => handleNavigation(() => onLibrarySelect?.('History'))} 
                    />
                </div>
            </div>

            <div className="p-2 border-t border-white/5 bg-black/20 backdrop-blur-md">
                <MenuRow 
                    label="Settings" 
                    icon={Icons.Settings} 
                    onClick={() => handleNavigation(() => onOpenSettings?.())} 
                />
            </div>
        </div>
    </div>
  );
});

export default SideMenu;
