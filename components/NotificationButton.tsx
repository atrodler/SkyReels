
import React from 'react';
import { Icons } from '../constants';

interface NotificationButtonProps {
  onClick?: () => void;
  className?: string;
  isOpen?: boolean;
}

const NotificationButton: React.FC<NotificationButtonProps> = ({ onClick, className = "", isOpen = false }) => {
  return (
    <button 
        onClick={onClick}
        className={`h-[40px] w-[40px] min-w-[40px] flex items-center justify-center rounded-full bg-black/60 backdrop-blur-3xl border border-white/20 text-white hover:bg-white/10 transition-colors shadow-2xl relative flex-shrink-0 ${className}`}
    >
        {isOpen ? <Icons.X size={20} /> : <Icons.Bell size={20} />}
        {/* Notification Badge - Only show if not open */}
        {!isOpen && (
            <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-black animate-pulse"></div>
        )}
    </button>
  );
};

export default NotificationButton;
