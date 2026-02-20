
// ... imports ...
import React, { useEffect, useState, useRef } from 'react';
import { Icons, linkifyText } from '../constants';

interface FeedInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  feed: any;
  onCreatorClick?: (handle: string) => void;
  onToggleSave?: (feedUri: string) => void;
  onTogglePin?: (feedUri: string) => void;
}

const FeedInfoModal: React.FC<FeedInfoModalProps> = ({ 
  isOpen, 
  onClose, 
  feed, 
  onCreatorClick,
  onToggleSave,
  onTogglePin
}) => {
  const [isRendered, setIsRendered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [copiedUri, setCopiedUri] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showLogic, setShowLogic] = useState(false);
  
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
      timeout = setTimeout(() => {
          setIsRendered(false);
          setShowLogic(false); // Reset accordion on close
      }, 400); // 400ms
    }
    return () => clearTimeout(timeout);
  }, [isOpen]);

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

  const handleCopyUri = () => {
    if (feed?.uri) {
        navigator.clipboard.writeText(feed.uri);
        setCopiedUri(true);
        setTimeout(() => setCopiedUri(false), 2000);
    }
  };

  if (!isRendered || !feed) return null;
  const IconComponent = (Icons as any)[feed.icon] || Icons.Hash || (() => <span />);

  const DetailRow: React.FC<{ icon: any, label: string, value?: string }> = ({ icon: Icon, label, value }) => (
      <div className="flex items-center justify-between text-xs py-2 border-b border-white/5 last:border-0">
          <span className="text-gray-400 flex items-center gap-2"><Icon size={14} className="text-gray-500"/> {label}</span>
          <span className={`font-bold truncate max-w-[150px] ${value ? 'text-white' : 'text-red-500'}`}>{value || 'Not Available'}</span>
      </div>
  );

  return (
    <div className="absolute inset-0 z-[170] flex items-end justify-center pointer-events-none">
        <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity duration-[400ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${isAnimating ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
        <div ref={drawerRef} className={`w-full max-w-md bg-[#0a0a0a]/80 backdrop-blur-3xl saturate-150 rounded-t-[35px] pointer-events-auto border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.6)] transform transition-transform duration-[400ms] will-change-transform cubic-bezier(0.32, 0.72, 0, 1) ${isAnimating ? 'translate-y-0' : 'translate-y-full'} flex flex-col max-h-[90vh]`} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-white/20 rounded-full pointer-events-none z-20" />
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar p-6 pt-10 flex flex-col gap-4">
                <div className="flex items-start gap-4">
                     {feed.avatar ? <img src={feed.avatar} alt={feed.name} className="w-16 h-16 rounded-2xl object-cover border border-white/10 shadow-lg" /> : <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0 shadow-lg"><IconComponent size={32} /></div>}
                     <div className="min-w-0 flex-1 pt-1">
                        <h2 className="text-2xl font-black text-white leading-tight truncate tracking-tight">{feed.name}</h2>
                        <div className="flex items-center gap-1.5 text-gray-400 mt-1">
                            <span className="text-[11px] font-medium">Curated by</span>
                            <button 
                                onClick={() => onCreatorClick?.(feed.creatorHandle)}
                                className="flex items-center gap-1 text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-lg text-[10px] font-bold truncate max-w-[150px] border border-blue-500/20 active:scale-95 transition-all hover:bg-blue-500/20"
                            >
                                @{feed.creatorHandle || 'user.bsky.social'}{feed.label === 'Verified Domain' && <Icons.Check size={10} strokeWidth={4} />}
                            </button>
                        </div>
                    </div>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed font-medium">{linkifyText(feed.description)}</p>
                <div className="flex flex-wrap gap-2">
                    <div className="bg-white/5 rounded-lg px-2.5 py-1.5 border border-white/5 flex flex-col items-center min-w-[70px]"><span className="text-[9px] text-gray-500 font-bold uppercase">Type</span><span className={`text-[11px] font-bold ${feed.type ? 'text-white' : 'text-red-500'}`}>{feed.type || 'N/A'}</span></div>
                    <div className="bg-white/5 rounded-lg px-2.5 py-1.5 border border-white/5 flex flex-col items-center min-w-[70px]"><span className="text-[9px] text-gray-500 font-bold uppercase">Lang</span><span className={`text-[11px] font-bold ${feed.language ? 'text-white' : 'text-red-500'}`}>{feed.language || 'N/A'}</span></div>
                    <div className="bg-white/5 rounded-lg px-2.5 py-1.5 border border-white/5 flex flex-col items-center min-w-[70px]"><span className="text-[9px] text-gray-500 font-bold uppercase">Created</span><span className={`text-[11px] font-bold ${feed.created ? 'text-white' : 'text-red-500'}`}>{feed.created ? feed.created.split('-')[0] : 'N/A'}</span></div>
                    <div className="bg-white/5 rounded-lg px-2.5 py-1.5 border border-white/5 flex flex-col items-center min-w-[70px] flex-1"><span className="text-[9px] text-gray-500 font-bold uppercase">Subscribers</span><span className="text-[11px] font-bold text-white">{feed.subscribers}</span></div>
                </div>
                <div>
                  <button 
                    onClick={() => setShowLogic(!showLogic)}
                    className="w-full flex items-center justify-between mb-3 pl-1 group no-drag"
                  >
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-gray-400 transition-colors">Algorithm & Logic</h3>
                    <Icons.ChevronDown size={14} className={`text-gray-600 transition-transform duration-300 ${showLogic ? 'rotate-180' : ''}`} />
                  </button>
                  {showLogic && (
                    <div className="bg-black/20 rounded-2xl border border-white/5 px-4 py-1 animate-slide-down">
                      <DetailRow icon={Icons.List} label="Sorting Method" value={feed.behavior?.sorting} />
                      <DetailRow icon={Icons.Filter} label="Filter Rules" value={feed.behavior?.filterRules?.join(', ')} />
                      <DetailRow icon={Icons.Layers} label="Content Types" value={feed.behavior?.includedTypes?.join(', ')} />
                      <DetailRow icon={Icons.MessageCircle} label="Reply Context" value={feed.behavior?.replyRules} />
                      <DetailRow icon={Icons.VolumeX} label="Mute Policy" value={feed.behavior?.muteRules} />
                      <DetailRow icon={Icons.Clock} label="Refresh Rate" value={feed.behavior?.frequency} />
                    </div>
                  )}
                </div>
                <div><button onClick={handleCopyUri} className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 border transition-all duration-300 cursor-pointer group ${copiedUri ? 'bg-green-500/10 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.15)] opacity-100' : 'bg-[#121212] border-white/5 opacity-80 hover:opacity-100'}`}><div className={`p-1.5 rounded-lg transition-colors ${copiedUri ? 'bg-green-500/20 text-green-500' : 'bg-white/5 text-gray-500'}`}>{copiedUri ? <Icons.Check size={12} /> : <Icons.Link size={12} />}</div><div className={`text-[10px] font-mono truncate flex-1 text-left transition-colors ${copiedUri ? 'text-green-400 font-bold' : 'text-gray-500'}`}>{feed.uri}</div>{copiedUri ? <div className="flex items-center gap-1.5 animate-slide-up"><span className="text-[9px] font-bold text-green-500 uppercase tracking-wider">Copied</span></div> : <Icons.Copy size={12} className="text-gray-500 group-hover:text-white transition-colors" />}</button></div>
                <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => onToggleSave?.(feed.uri)}
                      className={`flex-1 h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${feed.viewerState?.isSaved ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                      <Icons.Bookmark size={18} className={feed.viewerState?.isSaved ? 'fill-black' : ''} />
                      {feed.viewerState?.isSaved ? 'Saved' : 'Save Feed'}
                    </button>
                    <button 
                      onClick={() => onTogglePin?.(feed.uri)}
                      className={`flex-1 h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${feed.viewerState?.isPinned ? 'bg-blue-600 text-white shadow-blue-500/20' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                      <div className="rotate-45"><Icons.AtSign size={18} /></div>
                      {feed.viewerState?.isPinned ? 'Pinned' : 'Pin to Home'}
                    </button>
                    <button className="h-12 w-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white flex items-center justify-center transition-colors active:scale-90"><Icons.Share2 size={20} /></button>
                    <button className="h-12 w-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-red-400 flex items-center justify-center transition-colors active:scale-90"><Icons.Flag size={20} /></button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default FeedInfoModal;
