export type EventCategory = 
  | 'All' 
  | 'Technology' 
  | 'Music' 
  | 'Business' 
  | 'Design & Art' 
  | 'Health & Wellness' 
  | 'Food & Wine';

export interface EventItem {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  date: string;
  time: string;
  location: string;
  isOnline: boolean;
  price: number | 'Free';
  imageUrl: string;
  organizer: {
    name: string;
    avatar: string;
  };
  capacity: number;
  registeredCount: number;
  featured?: boolean;
  badge?: string;
}

export interface FilterState {
  searchQuery: string;
  category: EventCategory;
  location: string;
}
