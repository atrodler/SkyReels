
import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../constants';
import { getConversations, getChatMessages, sendChatMessage, updateReadStatus, startConversation } from '../services/atp';
import { Conversation, ChatMessage, User } from '../types';

interface ActivityTabProps {
    onOpenMenu?: () => void;
    onOpenNotifications?: () => void;
    startChatWithUser?: User | null;
    onChatStarted?: () => void;
    onChatOpen?: (isOpen: boolean) => void;
    onUserInfoClick?: (user: User) => void;
}

const ActivityTab: React.FC<ActivityTabProps> = ({ onOpenMenu, onOpenNotifications, startChatWithUser, onChatStarted, onChatOpen, onUserInfoClick }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [isInitializingChat, setIsInitializingChat] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  
  // Pagination State
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const listScrollRef = useRef<HTMLDivElement>(null);

  // Notify parent about chat state changes
  useEffect(() => {
      onChatOpen?.(!!activeConvo);
      return () => onChatOpen?.(false);
  }, [activeConvo, onChatOpen]);

  // Handle Incoming Chat Request
  useEffect(() => {
      const initChat = async () => {
          if (startChatWithUser) {
              if (isInitializingChat) return;
              setIsInitializingChat(true);
              setInitializationError(null);

              // 1. Try Local Lookup FIRST
              const existing = conversations.find(c => c.peer.id === startChatWithUser.id);
              
              if (existing) {
                  setActiveConvo(existing);
                  setIsInitializingChat(false);
                  if (onChatStarted) onChatStarted();
              } else {
                  // 2. Fetch or Create via API
                  try {
                      const newConvo = await startConversation(startChatWithUser.id);
                      if (newConvo) {
                          setActiveConvo(newConvo);
                          setConversations(prev => {
                              if (prev.find(c => c.id === newConvo.id)) return prev;
                              return [newConvo, ...prev];
                          });
                      } else {
                          throw new Error("Unable to open conversation.");
                      }
                  } catch (e: any) {
                      console.error("Failed to start chat", e);
                      setInitializationError(e.message || "Failed to start chat");
                      setTimeout(() => {
                          setInitializationError(null);
                      }, 3000);
                  } finally {
                      setIsInitializingChat(false);
                      if (onChatStarted) onChatStarted();
                  }
              }
          }
      };
      
      initChat();
  }, [startChatWithUser, conversations]); 

  // Load Conversations List (Initial 10)
  const loadConvos = async () => {
      if (isLoading) return;
      setIsLoading(true);
      try {
          // Load 10 initially as requested
          const { conversations: newConvos, cursor: newCursor } = await getConversations(undefined, 10);
          setConversations(newConvos);
          setCursor(newCursor);
      } catch (e) {
          console.error("Failed to load conversations list", e);
      } finally {
          setIsLoading(false);
      }
  };

  // Load More Conversations
  const handleLoadMore = async () => {
      if (isFetchingMore || !cursor) return;
      setIsFetchingMore(true);
      try {
          const { conversations: moreConvos, cursor: nextCursor } = await getConversations(cursor, 15);
          setConversations(prev => [...prev, ...moreConvos]);
          setCursor(nextCursor);
      } catch (e) {
          console.error("Failed to load more conversations", e);
      } finally {
          setIsFetchingMore(false);
      }
  };

  const handleListScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      if (scrollHeight - scrollTop - clientHeight < 300) {
          handleLoadMore();
      }
  };

  // Initial Load on Mount
  useEffect(() => {
      loadConvos();
  }, []);

  // Load Chat Messages
  useEffect(() => {
      if (activeConvo) {
          const fetchMessages = async () => {
              const msgs = await getChatMessages(activeConvo.id);
              setMessages(msgs);
              if (activeConvo.unreadCount > 0) {
                  updateReadStatus(activeConvo.id);
              }
          };
          fetchMessages();

          pollingRef.current = setInterval(async () => {
              const msgs = await getChatMessages(activeConvo.id);
              setMessages(msgs);
          }, 3000);
      } else {
          setMessages([]);
          if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
          }
      }

      return () => {
          if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
          }
      };
  }, [activeConvo]);

  // Auto-scroll
  useEffect(() => {
      if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
  }, [messages]);

  const handleSendMessage = async () => {
      if (!inputText.trim() || !activeConvo) return;
      setSending(true);
      try {
          await sendChatMessage(activeConvo.id, inputText);
          setInputText('');
          const msgs = await getChatMessages(activeConvo.id);
          setMessages(msgs);
      } catch (e) {
          console.error("Failed to send", e);
      } finally {
          setSending(false);
      }
  };

  // Loading Overlay
  if (isInitializingChat) {
      return (
          <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center flex-col animate-fade-in">
              {initializationError ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20">
                        <Icons.UserX size={32} className="text-red-500" />
                    </div>
                    <p className="text-white font-bold text-sm tracking-wide">{initializationError}</p>
                  </>
              ) : (
                  <>
                    <Icons.Loader2 size={32} className="animate-spin text-blue-500 mb-4" />
                    <p className="text-white font-bold text-sm tracking-widest uppercase">Opening Chat...</p>
                  </>
              )}
          </div>
      );
  }

  // --- RENDER CHAT DETAIL VIEW ---
  // Using fixed with max-w-md mx-auto to respect UI limits
  if (activeConvo) {
      return (
          <div className="fixed inset-0 z-[90] w-full h-full max-w-md mx-auto bg-black text-white flex flex-col animate-slide-up">
              {/* Chat Header - With Padding to clear Global Buttons */}
              <div 
                className="flex items-center bg-black/90 backdrop-blur-xl border-b border-white/5 sticky top-0 z-30 pl-[55px] pr-[55px]"
                style={{ paddingTop: 'max(7px, env(safe-area-inset-top))', height: 'max(52px, calc(45px + env(safe-area-inset-top)))' }}
              >
                  <div className="flex items-center gap-2 w-full h-full pr-1">
                      {/* Minimalistic Back Button */}
                      <button 
                        onClick={() => setActiveConvo(null)} 
                        className="w-[40px] h-[40px] min-w-[40px] flex items-center justify-center rounded-full bg-black/60 backdrop-blur-3xl border border-white/20 text-white hover:bg-white/10 transition-colors shadow-2xl shrink-0"
                      >
                          <Icons.ChevronLeft size={20} />
                      </button>
                      
                      {/* Clickable User Info - Next to Back Button */}
                      <div 
                        className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer hover:bg-white/5 p-1 rounded-lg transition-colors group ml-1"
                        onClick={() => onUserInfoClick?.(activeConvo.peer)}
                      >
                          <img src={activeConvo.peer.avatarUrl} className="w-8 h-8 rounded-full bg-gray-800 object-cover border border-white/10 group-hover:border-white/30 transition-colors" alt="" />
                          <div className="flex flex-col min-w-0 justify-center">
                              <span className="text-[13px] font-bold leading-none text-white truncate">{activeConvo.peer.displayName}</span>
                              <span className="text-[9px] text-gray-500 font-mono mt-0.5 truncate group-hover:text-blue-400 transition-colors">@{activeConvo.peer.handle.split('.')[0]}</span>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3 bg-[#0a0a0a]">
                  {messages.map((msg, idx) => {
                      const isSelf = msg.isSelf;
                      return (
                          <div key={msg.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                              <div 
                                  className={`max-w-[75%] px-4 py-2.5 text-sm leading-snug break-words shadow-sm ${
                                      isSelf 
                                      ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm' 
                                      : 'bg-[#1f1f1f] text-gray-100 rounded-2xl rounded-tl-sm border border-white/5'
                                  }`}
                              >
                                  {msg.text}
                              </div>
                          </div>
                      );
                  })}
                  <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div 
                className="bg-black/90 backdrop-blur-xl border-t border-white/5"
                style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))', paddingLeft: '12px', paddingRight: '12px', paddingTop: '12px' }}
              >
                  <div className="flex items-end gap-2 bg-[#1a1a1a] rounded-[24px] px-2 py-1.5 border border-white/10 focus-within:border-blue-500/50 transition-colors">
                      <button className="w-8 h-8 rounded-full bg-white/5 text-gray-400 hover:text-white flex items-center justify-center shrink-0 mb-0.5">
                          <Icons.Plus size={18} />
                      </button>
                      
                      <textarea
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSendMessage();
                              }
                          }}
                          placeholder="Message..."
                          className="flex-1 bg-transparent text-white text-sm max-h-32 min-h-[36px] py-2 focus:outline-none resize-none placeholder-gray-600 no-scrollbar"
                          rows={1}
                      />
                      
                      {inputText.trim() ? (
                          <button 
                              onClick={handleSendMessage} 
                              disabled={sending}
                              className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mb-0.5 active:scale-90 transition-transform shadow-lg shadow-blue-600/20"
                          >
                              {sending ? <Icons.Loader2 size={16} className="animate-spin" /> : <Icons.ArrowUp size={18} strokeWidth={3} />}
                          </button>
                      ) : (
                          <button className="w-8 h-8 rounded-full bg-white/5 text-gray-400 flex items-center justify-center shrink-0 mb-0.5">
                              <Icons.Mic size={18} />
                          </button>
                      )}
                  </div>
              </div>
          </div>
      );
  }

  // --- RENDER CONVERSATION LIST ---
  return (
    <div className="w-full h-full bg-black text-white overflow-hidden flex flex-col">
       {/* Header - With Extra Padding to clear Global Buttons and adjusted offset */}
       <div className="pl-[72px] pr-[55px] flex items-start justify-between pt-[7px] bg-black/60 backdrop-blur-xl sticky top-0 z-30 h-[52px] shadow-sm border-b border-white/5 shrink-0">
          <div className="h-[40px] flex items-center">
            <h1 className="text-xl font-black tracking-tighter flex items-center gap-2">
                Messages 
            </h1>
          </div>
          
          <div className="h-[40px] flex items-center gap-2">
            <button onClick={() => loadConvos()} className="w-[40px] h-[40px] flex items-center justify-center rounded-full bg-black/60 backdrop-blur-3xl border border-white/20 text-white hover:bg-white/10 transition-colors shadow-2xl active:scale-95">
                <Icons.RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button className="w-[40px] h-[40px] flex items-center justify-center rounded-full bg-black/60 backdrop-blur-3xl border border-white/20 text-white hover:bg-white/10 transition-colors shadow-2xl">
                <Icons.Edit size={20} />
            </button>
          </div>
       </div>
       
       <div 
            ref={listScrollRef}
            onScroll={handleListScroll}
            className="flex-1 overflow-y-auto no-scrollbar pb-32"
       >
          
          {/* Search DMs */}
          <div className="px-4 mt-4 mb-2">
             <div className="bg-[#1a1a1a] rounded-xl flex items-center px-4 py-2.5 border border-white/5 focus-within:border-white/10 transition-colors">
                <Icons.Search size={16} className="text-gray-500 mr-3"/>
                <input type="text" placeholder="Search messages..." className="bg-transparent text-sm w-full focus:outline-none placeholder-gray-600 text-gray-300 font-medium"/>
             </div>
          </div>

          {/* Conversation List */}
          <div className="mt-1">
             {isLoading && conversations.length === 0 ? (
                 <div className="py-20 flex justify-center">
                     <Icons.Loader2 className="animate-spin text-blue-500" size={24} />
                 </div>
             ) : conversations.length > 0 ? (
                 <>
                    {conversations.map((convo) => (
                    <div 
                            key={convo.id} 
                            onClick={() => setActiveConvo(convo)}
                            className="flex items-center px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer group border-b border-white/5 last:border-0"
                    >
                        <div className="relative mr-4">
                            <img src={convo.peer.avatarUrl} className="w-12 h-12 rounded-full object-cover border border-white/10 bg-gray-800" alt="Avatar" />
                            {convo.unreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-black flex items-center justify-center">
                                <span className="text-[9px] font-bold text-white">{convo.unreadCount}</span>
                            </div>
                            )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-0.5">
                                <div className={`text-sm truncate mr-2 ${convo.unreadCount > 0 ? 'font-bold text-white' : 'font-bold text-gray-200'}`}>
                                {convo.peer.displayName || convo.peer.handle}
                                </div>
                                <span className={`text-[10px] ${convo.unreadCount > 0 ? 'text-blue-400 font-bold' : 'text-gray-600'}`}>
                                {convo.lastMessageAt}
                                </span>
                            </div>
                            
                            <p className={`text-xs truncate leading-relaxed ${convo.unreadCount > 0 ? 'text-white font-medium' : 'text-gray-500'}`}>
                                {convo.lastMessage || 'Sent an attachment'}
                            </p>
                        </div>
                    </div>
                    ))}
                    {isFetchingMore && (
                        <div className="py-6 flex justify-center">
                            <Icons.Loader2 className="animate-spin text-gray-500" size={18} />
                        </div>
                    )}
                 </>
             ) : (
                 <div className="py-20 text-center flex flex-col items-center opacity-40">
                     <Icons.MessageCircle size={40} className="mb-4 text-gray-500" />
                     <p className="text-sm font-bold text-gray-400">No messages yet</p>
                     <p className="text-xs text-gray-600 mt-1">Start a chat with someone!</p>
                 </div>
             )}
          </div>
       </div>
    </div>
  );
};

export default React.memo(ActivityTab);
