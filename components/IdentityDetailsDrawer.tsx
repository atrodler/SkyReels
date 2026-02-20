
// ... imports ...
import React, { useState, useEffect, useRef } from 'react';
import { Icons, PUBLIC_SERVERS } from '../constants';
import { User } from '../types';

interface IdentityDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

// ... helper IdentityRow component ...
const IdentityRow: React.FC<{ 
    title: string, 
    value: string,
    subValue?: React.ReactNode,
    icon: any, 
    onCopy: () => void
}> = ({ title, value, subValue, icon: Icon, onCopy }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        onCopy();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex items-center gap-4 py-4 border-b border-white/5 last:border-0 group">
            {/* Icon Column */}
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center flex-shrink-0 text-gray-400 group-hover:text-white group-hover:bg-white/10 transition-all">
                <Icon size={20} />
            </div>

            {/* Content Column */}
            <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">{title}</div>
                <div className="text-sm font-medium text-gray-200 truncate font-mono">{value}</div>
                {subValue && <div className="text-xs font-bold mt-0.5 truncate">{subValue}</div>}
            </div>

            {/* Copy Button */}
            <button 
                onClick={handleCopy}
                className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all active:scale-95 ${copied ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-transparent border-transparent hover:bg-white/5 text-gray-500 hover:text-white'}`}
            >
                {copied ? <Icons.Check size={18} /> : <Icons.Copy size={18} />}
            </button>
        </div>
    );
};

const IdentityDetailsDrawer: React.FC<IdentityDetailsDrawerProps> = ({ isOpen, onClose, user }) => {
  const [isRendered, setIsRendered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [allCopied, setAllCopied] = useState(false);
  const [showFederationInfo, setShowFederationInfo] = useState(false);
  
  // Drag State
  const [isDragging, setIsDragging] = useState(false);
  const drawerRef = useRef(null);
  const startYRef = useRef(0);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (isOpen) {
      setIsRendered(true);
      setShowFederationInfo(false); 
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

  if (!isRendered || !user) return null;

  // Logic
  const cleanHandle = user.handle.replace('@', '');
  const hostServer = PUBLIC_SERVERS.find(server => cleanHandle.endsWith(server));
  const isCustomDomain = !hostServer;
  const did = `did:plc:${user.id}-7382-4211-8392-a72b`; // Mock realistic full DID
  const pdsEndpoint = isCustomDomain ? `https://pds.${cleanHandle}` : `https://bsky.social`;
  
  const handleCopyAll = () => {
      const data = JSON.stringify({ handle: cleanHandle, did, pds: pdsEndpoint }, null, 2);
      navigator.clipboard.writeText(data);
      setAllCopied(true);
      setTimeout(() => setAllCopied(false), 2000);
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
  };

  return (
    <div className="absolute inset-0 z-[910] flex items-end justify-center pointer-events-none">
       {/* Backdrop */}
       <div 
         className={`absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity duration-[400ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${isAnimating ? 'opacity-100' : 'opacity-0'}`} 
         onClick={onClose}
       />

       {/* Drawer */}
       <div 
         ref={drawerRef}
         className={`w-full max-w-md bg-[#0a0a0a]/80 backdrop-blur-3xl saturate-150 rounded-t-[35px] pointer-events-auto border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.6)] transform transition-transform duration-[400ms] will-change-transform cubic-bezier(0.32, 0.72, 0, 1) ${isAnimating ? 'translate-y-0' : 'translate-y-full'} flex flex-col relative max-h-[85vh]`}
         onTouchStart={handleTouchStart}
         onTouchMove={handleTouchMove}
         onTouchEnd={handleTouchEnd}
       >
           {/* ... Content ... */}
           {/* Handle */}
           <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-white/20 rounded-full pointer-events-none z-20" />
           
           {/* Header */}
           <div className="h-[60px] flex items-center justify-between px-6 border-b border-white/5 flex-shrink-0">
               <div className="flex items-center gap-2">
                   <Icons.Fingerprint size={18} className="text-blue-500" />
                   <h3 className="text-sm font-bold text-white uppercase tracking-wider">Network Identity</h3>
               </div>
               <button 
                  onClick={handleCopyAll}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all ${allCopied ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-white/5 text-gray-400 border-white/5 hover:text-white hover:bg-white/10'}`}
               >
                   {allCopied ? 'COPIED' : 'COPY ALL'}
               </button>
           </div>

           <div className="overflow-y-auto no-scrollbar flex-1 px-5 pt-2">
                
               {/* 1. DECENTRALIZED ID (DID) */}
               <IdentityRow 
                    title="Decentralized ID (DID)"
                    value={did}
                    icon={Icons.Hash}
                    onCopy={() => copyToClipboard(did)}
               />

               {/* 2. HANDLE RESOLUTION */}
               <IdentityRow 
                    title="Handle Resolution"
                    value={cleanHandle}
                    subValue={<span className="text-blue-400">Hosted on {isCustomDomain ? cleanHandle : hostServer}</span>}
                    icon={Icons.AtSign}
                    onCopy={() => copyToClipboard(cleanHandle)}
               />

               {/* 3. PERSONAL DATA SERVER (PDS) */}
               <IdentityRow 
                    title="Personal Data Server (PDS)"
                    value={pdsEndpoint}
                    subValue={<span className="text-emerald-400 flex items-center gap-1.5">Status: Online (24ms)</span>}
                    icon={Icons.Server}
                    onCopy={() => copyToClipboard(pdsEndpoint)}
               />

               {/* 4. DATA REPOSITORY */}
               <IdentityRow 
                    title="Data Repository"
                    value="Signed & Authenticated"
                    subValue={<span className="text-blue-400">Created: October 25, 2023</span>}
                    icon={Icons.Database}
                    onCopy={() => copyToClipboard("Signed & Authenticated")}
               />

           </div>
           
           {/* Footer: Federated Network Button */}
           <div className="p-6 pt-2 pb-8 flex flex-col items-center relative">
                {/* Popup - Absolute positioned above the button */}
                <div 
                    className={`absolute bottom-[70px] left-6 right-6 bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 shadow-2xl transition-all duration-300 origin-bottom ${showFederationInfo ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'}`}
                >
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-500/10 rounded-lg text-green-400"><Icons.Globe size={16} /></div>
                        <div>
                            <h4 className="text-xs font-bold text-white mb-1">Open Network</h4>
                            <p className="text-[11px] text-gray-400 leading-relaxed">
                                This account is portable. You can move your profile and content to any other server without losing your identity.
                            </p>
                        </div>
                        <button onClick={() => setShowFederationInfo(false)} className="text-gray-500 hover:text-white"><Icons.X size={14}/></button>
                    </div>
                </div>

                <button 
                    onClick={() => setShowFederationInfo(!showFederationInfo)}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] group"
                >
                    <Icons.Globe size={14} className="text-green-500 group-hover:text-green-400 transition-colors" />
                    <span className="text-xs font-bold text-gray-300 group-hover:text-white uppercase tracking-wide">Federated Network</span>
                    <Icons.Info size={12} className="text-gray-600 group-hover:text-gray-400" />
                </button>
           </div>
       </div>
    </div>
  );
};

export default IdentityDetailsDrawer;
