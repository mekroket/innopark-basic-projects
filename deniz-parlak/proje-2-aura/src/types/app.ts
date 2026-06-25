export interface UserProfile {
  id: string;
  name: string;
  title: string;
  avatar: string;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export interface Comment {
  id: string;
  user: string;
  avatar: string;
  text: string;
  time: string;
}

export interface Post {
  id: string;
  user: string;
  avatar: string;
  location: string;
  content: string;
  image?: string;
  likes: number;
  comments: Comment[];
  time: string;
  isLiked: boolean;
}

export interface EventItem {
  id: string;
  title: string;
  date: string;
  location: string;
  attendees: number;
  img: string;
  category: string;
  description: string;
}

export interface CommunityHubItem {
  id: string;
  name: string;
  members: number;
  type: string;
  color: string;
  description: string;
  isJoined: boolean;
}

export interface NotificationItem {
  id: string;
  text: string;
  time: string;
  unread: boolean;
}

export interface AppSettings {
  theme: 'dark' | 'light';
  notificationsEnabled: boolean;
  animationsEnabled: boolean;
}