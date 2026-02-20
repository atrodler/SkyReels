
import { BskyAgent } from '@atproto/api';
import { Post, User, Comment, Notification, Conversation, ChatMessage } from '../types';

export const agent = new BskyAgent({
  service: 'https://bsky.social',
});

const PROXY_CHAT_DID = 'did:web:api.bsky.chat#bsky_chat';

// -- SESSION MANAGEMENT --

export const getSession = () => agent.session;

export const resumeSession = async () => {
  const sessionStr = localStorage.getItem('SKYREELS_SESSION');
  if (sessionStr) {
    try {
        const session = JSON.parse(sessionStr);
        await agent.resumeSession(session);
        return true;
    } catch (e) {
        return false;
    }
  }
  return false;
};

export const loginToBluesky = async (identifier: string, password: string) => {
  try {
      const res = await agent.login({ identifier, password });
      if (res.success) {
          localStorage.setItem('SKYREELS_SESSION', JSON.stringify(res.data));
      }
      return res;
  } catch (e: any) {
      throw new Error(e.message || "Login failed");
  }
};

export const logout = async () => {
    localStorage.removeItem('SKYREELS_SESSION');
    // agent.session is read-only
    window.location.reload();
};

// -- HELPERS --

const formatRelativeTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    
    const weeks = Math.floor(days / 7);
    return `${weeks}w ago`;
};

// -- MAPPERS --

