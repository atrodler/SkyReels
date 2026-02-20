
// ... imports ...
import React, { useState, useEffect, useRef } from 'react';
import { Icons, CURRENT_USER } from '../constants';

interface EditProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const EditProfileDrawer: React.FC<EditProfileDrawerProps> = ({ isOpen, onClose }) => {
  const [isRendered, setIsRendered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const [displayName, setDisplayName] = useState(CURRENT_USER.displayName);
  const [bio, setBio] = useState('Digital explorer & visual storyteller. 🌌 Capturing the aesthetic of the future.');
  const [links, setLinks] = useState<string[]>(['']); // Start with one empty link field
  
  // Drag State
  const [isDragging, setIsDragging] = useState(false);
  const drawerRef = useRef(null);
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
      timeout = setTimeout(() => setIsRendered(false), 400); // Sync to duration
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

  // ... (handlers remain the same) ...
  const handleAddLink = () => {
      if (links.length < 3) {
          setLinks([...links, '']);
      }
  };

  const handleRemoveLink = (index: number) => {
      const newLinks = [...links];
      newLinks.splice(index, 1);
      setLinks(newLinks);
  };

  const handleLinkChange = (index: number, value: string) => {
      const newLinks = [...links];
      newLinks[index] = value;
      setLinks(newLinks);
  };

  if (!isRendered) return null;

  return (
    <div className="absolute inset-0 z-[150] flex items-end justify-center pointer-events-none">
       {/* Backdrop */}
       <div 
         className={`absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity duration-[400ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${isAnimating ? 'opacity-100' : 'opacity-0'}`} 
         onClick={onClose}
       />

       {/* Drawer */}
       <div 
         ref={drawerRef}
         className={`w-full max-w-md bg-[#0a0a0a]/80 backdrop-blur-3xl saturate-150 rounded-t-[35px] pointer-events-auto border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.6)] transform transition-transform duration-[400ms] will-change-transform cubic-bezier(0.32, 0.72, 0, 1) ${isAnimating ? 'translate-y-0' : 'translate-y-full'} pb-8 flex flex-col relative`}
         onTouchStart={handleTouchStart}
         onTouchMove={handleTouchMove}
         onTouchEnd={handleTouchEnd}
       >
           {/* ... Content ... */}
           {/* Handle - Absolutely Positioned */}
           <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-white/20 rounded-full pointer-events-none z-20" />
           
           {/* Header */}
           <div className="h-[60px] flex justify-between items-center px-5 border-b border-white/5 flex-shrink-0 relative">
               <button onClick={onClose} className="text-white/70 hover:text-white text-[15px] font-medium transition-colors z-10">Cancel</button>
               
               <h3 className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 text-sm font-bold text-white uppercase tracking-wider">Edit Profile</h3>
               
               <button 
                   onClick={onClose} 
                   className="bg-white text-black hover:bg-gray-200 text-[14px] font-bold px-5 py-1.5 rounded-full transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)] transform active:scale-95 z-10"
                >
                   Save
               </button>
           </div>

           {/* Content - No Scrollbar, compact layout */}
           <div className="p-6 flex flex-col gap-5">
                
                {/* 1. Integrated Avatar & Name Row */}
                <div className="flex items-start gap-5">
                    {/* Left: Avatar */}
                    <div className="flex flex-col items-center gap-2 pt-1">
                        <div className="relative group cursor-pointer">
                            <div className="w-20 h-20 rounded-full p-[2px] bg-gradient-to-tr from-white/20 to-white/5 border border-white/10">
                                <img src={CURRENT_USER.avatarUrl} className="w-full h-full rounded-full object-cover opacity-100 group-hover:opacity-80 transition-opacity" alt="Current Avatar" />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="bg-black/40 backdrop-blur-md p-1.5 rounded-full border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity transform scale-90 group-hover:scale-100 duration-200">
                                    <Icons.Image size={16} className="text-white" />
                                </div>
                            </div>
                        </div>
                        <button className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors">Edit photo</button>
                    </div>

                    {/* Right: Display Name Input */}
                    <div className="flex-1 space-y-1.5 pt-0.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Display Name</label>
                        <div className="bg-white/5 border border-white/5 rounded-xl px-4 py-3 focus-within:border-blue-500/50 focus-within:bg-white/10 transition-colors flex items-center gap-3 h-[50px]">
                            <Icons.User size={16} className="text-gray-500 flex-shrink-0" />
                            <input 
                                type="text" 
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="bg-transparent text-sm font-bold text-white w-full focus:outline-none placeholder-gray-600"
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Description (Bio) */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Description</label>
                    <div className="bg-white/5 border border-white/5 rounded-xl px-4 py-3 focus-within:border-blue-500/50 focus-within:bg-white/10 transition-colors flex items-start gap-3">
                        <Icons.Edit size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
                        <textarea 
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={3}
                            className="bg-transparent text-sm text-gray-200 w-full focus:outline-none placeholder-gray-600 resize-none leading-relaxed"
                        />
                    </div>
                </div>

                {/* 3. Links Section */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Links ({links.length}/3)</label>
                    </div>
                    
                    <div className="space-y-2">
                        {links.map((link, index) => {
                            const isLast = index === links.length - 1;
                            const canAdd = links.length < 3;
                            const isOnlyOne = links.length === 1;

                            return (
                                <div key={index} className="flex gap-2 items-center animate-slide-up">
                                    <div className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-3 focus-within:border-blue-500/50 focus-within:bg-white/10 transition-colors flex items-center gap-3 h-[50px]">
                                        <Icons.Link size={16} className="text-gray-500 flex-shrink-0" />
                                        <input 
                                            type="text" 
                                            value={link}
                                            onChange={(e) => handleLinkChange(index, e.target.value)}
                                            placeholder="https://"
                                            className="bg-transparent text-sm font-medium text-white w-full focus:outline-none placeholder-gray-600"
                                        />
                                    </div>
                                    
                                    <button 
                                        onClick={() => {
                                            if (isOnlyOne) {
                                                handleLinkChange(index, '');
                                            } else {
                                                handleRemoveLink(index);
                                            }
                                        }}
                                        className={`w-[50px] h-[50px] rounded-xl bg-white/5 border border-white/5 flex items-center justify-center transition-colors flex-shrink-0 ${isOnlyOne ? 'hover:bg-white/10 hover:border-white/10 text-gray-500 hover:text-white' : 'hover:bg-red-500/20 hover:border-red-500/30 text-gray-500 hover:text-red-500'}`}
                                        title={isOnlyOne ? "Clear" : "Remove"}
                                    >
                                        {isOnlyOne ? <Icons.Eraser size={18} /> : <Icons.Trash size={18} />}
                                    </button>

                                    {/* Inline Add Button on the last row */}
                                    {isLast && canAdd && (
                                        <button 
                                            onClick={handleAddLink}
                                            className="w-[50px] h-[50px] rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 hover:border-blue-500/50 flex items-center justify-center text-blue-400 hover:text-blue-300 transition-colors flex-shrink-0"
                                        >
                                            <Icons.Plus size={20} />
                                        </button>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

           </div>
       </div>
    </div>
  );
};

export default EditProfileDrawer;
