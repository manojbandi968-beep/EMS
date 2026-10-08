import type { User, Session } from '@supabase/supabase-js';

export type UserRole = 'user' | 'admin' | 'organizer';

export interface UserProfile {
  id: string;
  full_name: string;
  role: UserRole;
  created_at?: string;
}

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isConfigured: boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  register: (email: string, password: string, fullName: string) => Promise<{ error: Error | null; user: User | null }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}
