
import React from 'react';
import { Icons, PUBLIC_SERVERS } from '../constants';

interface UserHandleProps {
  handle: string;
  variant?: 'default' | 'content' | 'comment';
  timestamp?: string;
}

const CHECK_PATH = "M20 6L9 17l-5-5";

const VERIFIED_ON_PUBLIC = [
    'sky.walker.bsky.social',
    'pixel.artist.mastodon.social',
    'official.admin.social.co',
    'skywalker.bsky.social',
    'pixel-artist.atm.blue'
];

const formatTimeShort = (ts: string) => {
    if (!ts) return '';
    
    // Handle relative strings (common in mocks or pre-formatted data)
    if (typeof ts === 'string' && ts.includes('ago')) {
        let short = ts.replace(' ago', '');
        short = short.replace(' hours', 'h').replace(' hour', 'h');
        short = short.replace(' minutes', 'm').replace(' minute', 'm');
        short = short.replace(' days', 'd').replace(' day', 'd');
        short = short.replace(' weeks', 'w').replace(' week', 'w');
        short = short.replace(' months', 'mo').replace(' month', 'mo');
        short = short.replace(' years', 'y').replace(' year', 'y');
        return short;
    }

    // Handle ISO Date Strings
    const date = new Date(ts);
    if (!isNaN(date.getTime())) {
        const now = new Date();
        const diff = (now.getTime() - date.getTime()) / 1000;
        
        if (diff < 60) return 'now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
        if (diff < 31536000) return `${Math.floor(diff / 604800)}w`;
        return `${Math.floor(diff / 31536000)}y`;
    }

    return ts;
};

const UserHandle: React.FC<UserHandleProps> = ({ handle, variant = 'default', timestamp }) => {
  const cleanHandle = handle.replace('@', '');
  const hostServer = PUBLIC_SERVERS.find(server => cleanHandle.endsWith(server));
  
  const isVerified = hostServer 
    ? VERIFIED_ON_PUBLIC.includes(cleanHandle) 
    : true;

  const textClass = "text-[11px] font-bold leading-none tracking-wide text-white drop-shadow-sm pb-px";
  
  // Theme logic for the pill container
  let themeClasses = "bg-[#1a1a1a] border-white/10 shadow-md";
  if (variant === 'content') {
    // More transparent for multimedia overlay - subtle presence
    themeClasses = "bg-black/25 backdrop-blur-md border-white/10 shadow-none";
  } else if (variant === 'comment') {
    // Darker for comment lists - improved focus on text against dark gray background
    themeClasses = "bg-black/60 border-white/10 shadow-sm";
  }

  const pillContainerClass = `h-[22px] inline-flex items-center rounded-full border ${themeClasses} transition-colors group-hover:border-white/30 overflow-hidden select-none cursor-pointer`;

  const VerifiedBadgeSegment = () => (
      <div className="h-full px-1.5 bg-blue-600 flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d={CHECK_PATH} />
          </svg>
      </div>
  );

  const timeString = timestamp ? formatTimeShort(timestamp) : null;

  if (hostServer) {
    const username = cleanHandle.replace(`.${hostServer}`, '');
    
    return (
      <div className="inline-flex items-center relative group">
        <div className={pillContainerClass}>
            <div className="pl-2.5 pr-1.5 h-full flex items-center justify-center">
                <span className={textClass}>{username}</span>
            </div>
            
            <div className="h-full w-[1px] bg-white/10"></div>

            <div className="pl-1.5 pr-2.5 h-full flex items-center justify-center">
                <span className={`text-[11px] font-bold leading-none tracking-wide text-emerald-400 pb-px`}>{hostServer}</span>
            </div>

            {isVerified && <VerifiedBadgeSegment />}
        </div>
        
        {timeString && (
            <span className="ml-2 text-[11px] font-medium text-white/60 drop-shadow-md tracking-wide">
                {timeString}
            </span>
        )}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center relative group">
        <div className={pillContainerClass}>
            <div className="pl-2.5 pr-2.5 h-full flex items-center justify-center">
                <span className={textClass}>{cleanHandle}</span>
            </div>
            {isVerified && <VerifiedBadgeSegment />}
        </div>

        {timeString && (
            <span className="ml-2 text-[11px] font-medium text-white/60 drop-shadow-md tracking-wide">
                {timeString}
            </span>
        )}
    </div>
  );
};

export default React.memo(UserHandle);
