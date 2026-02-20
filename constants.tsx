
import React from 'react';
import { Post, User, Notification, Comment } from './types';
import * as LucideIcons from 'lucide-react';

// Icons - Safely Exported with Fallback
const BaseIcons = (LucideIcons as any).default || LucideIcons || {};

export const Icons: any = {
  ...BaseIcons,
  Translate: BaseIcons.Languages || BaseIcons.Globe,
  Layers: BaseIcons.Layers || BaseIcons.Copy,
  ListPlus: BaseIcons.ListPlus || BaseIcons.List,
};

// --- UTILITIES ---

/**
 * Linkify text by wrapping URLs and @handles in clickable tags.
 */
export const linkifyText = (
  text: string, 
  onHandleClick?: (handle: string) => void, 
  facets?: any[], 
  onTagClick?: (tag: string) => void
) => {
  if (!text) return null;
  if (facets && facets.length > 0) {
      const segments: React.ReactNode[] = [];
      let lastPos = 0;
      const sortedFacets = [...facets].sort((a, b) => a.index.byteStart - b.index.byteStart);
      const utf8Encoder = new TextEncoder();
      const utf8Decoder = new TextDecoder();
      const bytes = utf8Encoder.encode(text);
      sortedFacets.forEach((facet, i) => {
          const { byteStart, byteEnd } = facet.index;
          if (byteStart > lastPos) {
              segments.push(utf8Decoder.decode(bytes.slice(lastPos, byteStart)));
          }
          const facetText = utf8Decoder.decode(bytes.slice(byteStart, byteEnd));
          const feature = facet.features[0];
          if (feature.$type === 'app.bsky.richtext.facet#link') {
              segments.push(<a key={`f-${i}`} href={feature.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 font-bold hover:underline" onClick={(e) => e.stopPropagation()}>{facetText}</a>);
          } else if (feature.$type === 'app.bsky.richtext.facet#mention') {
              segments.push(<span key={`f-${i}`} className="text-blue-400 font-bold hover:underline cursor-pointer" onClick={(e) => { e.stopPropagation(); if (onHandleClick) onHandleClick(facetText.replace('@', '')); }}>{facetText}</span>);
          } else if (feature.$type === 'app.bsky.richtext.facet#tag') {
              segments.push(<span key={`f-${i}`} className="text-blue-400 font-bold hover:underline cursor-pointer" onClick={(e) => { e.stopPropagation(); if (onTagClick) onTagClick(`#${feature.tag}`); }}>#{feature.tag}</span>);
          } else { segments.push(facetText); }
          lastPos = byteEnd;
      });
      if (lastPos < bytes.length) { segments.push(utf8Decoder.decode(bytes.slice(lastPos))); }
      return segments;
  }
  const regex = /((?:https?:\/\/|www\.)[^\s/$.?#].[^\s]*|(?:\b[a-z0-9][a-z0-9-]*\.)+(?:com|org|net|io|me|app|social|blue|xyz|dev|ai|gov|edu|uk|ca|de|jp|fr|au|us|ru|ch|it|nl|se|no|es|br)\b(?:\/[^\s]*)?|@[a-zA-Z0-9.-]+|#\w+)/gi;
  const parts = text.split(regex);
  return parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith('@') && part.length > 1) {
      const cleanHandle = part.substring(1).replace(/[.,!?;:]+$/, '');
      return (<span key={i} className="text-blue-400 font-bold hover:underline cursor-pointer" onClick={(e) => { e.stopPropagation(); if (onHandleClick) onHandleClick(cleanHandle); }}>{part}</span>);
    }
    if (part.startsWith('#') && part.length > 1) {
      return (<span key={i} className="text-blue-400 font-bold hover:underline cursor-pointer" onClick={(e) => { e.stopPropagation(); if (onTagClick) onTagClick(part); }}>{part}</span>);
    }
    if (part.match(regex)) {
      let urlTarget = part.replace(/[.,!?;:)]+$/, '');
      urlTarget = urlTarget.replace(/\.\.\.$/, '');
      if (!/^https?:\/\//i.test(urlTarget)) { urlTarget = `https://${urlTarget}`; }
      return (<a key={i} href={urlTarget} target="_blank" rel="noopener noreferrer" className="text-blue-400 font-bold hover:underline" onClick={(e) => e.stopPropagation()}>{part}</a>);
    }
    return part;
  });
};

export const PUBLIC_SERVERS = ['bsky.social', 'atm.blue', 'pds.xyz', 'indigo.social', 'social.garden', 'atp.host', 'public.cat'];
export const CURRENT_USER: User = { id: 'u1', handle: 'skywalker.bsky.social', displayName: 'Sky Walker', avatarUrl: 'https://picsum.photos/100/100?random=1', followers: 1205, following: 450 };
export const MOCK_USERS: User[] = [{ id: 'u2', handle: 'theverge.com', displayName: 'The Verge', avatarUrl: 'https://picsum.photos/100/100?random=2', followers: 540000, following: 12 }];
export const ALL_USERS = [...MOCK_USERS];
export const MOCK_ACCOUNTS = [CURRENT_USER];
export const MOCK_FEED: Post[] = [{ id: 'p2', uri: 'at://did:plc:mock:p2', cid: 'bafy...p2', author: MOCK_USERS[0], text: 'Exclusive: First look at the new AR glasses from Apple. Full review on https://theverge.com', imageUrl: 'https://picsum.photos/600/1000?random=11', likesCount: 8500, commentsCount: 302, sharesCount: 500, createdAt: '5h ago', isLiked: true, tags: ['tech', 'apple', 'ar'] }];
export const MOCK_FOLLOWING_FEED: Post[] = [];
export const MOCK_FRIENDS_FEED: Post[] = [];
export const MOCK_NOTIFICATIONS: Notification[] = [];
export const MOCK_COMMENTS: Comment[] = [];
export const MOCK_PROFILE_TABS_DATA = { 
  Replies: [
    { id: 'rep1', parentAuthor: 'dan.bsky.social', time: '2h', originalPost: 'Loving the new video feed!', text: 'Agreed, it is much smoother now.' },
    { id: 'rep2', parentAuthor: 'alice.com', time: '5h', originalPost: 'Check out this sunset 🌅', text: 'Stunning colors!' }
  ], 
  Feeds: [], 
  Lists: [ 
    { id: 'l1', name: 'Art Inspiration', count: 12, avatars: ['https://picsum.photos/50/50?random=101', 'https://picsum.photos/50/50?random=102'] },
    { id: 'l2', name: 'Tech Favorites', count: 5, avatars: [] }
  ] 
};
export const MOCK_RECENT_SEARCHES = ["Cyberpunk aesthetics"];
export const MOCK_EXTENDED_TRENDING = [{ rank: 1, topic: "Neurolink V2", volume: "2.5M", context: "Tech" }];
export const MOCK_ALL_FEEDS = [{ id: 'feed1', name: 'Following', icon: 'Home', description: 'Updates from users you follow.', subscribers: 'You', creator: 'System', creatorHandle: 'system.app', uri: 'at://did:plc:system:feed:following', type: 'Timeline', label: 'Official', created: '2023-01-01', language: 'en-US', tags: ['system', 'timeline'], viewerState: { isPinned: true, isSaved: true }, behavior: { sorting: 'Reverse Chronological', filterRules: ['Muted Accounts'], includedTypes: ['Posts'], replyRules: 'Following Only', muteRules: 'Standard', frequency: 'Real-time' } }];
export const MOCK_STORIES = [];

/**
 * EXHAUSTIVE SETTINGS STRUCTURE
 * 
 * Defines the Settings Menu hierarchy.
 * 'isFunctional: false' triggers the new Red "Unavailable" UI style.
 */
export const MOCK_SETTINGS_STRUCTURE = [
    {
        id: 'account_security',
        title: 'Account & Security',
        icon: 'Shield',
        items: [
            { id: 'com.atproto.identity.updateHandle', label: 'Change Handle', type: 'button', icon: 'AtSign', isFunctional: false },
            { id: 'com.atproto.server.updateEmail', label: 'Change Email', type: 'button', icon: 'Mail', isFunctional: false },
            { id: 'com.atproto.server.requestPasswordReset', label: 'Reset Password', type: 'button', icon: 'Key', isFunctional: false },
            { id: 'com.atproto.server.createAppPassword', label: 'App Passwords', type: 'button', icon: 'Lock', isFunctional: false },
            { id: 'deleteSession', label: 'Log Out', type: 'button', icon: 'LogOut', isFunctional: true, danger: true }
        ]
    },
    {
        id: 'privacy_moderation',
        title: 'Privacy & Safety',
        icon: 'EyeOff',
        items: [
            { id: 'app.bsky.actor.defs#adultContentPref.enabled', label: 'Show Adult Content', type: 'toggle', defaultValue: false, icon: 'Eye', isFunctional: true, atpType: 'app.bsky.actor.defs#adultContentPref', atpKey: 'enabled' },
            { id: 'app.bsky.actor.defs#contentLabelPref.visibility', label: 'Content Labeling', type: 'button', icon: 'Filter', isFunctional: true, atpType: 'app.bsky.actor.defs#contentLabelPref' },
            { id: 'app.bsky.actor.defs#mutedWordsPref.items[]', label: 'Muted Words', type: 'button', icon: 'VolumeX', isFunctional: false, atpType: 'app.bsky.actor.defs#mutedWordsPref' },
            { id: 'app.bsky.actor.defs#hiddenPostsPref.items[]', label: 'Hidden Posts', type: 'button', icon: 'EyeOff', isFunctional: false, atpType: 'app.bsky.actor.defs#hiddenPostsPref' },
            { id: 'chat.bsky.actor.declaration.allowIncoming', label: 'Allow DMs From', type: 'value', defaultValue: 'following', options: ['all', 'none', 'following'], icon: 'Mail', isFunctional: false },
            { id: 'app.bsky.actor.defs#verificationPrefs.hideBadges', label: 'Hide Verification Badges', type: 'toggle', defaultValue: false, icon: 'ShieldCheck', isFunctional: true, atpType: 'app.bsky.actor.defs#verificationPrefs', atpKey: 'hideBadges' },
        ]
    },
    {
        id: 'notifications',
        title: 'Notifications',
        icon: 'Bell',
        items: [
            { id: 'app.bsky.notification.preferences.chat.push', label: 'Push: Direct Messages', type: 'toggle', defaultValue: true, icon: 'MessageCircle', isFunctional: false },
            { id: 'app.bsky.notification.preferences.follow.push', label: 'Push: New Followers', type: 'toggle', defaultValue: true, icon: 'UserPlus', isFunctional: false },
            { id: 'app.bsky.notification.preferences.like.push', label: 'Push: Likes', type: 'toggle', defaultValue: true, icon: 'Heart', isFunctional: false },
            { id: 'app.bsky.notification.preferences.mention.push', label: 'Push: Mentions', type: 'toggle', defaultValue: true, icon: 'AtSign', isFunctional: false },
            { id: 'app.bsky.notification.preferences.reply.push', label: 'Push: Replies', type: 'toggle', defaultValue: true, icon: 'MessageSquare', isFunctional: false },
            { id: 'app.bsky.notification.preferences.repost.push', label: 'Push: Reposts', type: 'toggle', defaultValue: true, icon: 'Repeat', isFunctional: false },
            { id: 'app.bsky.notification.preferences.quote.push', label: 'Push: Quotes', type: 'toggle', defaultValue: true, icon: 'Quote', isFunctional: false },
            { id: 'app.bsky.notification.preferences.starterpackJoined.push', label: 'Push: Starter Pack Joins', type: 'toggle', defaultValue: false, icon: 'Package', isFunctional: false }
        ]
    },
    {
        id: 'appearance_feed',
        title: 'Content & Display',
        icon: 'Layout',
        items: [
            { id: 'app.bsky.actor.defs#threadViewPref.sort', label: 'Thread Sort Order', type: 'value', defaultValue: 'newest', options: ['oldest', 'newest', 'most-likes', 'random', 'hotness'], icon: 'ArrowDown', isFunctional: true, atpType: 'app.bsky.actor.defs#threadViewPref', atpKey: 'sort' },
            { id: 'app.bsky.actor.defs#feedViewPref.hideReplies', label: 'Hide Replies', type: 'toggle', defaultValue: false, icon: 'MessageSquare', isFunctional: true, atpType: 'app.bsky.actor.defs#feedViewPref', atpKey: 'hideReplies' },
            { id: 'app.bsky.actor.defs#feedViewPref.hideRepliesByUnfollowed', label: 'Hide Unfollowed Replies', type: 'toggle', defaultValue: true, icon: 'UserX', isFunctional: true, atpType: 'app.bsky.actor.defs#feedViewPref', atpKey: 'hideRepliesByUnfollowed' },
            { id: 'app.bsky.actor.defs#feedViewPref.hideReposts', label: 'Hide Reposts', type: 'toggle', defaultValue: false, icon: 'Repeat', isFunctional: true, atpType: 'app.bsky.actor.defs#feedViewPref', atpKey: 'hideReposts' },
            { id: 'app.bsky.actor.defs#feedViewPref.hideQuotePosts', label: 'Hide Quote Posts', type: 'toggle', defaultValue: false, icon: 'Quote', isFunctional: true, atpType: 'app.bsky.actor.defs#feedViewPref', atpKey: 'hideQuotePosts' },
            { id: 'hideTextOnly', label: 'Hide Text-Only Posts', type: 'toggle', defaultValue: true, icon: 'Type', isFunctional: true },
            { id: 'app.bsky.actor.defs#savedFeedsPrefV2.items[]', label: 'Manage Saved Feeds', type: 'button', icon: 'List', isFunctional: false, atpType: 'app.bsky.actor.defs#savedFeedsPrefV2' },
        ]
    },
    {
        id: 'profile_visuals',
        title: 'Profile Appearance',
        icon: 'User',
        items: [
            { id: 'app.bsky.actor.profile.displayName', label: 'Display Name', type: 'button', icon: 'Type', isFunctional: true },
            { id: 'app.bsky.actor.profile.description', label: 'Bio / Description', type: 'button', icon: 'Edit3', isFunctional: true },
            { id: 'app.bsky.actor.profile.avatar', label: 'Profile Picture', type: 'button', icon: 'Image', isFunctional: true },
            { id: 'app.bsky.actor.profile.banner', label: 'Banner Image', type: 'button', icon: 'Layout', isFunctional: true },
        ]
    },
    {
        id: 'advanced_danger',
        title: 'Advanced & Danger Zone',
        icon: 'Cpu',
        items: [
            { id: 'app.bsky.actor.defs#bskyAppStatePref', label: 'Internal App State', type: 'button', icon: 'Database', isFunctional: false },
            { id: 'com.atproto.server.deactivateAccount', label: 'Deactivate Account', type: 'button', icon: 'UserMinus', isFunctional: false, danger: true },
            { id: 'com.atproto.server.deleteAccount', label: 'Delete Account', type: 'button', icon: 'Trash2', isFunctional: false, danger: true },
        ]
    }
];
