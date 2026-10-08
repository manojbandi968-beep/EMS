import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { AuthContextType, UserProfile } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch or sync user profile from profiles table
  const fetchProfile = useCallback(async (userId: string, currentUser?: User | null) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Notice: Could not load profile from table:', error.message);
      }

      if (data) {
        setProfile(data as UserProfile);
        return;
      }

      // If matching row is not yet created, create or fall back to metadata
      const u = currentUser || user;
      const fallbackName = u?.user_metadata?.full_name || u?.email?.split('@')[0] || 'User';
      const defaultRole = (u?.user_metadata?.role as UserProfile['role']) || 'user';

      // Attempt to ensure matching profile row exists
      const { data: insertedData } = await supabase
        .from('profiles')
        .upsert(
          {
            id: userId,
            full_name: fallbackName,
            role: defaultRole,
          },
          { onConflict: 'id' }
        )
        .select()
        .maybeSingle();

      setProfile(
        (insertedData as UserProfile) || {
          id: userId,
          full_name: fallbackName,
          role: defaultRole,
        }
      );
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  }, [user]);

  // Refresh profile manually
  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id, user);
    }
  }, [user, fetchProfile]);

  // Persistent login session listener
  useEffect(() => {
    let isMounted = true;

    // Retrieve active session from localStorage
    supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
      if (!isMounted) return;
      if (error) {
        console.error('Error getting initial session:', error);
      }

      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      if (initialSession?.user) {
        fetchProfile(initialSession.user.id, initialSession.user).finally(() => {
          if (isMounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // Listen for auth state transitions (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        await fetchProfile(newSession.user.id, newSession.user);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Register with email, password, and full name
  const register = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'user',
          },
        },
      });

      if (error) {
        return { error, user: null };
      }

      const createdUser = data.user;

      if (createdUser) {
        // Create matching row in the profiles table with role user
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(
            {
              id: createdUser.id,
              full_name: fullName.trim(),
              role: 'user',
            },
            { onConflict: 'id' }
          );

        if (profileError) {
          console.error('Failed to create matching row in profiles table:', profileError);
        } else {
          setProfile({
            id: createdUser.id,
            full_name: fullName.trim(),
            role: 'user',
          });
        }
      }

      return { error: null, user: createdUser };
    } catch (err: any) {
      return { error: err, user: null };
    }
  };

  // Login with email and password
  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        await fetchProfile(data.user.id, data.user);
      }

      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setUser(null);
      setProfile(null);
      setSession(null);
    }
  };

  const isAdmin = profile?.role === 'admin';

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    isAdmin,
    isConfigured: isSupabaseConfigured,
    login,
    register,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
