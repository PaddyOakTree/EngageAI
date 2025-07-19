import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import type { Profile } from './lib/supabase';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import ProfileSettings from './components/ProfileSettings';
import SessionView from './components/SessionView';
import SessionsPage from './components/SessionsPage';
import AnalyticsPage from './components/AnalyticsPage';
import PreferencesPage from './components/PreferencesPage';
import AuthCallback from './components/AuthCallback';
import { User, AuthContextType } from './types/auth';

// Auth Context
export const AuthContext = React.createContext<AuthContextType | null>(null);

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing Supabase session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadUserProfile(session.user.id, session.user.email!);
      }
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserProfile(session.user.id, session.user.email!);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string, email: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profile && !error) {
        setUser({
          id: profile.id,
          email: email,
          name: profile.name,
          role: profile.role,
          avatar_url: profile.avatar_url,
          organization: profile.organization || '',
          joinedDate: profile.joined_date,
          engagementScore: profile.engagement_score,
          totalEvents: profile.total_events,
          badges: profile.badges
        });
      } else if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create one
        console.log('Profile not found, creating default profile for user:', userId);
        
        const defaultProfile = {
          id: userId,
          name: email.split('@')[0], // Use email prefix as default name
          organization: '',
          role: 'student' as const,
          engagement_score: 0,
          total_events: 0,
          badges: ['New Member'],
          avatar_url: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
        };

        const { error: profileError } = await supabase
          .from('profiles')
          .insert(defaultProfile);

        if (profileError) {
          console.error('Error creating profile:', profileError);
          return;
        }

        // Create default preferences
        const { error: prefsError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: userId
          });

        if (prefsError) {
          console.error('Error creating preferences:', prefsError);
        }

        // Set user with default profile
        setUser({
          id: userId,
          email: email,
          name: defaultProfile.name,
          role: defaultProfile.role,
          avatar_url: defaultProfile.avatar_url,
          organization: defaultProfile.organization,
          joinedDate: new Date().toISOString().split('T')[0],
          engagementScore: defaultProfile.engagement_score,
          totalEvents: defaultProfile.total_events,
          badges: defaultProfile.badges
        });
      } else {
        console.error('Error loading profile:', error);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const login = (email: string, password: string): Promise<User> => {
    return new Promise(async (resolve, reject) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          reject(new Error(error.message));
          return;
        }

        if (data.user) {
          await loadUserProfile(data.user.id, data.user.email!);
          
          // Get the updated user from state after profile loading
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profile) {
            const userObj: User = {
              id: profile.id,
              email: data.user.email!,
              name: profile.name,
              role: profile.role,
              avatar_url: profile.avatar_url,
              organization: profile.organization || '',
              joinedDate: profile.joined_date,
              engagementScore: profile.engagement_score,
              totalEvents: profile.total_events,
              badges: profile.badges
            };
            resolve(userObj);
          } else {
            reject(new Error('Failed to load user profile'));
          }
        }
      } catch (error) {
        reject(error);
      }
    });
  };

  const signup = (userData: any): Promise<User | null> => {
    return new Promise(async (resolve, reject) => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: userData.email,
          password: userData.password,
          options: {
            data: {
              name: userData.name,
              organization: userData.organization
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });

        if (error) {
          reject(new Error(error.message));
          return;
        }

        if (data.user && data.session) {
          // User is confirmed immediately (if email confirmation is disabled)
          const profileData = {
            id: data.user.id,
            name: userData.name,
            organization: userData.organization || '',
            role: 'student' as const,
            engagement_score: 0,
            total_events: 0,
            badges: ['New Member'],
            avatar_url: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
          };

          const { error: profileError } = await supabase
            .from('profiles')
            .insert(profileData);

          if (profileError) {
            console.error('Error creating profile:', profileError);
            reject(new Error('Failed to create user profile'));
            return;
          }

          // Create default preferences
          const { error: prefsError } = await supabase
            .from('user_preferences')
            .insert({
              user_id: data.user.id
            });

          if (prefsError) {
            console.error('Error creating preferences:', prefsError);
          }

          const newUser: User = {
            id: data.user.id,
            email: userData.email,
            name: profileData.name,
            role: profileData.role,
            avatar_url: profileData.avatar_url,
            organization: profileData.organization,
            joinedDate: new Date().toISOString().split('T')[0],
            engagementScore: profileData.engagement_score,
            totalEvents: profileData.total_events,
            badges: profileData.badges
          };
          
          setUser(newUser);
          resolve(newUser);
        } else if (data.user && !data.session) {
          // User needs to confirm email
          console.log('User needs to confirm email before signing in');
          resolve(null); // Return null to indicate email confirmation is needed
        }
      } catch (error) {
        reject(error);
      }
    });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateUser = async (updates: Partial<User>) => {
    if (user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            name: updates.name || user.name,
            organization: updates.organization || user.organization,
            avatar_url: updates.avatar_url || user.avatar_url
          })
          .eq('id', user.id);

        if (error) {
          console.error('Error updating profile:', error);
          return;
        }

        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
      } catch (error) {
        console.error('Error updating user:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
          <Routes>
            <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
            <Route path="/auth" element={user ? <Navigate to="/dashboard" /> : <AuthPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/auth" />} />
            <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/dashboard" />} />
            <Route path="/profile" element={user ? <ProfileSettings /> : <Navigate to="/auth" />} />
            <Route path="/session/:id" element={user ? <SessionView /> : <Navigate to="/auth" />} />
            <Route path="/sessions" element={user ? <SessionsPage /> : <Navigate to="/auth" />} />
            <Route path="/analytics" element={user ? <AnalyticsPage /> : <Navigate to="/auth" />} />
            <Route path="/preferences" element={user ? <PreferencesPage /> : <Navigate to="/auth" />} />
          </Routes>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;