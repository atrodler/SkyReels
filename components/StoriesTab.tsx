


import React from 'react';
import { MOCK_STORIES, Icons } from '../constants';

interface StoriesTabProps {
  onClose?: () => void;
}

const StoriesTab: React.FC<StoriesTabProps> = ({ onClose }) => {
  // Group stories logic (mock)
  const recentStories = MOCK_STORIES.filter(s => !s.isSeen);
  const viewedStories = MOCK_STORIES.filter(s => s.isSeen);

  return (
    <div className="w-full h-full bg-black/95 backdrop-blur-3xl text-white flex flex-col animate-slide-up">
       {/* Header */}
       <div className="px-4 py-4 border-b border-white/5 flex justify-between items-start pt-[7px] bg-black/50 backdrop-blur-xl sticky top-0 z-10 h-[52px]">
          <h1 className="text-xl font-bold tracking-tight h-[40px] flex items-center">Stories</h1>
          <div className="flex gap-4">
             <button className="w-[40px] h-[40px] min-w-[40px] rounded-full bg-black/60 backdrop-blur-3xl border border-white/20 text-white hover:bg-white/10 flex items-center justify-center transition-colors shadow-2xl shrink-0">
                <Icons.Plus size={20} />
             </button>
             {onClose && (
                <button 
                    onClick={onClose} 
                    className="w-[40px] h-[40px] min-w-[40px] rounded-full bg-black/60 backdrop-blur-3xl border border-white/20 text-white flex items-center justify-center hover:bg-red-500/20 hover:text-red-500 transition-colors shadow-2xl shrink-0"
                >
                    <Icons.X size={20} />
                </button>
             )}
          </div>
       </div>

       <div className="flex-1 overflow-y-auto pb-24 no-scrollbar p-4">
          
          {/* Latest Updates Section */}
          <h2 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Latest Updates</h2>
          <div className="grid grid-cols-2 gap-3 mb-8">
             {recentStories.map(story => (
                 <div key={story.id} className="relative aspect-[3/4] rounded-xl overflow-hidden group cursor-pointer">
                     <img src={story.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                     <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />
                     
                     <div className="absolute top-3 left-3 w-8 h-8 rounded-full border-2 border-blue-500 p-0.5">
                        <img src={story.author.avatarUrl} className="w-full h-full rounded-full object-cover" />
                     </div>
                     
                     <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-xs font-bold text-white truncate">{story.author.displayName}</p>
                        <p className="text-[10px] text-gray-300">{story.time} ago</p>
                     </div>
                 </div>
             ))}
          </div>

          {/* Viewed Updates Section */}
          <h2 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Viewed</h2>
          <div className="grid grid-cols-3 gap-2">
             {viewedStories.map(story => (
                 <div key={story.id} className="relative aspect-[3/4] rounded-lg overflow-hidden group cursor-pointer opacity-60 hover:opacity-100 transition-opacity">
                     <img src={story.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                     <div className="absolute inset-0 bg-black/20" />
                     <div className="absolute bottom-2 left-2">
                         <p className="text-[10px] font-medium text-white truncate w-20">{story.author.displayName}</p>
                     </div>
                 </div>
             ))}
          </div>
       </div>
    </div>
  );
};

export default StoriesTab;
