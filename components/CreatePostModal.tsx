
// ... imports ...
import React, { useState, useEffect, useRef } from 'react';
import { Icons, CURRENT_USER } from '../constants';
import { generatePostEnhancement } from '../services/geminiService';
import { User, Post } from '../types';
import { createPost } from '../services/atp';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User | null;
  quotedPost?: Post | null;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, currentUser, quotedPost }) => {
  const [text, setText] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  
  // Animation States
  const [isRendered, setIsRendered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const [isExpanded, setIsExpanded] = useState(false);
  
  // Settings View State
  const [showSettings, setShowSettings] = useState(false);
  const [replyAccess, setReplyAccess] = useState<'ANYONE' | 'NOBODY' | 'SPECIFIC'>('ANYONE');
  const [limitedGroups, setLimitedGroups] = useState<Set<string>>(new Set());
  const [quoteAllowed, setQuoteAllowed] = useState(true);

  // Confirmation View State
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const MAX_CHARS = 600;
  const textareaRef = useRef(null);
  const contentScrollRef = useRef(null);
  
  const user = currentUser || CURRENT_USER;

  // Mock Phone Gallery Images
  const MOCK_GALLERY = Array.from({ length: 10 }).map((_, i) => `https://picsum.photos/200/200?random=${1000+i}`);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    
    if (isOpen) {
      setIsExpanded(false); // Reset to compact immediately
      setIsRendered(true);
      // Double RAF to ensure DOM is painted with initial state before animating
      requestAnimationFrame(() => {
          requestAnimationFrame(() => {
              setIsAnimating(true);
          });
      });
    } else {
      setIsAnimating(false);
      // Wait for animation to finish (400ms)
      timeout = setTimeout(() => {
          setIsRendered(false);
          setShowSettings(false);
          setShowConfirmation(false);
      }, 400);
    }
    return () => clearTimeout(timeout);
  }, [isOpen]);

  // ... (rest of logic remains same) ...
  const handleBackdropClick = () => {
    if (showConfirmation) {
        setShowConfirmation(false);
        return;
    }

    if (showSettings) {
        setShowSettings(false);
        return;
    }

    if (text.trim().length > 0) {
        setShowConfirmation(true);
    } else {
        onClose();
    }
  };

  const handleDiscard = () => {
      setText('');
      setTags([]);
      setShowConfirmation(false);
      onClose();
  };

  const handlePost = async () => {
      if (!text.trim() && !quotedPost) return; 
      setIsPosting(true);
      try {
          await createPost(text, undefined, undefined, quotedPost ? { uri: quotedPost.uri, cid: quotedPost.cid } : undefined);
          setText('');
          setTags([]);
          onClose();
      } catch (e) {
          console.error("Post failed", e);
      } finally {
          setIsPosting(false);
      }
  };

  const handleAiEnhance = async () => {
    if (!text.trim()) return;
    setIsEnhancing(true);
    const result = await generatePostEnhancement(text);
    if (result) {
      setText(result.suggestedCaption);
      setTags(result.tags);
    }
    setIsEnhancing(false);
  };

  const toggleExpand = () => {
      setIsExpanded(!isExpanded);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setText(e.target.value);
      
      // Auto-expand logic
      if (!isExpanded && textareaRef.current) {
          const el = textareaRef.current as any;
          // If content height exceeds client height (meaning it wants to scroll)
          if (el.scrollHeight > el.clientHeight) {
              setIsExpanded(true);
          }
      }
  };

  const remainingChars = MAX_CHARS - text.length;
  const isOverLimit = remainingChars < 0;
  const isApproachingLimit = remainingChars <= 60 && remainingChars >= 0;
  const progressPercentage = Math.min((text.length / MAX_CHARS) * 100, 100);

  // Logic for Interaction Settings
  const toggleGroup = (group: string) => {
    const newSet = new Set(limitedGroups);
    if (newSet.has(group)) {
      newSet.delete(group);
    } else {
      newSet.add(group);
    }
    setLimitedGroups(newSet);
    
    if (newSet.size > 0) {
        setReplyAccess('SPECIFIC');
    } else {
        setReplyAccess('SPECIFIC');
    }
  };

  const setAccess = (type: 'ANYONE' | 'NOBODY') => {
    setReplyAccess(type);
    setLimitedGroups(new Set()); // Clear specific selections when switching to main toggles
  };

  const getPrivacyLabel = () => {
    if (replyAccess === 'ANYONE') return 'Everyone can reply';
    if (replyAccess === 'NOBODY') return 'No one can reply';
    return `${limitedGroups.size > 0 ? limitedGroups.size : 'Selected'} groups`;
  };

  // Helper to highlight text
  const renderHighlightedText = () => {
      if (!isOverLimit) return <span className="text-transparent">{text}</span>;
      
      const safeText = text.slice(0, MAX_CHARS);
      const overflowText = text.slice(MAX_CHARS);

      return (
          <>
            <span className="text-transparent">{safeText}</span>
            <span className="bg-red-500/20 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)] rounded px-0.5 box-decoration-clone">{overflowText}</span>
          </>
      )
  };

  if (!isRendered) return null;

  return (
    <div className="absolute inset-0 z-[150] flex flex-col justify-end items-center pointer-events-none">
       {/* Backdrop */}
       <div 
         className={`absolute inset-0 bg-black/20 backdrop-blur-[2px] pointer-events-auto transition-opacity duration-[400ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
         onClick={handleBackdropClick}
       />

       {/* Bottom Sheet Content - Apple Liquid Glass Style */}
       <div 
            className={`w-full max-w-md bg-zinc-900/50 backdrop-blur-3xl saturate-150 rounded-t-[35px] border-t border-white/20 shadow-[0_-10px_40px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.15)] pointer-events-auto relative flex flex-col transform transition-[transform,height] duration-[400ms] cubic-bezier(0.32, 0.72, 0, 1) will-change-transform ${isAnimating ? 'translate-y-0' : 'translate-y-full'} overflow-hidden ${isExpanded ? 'h-[90vh]' : 'min-h-[50vh] max-h-[90vh]'}`}
       >
        
        {/* CONFIRMATION DIALOG OVERLAY */}
        {showConfirmation && (
            <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-fade-in">
                <div className="bg-[#1a1a1a]/90 border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl transform scale-100 transition-all">
                    <div className="flex justify-center mb-4 text-yellow-500 bg-yellow-500/10 w-12 h-12 rounded-full items-center mx-auto">
                        <Icons.AlertCircle size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-white text-center mb-2">Discard post?</h3>
                    <p className="text-gray-400 text-center mb-8 text-sm px-4">You'll lose the text you've written.</p>
                    
                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={handleDiscard}
                            className="w-full py-3.5 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors"
                        >
                            Discard
                        </button>
                        <button 
                            onClick={() => setShowConfirmation(false)}
                            className="w-full py-3.5 rounded-2xl bg-white/5 text-white font-bold hover:bg-white/10 transition-colors"
                        >
                            Keep editing
                        </button>
                    </div>
                </div>
            </div>
        )}

        {showSettings ? (
            /* --- SECONDARY SETTINGS VIEW (Compact Mode) --- */
            <div className="flex flex-col h-full animate-slide-up z-40 relative bg-transparent">
                {/* Header with Back Button on Left */}
                <div className="flex items-center px-4 py-3 border-b border-white/10 flex-shrink-0 bg-white/5">
                    <button onClick={() => setShowSettings(false)} className="p-2 -ml-2 text-white/70 hover:text-white transition-colors hover:bg-white/5 rounded-full">
                        <Icons.ChevronDown size={24} className="rotate-90" />
                    </button>
                    <h2 className="text-white font-bold text-base ml-2">Post interaction settings</h2>
                </div>

                {/* Body - Compact Spacing */}
                <div className="p-4 flex-1 overflow-y-auto no-scrollbar">
                    <h3 className="text-xs font-bold text-white mb-2 uppercase tracking-wide opacity-80">Who can reply</h3>
                    
                    {/* Main Toggles Row - Compact */}
                    <div className="flex gap-3 mb-3">
                        <button 
                            onClick={() => setAccess('ANYONE')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-2 rounded-xl border transition-all ${replyAccess === 'ANYONE' ? 'bg-blue-600/30 border-blue-500 text-white' : 'bg-white/5 border-transparent text-gray-400'}`}
                        >
                            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${replyAccess === 'ANYONE' ? 'border-blue-500 bg-blue-500' : 'border-gray-500'}`}>
                                {replyAccess === 'ANYONE' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                            </div>
                            <span className="font-bold text-xs">Anyone</span>
                        </button>

                        <button 
                            onClick={() => setAccess('NOBODY')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-2 rounded-xl border transition-all ${replyAccess === 'NOBODY' ? 'bg-white/10 border-white/30 text-white' : 'bg-white/5 border-transparent text-gray-400'}`}
                        >
                             <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${replyAccess === 'NOBODY' ? 'border-white bg-white' : 'border-gray-500'}`}>
                                {replyAccess === 'NOBODY' && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                            </div>
                            <span className="font-bold text-xs">Nobody</span>
                        </button>
                    </div>

                    {/* Specific Groups Checkboxes - Tight spacing */}
                    <div className="space-y-0.5 mb-3 rounded-xl overflow-hidden bg-white/5 border border-white/5">
                        {[
                            { id: 'followers', label: 'Your followers' },
                            { id: 'following', label: 'People you follow' },
                            { id: 'mentions', label: 'People you mention' }
                        ].map((group) => {
                            const isSelected = limitedGroups.has(group.id);
                            return (
                                <button 
                                    key={group.id}
                                    onClick={() => toggleGroup(group.id)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left border-b border-white/5 last:border-0"
                                >
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-500 bg-transparent'}`}>
                                        {isSelected && <Icons.Check size={12} className="text-white" />}
                                    </div>
                                    <span className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-gray-400'}`}>{group.label}</span>
                                </button>
                            )
                        })}
                    </div>

                    {/* Lists Dropdown */}
                    <button className="w-full flex items-center justify-between px-4 py-3 bg-white/5 rounded-xl mb-4 hover:bg-white/10 transition-colors border border-white/5">
                        <span className="text-xs font-medium text-gray-400">Select from your lists</span>
                        <Icons.ChevronDown size={16} className="text-gray-500" />
                    </button>

                    {/* Quote Toggle */}
                    <div className="flex items-center justify-between px-4 py-3 bg-blue-900/20 rounded-xl border border-blue-500/30 mb-6">
                        <div className="flex items-center gap-2 text-white">
                            <Icons.Quote size={16} filled />
                            <span className="font-bold text-xs">Allow quote posts</span>
                        </div>
                        <button 
                            onClick={() => setQuoteAllowed(!quoteAllowed)}
                            className={`w-10 h-6 rounded-full transition-colors relative ${quoteAllowed ? 'bg-blue-500' : 'bg-gray-600'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${quoteAllowed ? 'left-5' : 'left-1'}`} />
                        </button>
                    </div>

                    {/* Save Button */}
                    <button 
                        onClick={() => setShowSettings(false)}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-900/20 text-sm"
                    >
                        Save
                    </button>
                </div>
            </div>
        ) : (
            /* --- COMPOSER VIEW --- */
            <div className="flex flex-col h-full">
                {/* Header Actions */}
                <div className="flex justify-between items-center px-5 py-4 border-b border-white/10 touch-none flex-shrink-0">
                    <button onClick={handleBackdropClick} className="text-white/70 hover:text-white text-[15px] font-medium transition-colors">Cancel</button>
                    
                    {/* Expand/Collapse Toggle - Glass Style */}
                    <button 
                        onClick={toggleExpand} 
                        className="p-2 bg-white/10 border border-white/10 rounded-full text-white hover:bg-white/20 transition-colors mx-auto group backdrop-blur-md shadow-lg"
                        title={isExpanded ? "Collapse" : "Expand to write more"}
                    >
                        <Icons.ChevronDown size={20} className={`transition-transform duration-300 ${isExpanded ? '' : 'rotate-180'}`} />
                    </button>

                    <button 
                        onClick={handlePost}
                        disabled={isPosting}
                        className="bg-white text-black hover:bg-gray-200 text-[14px] font-bold px-5 py-1.5 rounded-full transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)] transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center gap-2"
                    >
                        {isPosting && <Icons.Loader2 size={14} className="animate-spin" />}
                        {isPosting ? 'Posting...' : 'Post'}
                    </button>
                </div>

                {/* Composer Body - Text Area */}
                <div 
                    ref={contentScrollRef}
                    className="flex-1 px-5 pt-4 pb-0 overflow-y-auto no-scrollbar relative" 
                >
                    <div className="flex gap-3">
                        {/* Avatar Column */}
                        <div className="flex flex-col items-center gap-2 pt-1">
                            <img src={user.avatarUrl} className="w-10 h-10 rounded-full border border-white/20 object-cover" alt="User" />
                            {/* Thread Line - Fades out */}
                            <div className="w-0.5 flex-1 bg-gradient-to-b from-white/20 to-transparent rounded-full min-h-[20px]"></div>
                        </div>

                        {/* Input Column */}
                        <div className="flex-1 flex flex-col relative">
                            
                            {/* Highlight Overlay Layer */}
                            <div className={`absolute inset-0 w-full bg-transparent pointer-events-none text-[18px] leading-relaxed whitespace-pre-wrap break-words font-sans ${isExpanded ? 'min-h-[300px]' : 'min-h-[80px]'}`}>
                                {renderHighlightedText()}
                            </div>

                            <textarea
                                ref={textareaRef}
                                value={text}
                                onChange={handleTextChange}
                                placeholder={quotedPost ? "Add a comment..." : "What's happening?"}
                                className={`w-full bg-transparent text-white/100 caret-white text-[18px] leading-relaxed placeholder-white/30 resize-none focus:outline-none transition-all relative z-10 ${isExpanded ? 'min-h-[300px]' : 'min-h-[80px] overflow-hidden'}`}
                                style={{ backgroundColor: 'transparent' }} 
                            />
                            
                            {/* Quoted Post Preview */}
                            {quotedPost && (
                                <div className="mt-3 mb-3 bg-[#1a1a1a] border border-white/10 rounded-xl p-3 flex gap-3 relative overflow-hidden group cursor-default">
                                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-10 transition-opacity" />
                                    <img src={quotedPost.author.avatarUrl} className="w-10 h-10 rounded-lg object-cover bg-gray-800 flex-shrink-0" alt="" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <span className="text-[13px] font-bold text-white truncate">{quotedPost.author.displayName}</span>
                                            <span className="text-[11px] text-gray-500 truncate">@{quotedPost.author.handle.split('.')[0]}</span>
                                            <span className="text-[11px] text-gray-600">· {quotedPost.createdAt}</span>
                                        </div>
                                        <p className="text-[13px] text-gray-300 leading-snug line-clamp-2">{quotedPost.text}</p>
                                    </div>
                                    {quotedPost.imageUrl && (
                                        <img src={quotedPost.imageUrl} className="w-12 h-12 rounded-lg object-cover ml-2 bg-gray-800" alt="" />
                                    )}
                                </div>
                            )}
                            
                            {/* Tags Display */}
                            {tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3 animate-slide-up z-20">
                                {tags.map((tag, idx) => (
                                    <span key={idx} className="text-xs text-blue-300 font-bold bg-blue-500/20 px-2 py-1 rounded-md">#{tag}</span>
                                ))}
                                </div>
                            )}

                        </div>
                    </div>
                </div>

                {/* FIXED WIDGETS AREA - Consistent placement when expanded or collapsed */}
                <div className="px-5 pb-2 mt-auto flex-shrink-0">
                    <div className="pl-[52px]"> {/* Align with text input */}
                        
                        {/* Gallery Carousel */}
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-1">
                             <button className="w-16 h-20 bg-white/5 border border-white/10 rounded-lg flex flex-col items-center justify-center flex-shrink-0 hover:bg-white/10 transition-colors">
                                 <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mb-1"><Icons.Image size={16} /></div>
                                 <span className="text-[9px] text-gray-400">Gallery</span>
                             </button>
                             {MOCK_GALLERY.map((img, i) => (
                                 <div key={i} className="relative w-16 h-20 flex-shrink-0 rounded-lg overflow-hidden group cursor-pointer border border-white/5">
                                     <img src={img} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" alt="Gallery" />
                                 </div>
                             ))}
                        </div>

                        {/* Attachment Row Icons */}
                        <div className="flex items-center gap-1 mb-2 overflow-x-auto no-scrollbar py-2">
                            <button className="p-2 rounded-xl text-blue-400 hover:bg-blue-500/10 transition-colors"><Icons.Image size={22} /></button>
                            <button className="p-2 rounded-xl text-pink-400 hover:bg-pink-500/10 transition-colors"><Icons.Film size={22} /></button>
                            <button className="p-2 rounded-xl text-yellow-400 hover:bg-yellow-500/10 transition-colors"><Icons.Smile size={22} /></button>
                            <div className="h-6 w-[1px] bg-white/10 mx-2"></div>
                            <button 
                                onClick={handleAiEnhance}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-colors whitespace-nowrap ${isEnhancing ? 'animate-pulse' : ''}`}
                            >
                                <Icons.Sparkles size={16} />
                                <span className="text-xs font-bold">AI Polish</span>
                            </button>
                        </div>

                        {/* Thread Button Stub */}
                        <div className="flex gap-3 items-center opacity-70 hover:opacity-100 transition-opacity cursor-pointer group pb-2">
                            <div className="w-6 h-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white group-hover:bg-blue-500 group-hover:border-blue-500 transition-colors -ml-[40px]">
                                <Icons.Plus size={14} />
                            </div>
                            <span className="text-sm text-blue-400 font-bold ml-1">Add thread</span>
                        </div>
                    </div>
                </div>

                {/* Compact Footer / Controls - Fixed at Bottom */}
                <div className="border-t border-white/10 bg-black/20 p-4 pb-4 backdrop-blur-md mt-auto flex-shrink-0">
                    <div className="flex justify-between items-center w-full">
                         {/* Privacy Settings Button */}
                         <button 
                            onClick={() => setShowSettings(true)}
                            className="flex items-center gap-2 px-3 py-2 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap transition-colors hover:bg-blue-500/20"
                        >
                            <Icons.Globe size={14} />
                            <span className="text-xs font-bold">{getPrivacyLabel()}</span>
                        </button>

                         {/* Character Count */}
                         <div className="flex items-center gap-3 pr-2">
                            <span className={`text-xs font-bold ${isOverLimit ? 'text-red-500' : isApproachingLimit ? 'text-yellow-500' : 'text-gray-500'}`}>
                                {remainingChars}
                            </span>
                            {/* Radial Progress */}
                            <div className="relative w-6 h-6 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" stroke="#333" strokeWidth="2" fill="transparent" />
                                    <circle 
                                        cx="12" cy="12" r="10" 
                                        stroke={isOverLimit ? '#ef4444' : isApproachingLimit ? '#eab308' : '#3b82f6'} 
                                        strokeWidth="2" 
                                        fill="transparent" 
                                        strokeDasharray={62.8} // 2 * PI * 10
                                        strokeDashoffset={62.8 - (progressPercentage / 100) * 62.8} 
                                        className="transition-all duration-300"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default CreatePostModal;
