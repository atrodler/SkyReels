
import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../constants';

interface LinksDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const LinksDrawer: React.FC<LinksDrawerProps> = ({ isOpen, onClose }) => {
    const [isRendered, setIsRendered] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const drawerRef = useRef<HTMLDivElement>(null);
    const startYRef = useRef(0);
    const [dragOffset, setDragOffset] = useState(0);

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;
        if (isOpen) {
            setIsRendered(true);
            setDragOffset(0);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setIsAnimating(true);
                });
            });
        } else {
            setIsAnimating(false);
            timeout = setTimeout(() => setIsRendered(false), 400);
        }
        return () => clearTimeout(timeout);
    }, [isOpen]);

    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
        startYRef.current = e.touches[0].clientY;
        if (drawerRef.current) drawerRef.current.style.transition = 'none';
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        const currentY = e.touches[0].clientY;
        const deltaY = currentY - startYRef.current;
        if (deltaY > 0) setDragOffset(deltaY);
    };

    const handleTouchEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);
        if (drawerRef.current) drawerRef.current.style.transition = 'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)';
        
        if (dragOffset > 100) onClose();
        else setDragOffset(0);
    };

    if (!isRendered) return null;
    
    const links = [
        { title: 'Official Portfolio', url: 'skywalker.design', fullUrl: '#', icon: Icons.Layout, color: 'text-purple-400 bg-purple-500/20 border-purple-500/30', badge: 'Verified' },
        { title: 'Source Code', url: 'github.com/skywalker', fullUrl: '#', icon: Icons.Github, color: 'text-white bg-white/10 border-white/20', badge: 'Open Source' },
        { title: 'Social Hub', url: 'linktr.ee/sky', fullUrl: '#', icon: Icons.Link, color: 'text-green-400 bg-green-500/20 border-green-500/30' },
    ];

    const currentTransform = `translateY(${isAnimating ? dragOffset : 100}%)`;

    return (
        <div className="fixed inset-0 z-[940] flex items-end justify-center pointer-events-none">
            <div 
                className={`absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity duration-400 ease-[cubic-bezier(0.32,0.72,0,1)] ${isAnimating ? 'opacity-100' : 'opacity-0'}`} 
                onClick={onClose} 
            />
            <div 
                ref={drawerRef}
                className="w-full max-w-md bg-[#121212]/80 backdrop-blur-xl border-t border-white/10 rounded-t-[30px] p-6 pb-10 pointer-events-auto transform transition-transform duration-[400ms] cubic-bezier(0.32, 0.72, 0, 1) shadow-2xl"
                style={{ transform: currentTransform }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />
                <div className="space-y-3">
                    {links.map((link, i) => (
                        <a key={i} href={link.fullUrl} className="flex items-center gap-4 p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all active:scale-95 group">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-105 ${link.color}`}>
                                <link.icon size={22} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <h4 className="font-bold text-white text-sm">{link.title}</h4>
                                    {link.badge && <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-gray-300 border border-white/5 font-medium">{link.badge}</span>}
                                </div>
                                <p className="text-xs text-gray-500 truncate font-mono">{link.url}</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-white transition-colors">
                                <Icons.ExternalLink size={14} />
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    )
};

export default LinksDrawer;
