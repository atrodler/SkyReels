
export interface User {
  id: string; // This will maps to the DID (did:plc:...)
  handle: string;
  displayName: string;
  avatarUrl: string;
  followers: number;
  following: number;
  postsCount?: number;
  bannerUrl?: string;
  description?: string;
  cannotMessage?: boolean; // New property to control Message button visibility
  viewer?: {
    following?: string; // URI of the follow record if the current user follows this person
    followedBy?: string;
    muted?: boolean;
    blockedBy?: boolean;
    blocking?: string;
  };
}

export interface StoryGroup {
  user: User;
  stories: Post[];
  totalCount: number;
  lastUpdated: string;
}

export interface StoryMeta {
  index: number;
  total: number;
  prevPostId?: string;
  nextPostId?: string;
  nextUserPostId?: string;
  prevUserResumePostId?: string;
  userStoryIds?: string[];
  prevUser?: User;
  nextUser?: User;
  upcomingUsers?: { user: User; jumpId: string }[];
}

export interface Post {
  id: string; // Maps to the AT Proto URI
  uri: string; // Explicit URI for API calls (Required for Real Data)
  cid: string; // Content ID (Version hash) for API calls (Required for Real Data)
  author: User;
  text: string;
  facets?: any[]; // Rich text facets (links, mentions)
  videoUrl?: string; 
  imageUrl: string;
  // Fix: Added missing thumbUrl property to Post interface to resolve property access errors in SearchTab and atp services
  thumbUrl?: string;
  images?: string[]; 
  likesCount: number;
  commentsCount: number;
  sharesCount: number; // Reposts
  createdAt: string;
  isLiked: boolean;
  likeUri?: string; // URI of the like record if liked by viewer
  isReposted?: boolean;
  repostUri?: string; // URI of the repost record if reposted by viewer
  repostedBy?: User; // User who reposted this post (if applicable)
  quotedPost?: Post; // Embedded quoted post
  tags: string[];
  labels?: string[]; // Added for content moderation/filtering
  storyMeta?: StoryMeta; // Added for Story Logic
}

export enum Tab {
  HOME = 'HOME',
  SEARCH = 'SEARCH',
  CREATE = 'CREATE',
  ACTIVITY = 'ACTIVITY',
  PROFILE = 'PROFILE'
}

export interface Comment {
  id: string;
  uri?: string;
  cid?: string;
  author: User;
  text: string;
  facets?: any[]; // Rich text facets
  createdAt: string;
  replies?: Comment[];
  likesCount?: number;
  isLiked?: boolean;
  likeUri?: string;
  imageUrl?: string;
  videoUrl?: string; // Added to support GIFs/Videos in comments
}

export interface Notification {
  id: string;
  type: 'LIKE' | 'COMMENT' | 'FOLLOW' | 'REPOST' | 'QUOTE';
  user: User;
  text?: string;
  postImage?: string;
  createdAt: string;
  isRead?: boolean;
}

// Gemini Types
export interface GeminiSuggestion {
  text: string;
  tags: string[];
}

// Chat Types
export interface ChatMessage {
  id: string;
  text: string;
  sender: {
    did: string;
  };
  sentAt: string;
  isSelf?: boolean; // Helper for UI
}

export interface Conversation {
  id: string;
  peer: User;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  messages?: ChatMessage[];
  rev: string; // Revision string for syncing
}
