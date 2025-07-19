import { User as SupabaseUser } from '@supabase/supabase-js';
import { Profile } from '../lib/supabase';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'admin' | 'moderator';
  avatar_url?: string;
  organization: string;
  joinedDate: string;
  engagementScore: number;
  totalEvents: number;
  badges: string[];
}

export interface AuthUser extends SupabaseUser {
  profile?: Profile;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (userData: any) => Promise<User | null>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}