export const mapProfileToUser = (profile: any): User => ({
    id: profile.did,
    handle: profile.handle,
    displayName: profile.displayName || profile.handle,
    avatarUrl: profile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.handle)}&background=random`,
    followers: profile.followersCount || 0,
    following: profile.followsCount || 0,
    postsCount: profile.postsCount || 0,
    bannerUrl: profile.banner,
    description: profile.description,
    viewer: profile.viewer,
});

export const mapPostToLocal = (postView: any): Post => {
    const record = postView.record as any;
    let imageUrl = '';
    let thumbUrl = '';
    let videoUrl = '';
    
    // 1. Check for Video Embed (High Priority)
    if (postView.embed?.$type === 'app.bsky.embed.video#view') {
        videoUrl = postView.embed.playlist;
        imageUrl = postView.embed.thumbnail;
        thumbUrl = postView.embed.thumbnail;
    }

    // 2. Image extraction
    if (postView.embed) {
        // Standard Images
        if (postView.embed.images && postView.embed.images.length > 0) {
            imageUrl = imageUrl || postView.embed.images[0].fullsize;
            thumbUrl = thumbUrl || postView.embed.images[0].thumb;
        } 
        // Images wrapped in Media
        else if (postView.embed.media?.images && postView.embed.media.images.length > 0) {
            imageUrl = imageUrl || postView.embed.media.images[0].fullsize;
            thumbUrl = thumbUrl || postView.embed.media.images[0].thumb;
        }
        // External Links (e.g. YouTube, News)
        else if (postView.embed.external?.thumb) {
            imageUrl = imageUrl || postView.embed.external.thumb;
            thumbUrl = thumbUrl || postView.embed.external.thumb;
        }
        // NOTE: We do not manually extract nested record media here anymore to avoid partial state.
        // We rely on the full `quotedPost` hoisting logic below.
    }

    // 3. Quote Extraction
    let quotedPost: Post | undefined;
    if (postView.embed) {
        if (postView.embed.$type === 'app.bsky.embed.record#view' && postView.embed.record?.$type === 'app.bsky.embed.record#viewRecord') {
             const quotedView = postView.embed.record;
             quotedPost = mapPostToLocal({ ...quotedView, record: quotedView.value });
        } else if (postView.embed.$type === 'app.bsky.embed.recordWithMedia#view') {
            const innerRecord = postView.embed.record?.record;
            if (innerRecord && innerRecord.$type === 'app.bsky.embed.record#viewRecord') {
                 quotedPost = mapPostToLocal({ ...innerRecord, record: innerRecord.value });
            }
        }
    }

    // 4. Media Hoisting for Quote Posts
    // If the top-level post has no media, but quotes a post WITH media, display the quoted media.
    if (!imageUrl && !videoUrl && quotedPost) {
        if (quotedPost.videoUrl) {
            videoUrl = quotedPost.videoUrl;
            imageUrl = quotedPost.imageUrl;
            thumbUrl = quotedPost.thumbUrl;
        } else if (quotedPost.imageUrl) {
            imageUrl = quotedPost.imageUrl;
            thumbUrl = quotedPost.thumbUrl;
        }
    }

    return {
        id: postView.uri,
        uri: postView.uri,
        cid: postView.cid,
        author: mapProfileToUser(postView.author),
        text: record.text || '',
        imageUrl: imageUrl,
        thumbUrl: thumbUrl || imageUrl, 
        videoUrl: videoUrl,
        likesCount: postView.likeCount || 0,
        commentsCount: postView.replyCount || 0,
        sharesCount: postView.repostCount || 0,
        createdAt: record.createdAt,
        isLiked: !!postView.viewer?.like,
        likeUri: postView.viewer?.like,
        isReposted: !!postView.viewer?.repost,
        repostUri: postView.viewer?.repost,
        quotedPost,
        tags: [], 
        labels: postView.labels?.map((l: any) => l.val) || [],
    };
};

// -- DATA FETCHING --

export const getProfile = async (handle: string): Promise<User | null> => {
    if (!agent.session || !handle) return null;
    try {
        const res = await agent.getProfile({ actor: handle });
        return mapProfileToUser(res.data);
    } catch (e) {
        return null;
    }
}

export const getCurrentUserProfile = async (): Promise<User | null> => {
    if (!agent.session) return null;
    return getProfile(agent.session.did);
}

export const getTimeline = async (cursor?: string, feedUri?: string): Promise<{ posts: Post[], cursor?: string }> => {
    if (!agent.session) return { posts: [] };
    try {
        // Validation to prevent InvalidRequest
        if (feedUri && feedUri.startsWith('at://')) {
             const res = await agent.app.bsky.feed.getFeed({ 
                 feed: feedUri, 
                 cursor: cursor || undefined, 
                 limit: 20 
             });
             const posts = res.data.feed.map((item: any) => {
                 const p = mapPostToLocal(item.post);
                 if (item.reason?.$type === 'app.bsky.feed.defs#reasonRepost') {
                     p.repostedBy = mapProfileToUser(item.reason.by);
                 }
                 return p;
             });
             return { posts, cursor: res.data.cursor };
        } else {
             const res = await agent.getTimeline({ 
                 cursor: cursor || undefined, 
                 limit: 20 
             });
             const posts = res.data.feed.map((item: any) => {
                 const p = mapPostToLocal(item.post);
                 if (item.reason?.$type === 'app.bsky.feed.defs#reasonRepost') {
                     p.repostedBy = mapProfileToUser(item.reason.by);
                 }
                 return p;
             });
             return { posts, cursor: res.data.cursor };
        }
    } catch (e) {
        return { posts: [] };
    }
}

export const getAuthorFeed = async (actor: string, filter: string = 'posts_no_replies', cursor?: string) => {
    if (!agent.session || !actor) return { posts: [] };
    try {
        const res = await agent.getAuthorFeed({ actor, cursor: cursor || undefined, filter, limit: 20 });
        const posts = res.data.feed.map((item: any) => {
             const p = mapPostToLocal(item.post);
             if (item.reason?.$type === 'app.bsky.feed.defs#reasonRepost') {
                 p.repostedBy = mapProfileToUser(item.reason.by);
             }
             return p;
        });
        return { posts, cursor: res.data.cursor };
    } catch (e) {
        return { posts: [] };
    }
}

// -- INTERACTIONS --

export const likePost = async (uri: string, cid: string) => {
    if (!agent.session) return;
    return await agent.like(uri, cid);
}

export const unlikePost = async (likeUri: string) => {
    if (!agent.session) return;
    return await agent.deleteLike(likeUri);
}

export const repostPost = async (uri: string, cid: string) => {
    if (!agent.session) return;
    return await agent.repost(uri, cid);
}

export const deleteRepost = async (repostUri: string) => {
    if (!agent.session) return;
    return await agent.deleteRepost(repostUri);
}

export const createPost = async (
    text: string, 
    facets?: any[], 
    reply?: { root: { uri: string, cid: string }, parent: { uri: string, cid: string } },
    quote?: { uri: string, cid: string }
) => {
    if (!agent.session) return;
    
    let embed: any = undefined;
    if (quote) {
        embed = {
            $type: 'app.bsky.embed.record',
            record: {
                uri: quote.uri,
                cid: quote.cid
            }
        };
    }

    return await agent.post({
        text,
        facets,
        reply,
        embed
    });
}

export const followUser = async (did: string) => {
    if (!agent.session) return;
    return await agent.follow(did);
}

export const unfollowUser = async (followUri: string) => {
    if (!agent.session) return;
    return await agent.deleteFollow(followUri);
}

export const muteUser = async (did: string) => {
    if (!agent.session) return false;
    try {
        await agent.mute(did);
        return true;
    } catch { return false; }
}

export const blockUser = async (did: string) => {
    if (!agent.session) return false;
    return true; 
}

export const reportPost = async (uri: string, cid: string, reasonType?: string) => {
    if (!agent.session) return false;
    try {
        await agent.createModerationReport({
            reasonType: reasonType || 'com.atproto.moderation.defs#reasonSpam',
            subject: { $type: 'com.atproto.repo.strongRef', uri, cid }
        });
        return true;
    } catch { return false; }
}

export const muteThread = async (uri: string) => {
    if (!agent.session) return false;
    return true; 
}

// -- COMMENTS --

export const getPostComments = async (uri: string) => {
    if (!agent.session || !uri) return [];
    try {
        const res = await agent.getPostThread({ uri, depth: 1 });
        if (res.data.thread) {
            const thread = res.data.thread as any;
            if (!thread.replies) return [];

            const mapComment = (threadView: any): Comment => {
                const post = threadView.post;
                const record = post.record as any;
                return {
                    id: post.uri,
                    uri: post.uri,
                    cid: post.cid,
                    author: mapProfileToUser(post.author),
                    text: record.text,
                    createdAt: formatRelativeTime(record.createdAt), 
                    likesCount: post.likeCount || 0,
                    isLiked: !!post.viewer?.like,
                    likeUri: post.viewer?.like,
                    replies: threadView.replies?.map((r: any) => mapComment(r)) || []
                }
            };
            
            return thread.replies.map((r: any) => mapComment(r));
        }
        return [];
    } catch (e) {
        return [];
    }
}

// -- FEEDS & LISTS --

export const getPopularFeeds = async (cursor?: string, limit: number = 50): Promise<{ feeds: any[], cursor?: string }> => {
    if (!agent.session) return { feeds: [], cursor: undefined };
    try {
        const res = await agent.app.bsky.unspecced.getPopularFeedGenerators({ limit, cursor });
        const feeds = res.data.feeds.map((f: any) => ({
            id: f.uri,
            name: f.displayName,
            description: f.description,
            subscribers: f.likeCount ? `${f.likeCount}` : '0',
            creatorHandle: f.creator.handle,
            uri: f.uri,
            avatar: f.avatar,
            icon: 'Globe',
            type: 'Community',
            created: f.indexedAt,
            viewerState: f.viewer,
        }));
        return { feeds, cursor: res.data.cursor };
    } catch (e: any) {
        return { feeds: [], cursor: undefined };
    }
};

export const searchFeeds = async (term: string, limit: number = 20, cursor?: string): Promise<{ items: any[], cursor?: string }> => {
    if (!agent.session) return { items: [] };
    try {
        const res = await agent.app.bsky.unspecced.getPopularFeedGenerators({ limit, cursor, query: term });
        const items = res.data.feeds.map((f: any) => ({
            id: f.uri,
            name: f.displayName,
            description: f.description,
            subscribers: f.likeCount ? `${f.likeCount}` : '0',
            creatorHandle: f.creator.handle,
            uri: f.uri,
            avatar: f.avatar,
            icon: 'Hash',
            type: 'Search Result',
            viewerState: f.viewer,
        }));
        return { items, cursor: res.data.cursor };
    } catch { return { items: [] }; }
}

export const getSavedFeeds = async (): Promise<any[]> => {
    if (!agent.session) return [];
    try {
        const prefs = await agent.app.bsky.actor.getPreferences();
        const savedFeedsPref = prefs.data.preferences.find((p: any) => p.$type === 'app.bsky.actor.defs#savedFeedsPrefV2') as any;
        
        if (!savedFeedsPref) return [];
        
        const items = savedFeedsPref.items; 
        const feedUris = items.filter((i: any) => i.type === 'feed').map((i: any) => i.value);
        
        if (feedUris.length === 0) return [];

        const gens = await agent.app.bsky.feed.getFeedGenerators({ feeds: feedUris });
        return gens.data.feeds.map((f: any) => {
            const item = items.find((i: any) => i.value === f.uri);
            return {
                id: f.uri,
                uri: f.uri,
                name: f.displayName,
                description: f.description,
                avatar: f.avatar,
                creatorHandle: f.creator.handle,
                viewerState: {
                    ...f.viewer,
                    isPinned: item?.pinned,
                    isSaved: true
                },
                likeCount: f.likeCount
            };
        });
    } catch (e) {
        return [];
    }
}

export const toggleSaveFeed = async (feedUri: string) => {
    if (!agent.session) return false;
    try {
        const prefs = await agent.app.bsky.actor.getPreferences();
        const currentPrefs = prefs.data.preferences.filter((p: any) => p.$type !== 'app.bsky.actor.defs#savedFeedsPrefV2');
        let savedFeedsPref = prefs.data.preferences.find((p: any) => p.$type === 'app.bsky.actor.defs#savedFeedsPrefV2') as any;
        
        let items = savedFeedsPref ? [...savedFeedsPref.items] : [];
        const exists = items.find((i: any) => i.value === feedUri);
        
        if (exists) {
            items = items.filter((i: any) => i.value !== feedUri);
        } else {
            items.push({ type: 'feed', value: feedUri, pinned: false, id: Math.random().toString(36).substring(7) });
        }
        
        await agent.app.bsky.actor.putPreferences({
            preferences: [
                ...currentPrefs,
                { $type: 'app.bsky.actor.defs#savedFeedsPrefV2', items }
            ]
        });
        return true;
    } catch (e) {
        return false;
    }
}

// -- SEARCH --

export const searchUsers = async (term: string, limit: number = 20, cursor?: string): Promise<{ items: User[], cursor?: string }> => {
    if (!agent.session) return { items: [] };
    try {
        const res = await agent.searchActors({ term, limit, cursor });
        return { items: res.data.actors.map(mapProfileToUser), cursor: res.data.cursor };
    } catch { return { items: [] }; }
}

export const searchPosts = async (term: string, limit: number = 20, cursor?: string): Promise<{ items: Post[], cursor?: string }> => {
    if (!agent.session) return { items: [] };
    try {
        const res = await agent.app.bsky.feed.searchPosts({ q: term, limit, cursor });
        return { items: res.data.posts.map(mapPostToLocal), cursor: res.data.cursor };
    } catch { return { items: [] }; }
}

export const getDiscoveryFeed = async () => {
    return getTimeline();
}

// -- NOTIFICATIONS --

export const getNotifications = async () => {
    if (!agent.session) return { notifications: [] };
    try {
        const res = await agent.listNotifications({ limit: 50 });
        const notifications: Notification[] = res.data.notifications.map((n: any) => ({
            id: n.uri,
            type: n.reason === 'quote' ? 'QUOTE' : n.reason === 'repost' ? 'REPOST' : n.reason === 'reply' ? 'COMMENT' : n.reason === 'like' ? 'LIKE' : 'FOLLOW',
            user: mapProfileToUser(n.author),
            text: n.record?.text,
            isRead: n.isRead,
            createdAt: formatRelativeTime(n.indexedAt),
            postImage: undefined 
        }));
        return { notifications, cursor: res.data.cursor };
    } catch { return { notifications: [] }; }
}

export const markNotificationsSeen = async () => {
    if (!agent.session) return;
    try {
        await agent.updateSeenNotifications(new Date().toISOString());
    } catch {}
}

// -- SETTINGS & PREFERENCES --

export const getAtpPreferences = async () => {
    if (!agent.session) return [];
    try {
        const res = await agent.app.bsky.actor.getPreferences();
        return res.data.preferences;
    } catch { return []; }
}

export const setAtpPreference = async (type: string, key: string, value: any) => {
    if (!agent.session) return;
    console.log("Setting preference", type, key, value);
}

// -- LISTS & GRAPHS --

export const getActorFeeds = async (actor: string) => {
    if (!agent.session || !actor) return [];
    try {
        const res = await agent.app.bsky.feed.getActorFeeds({ actor });
        return res.data.feeds.map((f: any) => ({
            id: f.uri,
            name: f.displayName,
            avatar: f.avatar,
            description: f.description
        }));
    } catch { return []; }
}

export const getActorLists = async (actor: string) => {
    if (!agent.session || !actor) return [];
    try {
        const res = await agent.app.bsky.graph.getLists({ actor });
        return res.data.lists.map((l: any) => ({
            id: l.uri,
            name: l.name,
            description: l.description,
            avatar: l.avatar,
            count: 0
        }));
    } catch { return []; }
}

// -- BOOKMARKS (MOCK) --
export const fetchBookmarkedPosts = async () => ({});
export const addBookmark = async (uri: string, cid: string) => ({ uri: 'mock' });
export const removeBookmark = async (uri: string) => {};

// -- REAL CHAT (BSKY.CHAT) --

export const getConversations = async (cursor?: string, limit: number = 20): Promise<{ conversations: Conversation[], cursor?: string }> => {
    if (!agent.session) return { conversations: [] };
    try {
        const { data } = await agent.api.chat.bsky.convo.listConvos({ limit, cursor }, { headers: { 'atproto-proxy': PROXY_CHAT_DID } });
        
        const convos = data.convos.map((convo: any) => {
            // Identify the peer (the member who is NOT me)
            const peerMember = convo.members.find((m: any) => m.did !== agent.session?.did);
            const peer: User = peerMember ? mapProfileToUser(peerMember) : {
                id: 'unknown',
                handle: 'unknown',
                displayName: 'Unknown User',
                avatarUrl: '',
                followers: 0, 
                following: 0 
            };
            
            // Extract Last Message safely
            const lastMsgText = (convo.lastMessage as any)?.text || (convo.lastMessage as any)?.embed ? 'Sent an attachment' : '';
            const lastMsgTime = (convo.lastMessage as any)?.sentAt || convo.updatedAt;

            return {
                id: convo.id,
                peer: peer,
                lastMessage: lastMsgText,
                lastMessageAt: formatRelativeTime(lastMsgTime),
                unreadCount: convo.unreadCount,
                rev: convo.rev
            };
        });
        
        return { conversations: convos, cursor: data.cursor };
    } catch (e) {
        console.error("Failed to load conversations", e);
        return { conversations: [] };
    }
};

export const getChatMessages = async (convoId: string): Promise<ChatMessage[]> => {
    if (!agent.session || !convoId) return [];
    try {
        const { data } = await agent.api.chat.bsky.convo.getMessages({ convoId, limit: 50 }, { headers: { 'atproto-proxy': PROXY_CHAT_DID } });
        
        return data.messages.map((msg: any) => {
            if (msg.$type === 'chat.bsky.convo.defs#deletedMessageView') {
                return {
                    id: msg.id,
                    text: 'Message deleted',
                    sender: { did: msg.sender?.did || '' },
                    sentAt: formatRelativeTime(msg.sentAt),
                    isSelf: msg.sender?.did === agent.session?.did
                };
            }
            
            return {
                id: msg.id,
                text: msg.text || (msg.embed ? 'Sent an attachment' : ''),
                sender: { did: msg.sender?.did },
                sentAt: formatRelativeTime(msg.sentAt),
                isSelf: msg.sender?.did === agent.session?.did
            };
        }).reverse(); // Chat usually expects oldest top, newest bottom (flex-col-reverse or array order)
    } catch (e) {
        console.error("Failed to load messages", e);
        return [];
    }
};

export const sendChatMessage = async (convoId: string, text: string) => {
    if (!agent.session || !convoId || !text.trim()) return;
    try {
        await agent.api.chat.bsky.convo.sendMessage(
            { convoId, message: { text } }, 
            { headers: { 'atproto-proxy': PROXY_CHAT_DID } }
        );
    } catch (e) {
        console.error("Failed to send message", e);
    }
};

export const updateReadStatus = async (convoId: string) => {
    if (!agent.session || !convoId) return;
    try {
        // We generally don't need to await this to block UI
        agent.api.chat.bsky.convo.updateRead(
            { convoId }, 
            { headers: { 'atproto-proxy': PROXY_CHAT_DID } }
        );
    } catch (e) {
        console.warn("Failed to mark read", e);
    }
};

export const startConversation = async (did: string): Promise<Conversation | null> => {
    if (!agent.session || !did) return null;
    try {
        const { data } = await agent.api.chat.bsky.convo.getConvoForMembers(
            { members: [did] }, 
            { headers: { 'atproto-proxy': PROXY_CHAT_DID } }
        );
        
        const convo = data.convo;
        
        // Map Result to Conversation Object
        const peerMember = convo.members.find((m: any) => m.did !== agent.session?.did);
        const peer: User = peerMember ? mapProfileToUser(peerMember) : {
            id: did,
            handle: 'unknown',
            displayName: 'User',
            avatarUrl: '',
            followers: 0,
            following: 0
        };

        return {
            id: convo.id,
            peer: peer,
            lastMessage: '',
            lastMessageAt: formatRelativeTime(convo.updatedAt),
            unreadCount: 0,
            rev: convo.rev
        };
    } catch (e) {
        console.error("Failed to start conversation", e);
        return null;
    }
};
