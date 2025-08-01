import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { emailService } from '@/services/emailService';

interface Profile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  phone: string | null;
  avatar_url: string | null;
  address: string | null;
  date_of_birth: string | null;
  emergency_contact: string | null;
  medical_notes: string | null;
  goals: string | null;
  preferences: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData: { firstName: string; lastName: string; role?: string }) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    console.log('AuthContext: Fetching profile for user:', userId);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(); // Use maybeSingle() instead of single() to handle missing profiles

      if (error) {
        console.error('AuthContext: Error fetching profile:', error);
        return;
      }

      if (data) {
        console.log('AuthContext: Profile found and set:', data.role);
        setProfile(data);
      } else {
        // Profile doesn't exist - this should have been created by trigger
        // Try to create it manually as fallback
        console.warn('AuthContext: Profile not found for user, attempting to create...');
        await createProfileForUser(userId);
      }
    } catch (error) {
      console.error('AuthContext: Error in fetchProfile:', error);
    }
  };

  const createProfileForUser = async (userId: string) => {
    console.log('AuthContext: Creating profile for user:', userId);
    
    try {
      // Get user data from auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('AuthContext: No user found when trying to create profile');
        return;
      }

      const profileData = {
        user_id: userId,
        first_name: user.user_metadata?.first_name || '',
        last_name: user.user_metadata?.last_name || '',
        role: user.user_metadata?.role || 'client'
      };

      console.log('AuthContext: Creating profile with data:', profileData);

      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        console.error('AuthContext: Error creating profile:', error);
        return;
      }

      if (data) {
        console.log('AuthContext: Profile created successfully:', data);
        setProfile(data);
      }
    } catch (error) {
      console.error('AuthContext: Error in createProfileForUser:', error);
    }
  };

  useEffect(() => {
    console.log('AuthContext: Setting up auth state listener');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('AuthContext: Auth state changed:', event, session ? 'session exists' : 'no session');
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('AuthContext: User found, fetching profile for:', session.user.id);
          // Defer profile fetching to prevent deadlocks
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          console.log('AuthContext: No user, clearing profile');
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    console.log('AuthContext: Checking for existing session');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthContext: Initial session check:', session ? 'session exists' : 'no session');
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('AuthContext: Initial session has user, fetching profile');
        setTimeout(() => {
          fetchProfile(session.user.id);
        }, 0);
      } else {
        console.log('AuthContext: No initial session, setting loading to false');
        setLoading(false);
      }
    });

    return () => {
      console.log('AuthContext: Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Clean up existing state first
      cleanupAuthState();
      
      // Attempt global sign out
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Force page reload for clean state
        window.location.href = '/';
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string, userData: { firstName: string; lastName: string; role?: string }) => {
    try {
      // Clean up existing state first
      cleanupAuthState();
      
      // WORKAROUND: Supabase bug - "Confirm email" is OFF but still sends verification emails
      // Solution: Don't provide emailRedirectTo to prevent Supabase from sending broken emails
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // NO emailRedirectTo - this prevents Supabase from sending verification emails
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            role: userData.role || 'client'
          }
        }
      });

      // Since "Confirm email" should be OFF, users should be auto-verified
      // But we'll handle both cases for safety
      if (!error && data.user) {
        // If user is already confirmed (expected with "Confirm email" OFF)
        if (data.user.email_confirmed_at) {
          console.log('User auto-verified by Supabase');
          // User is ready to login - don't sign out
        } else {
          // If somehow still unverified, sign out for security
          console.log('User requires verification - signing out for security');
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
          setProfile(null);
        }

        // Send our custom welcome email (this works properly)
        try {
          await emailService.sendWelcomeEmail(
            email, 
            userData.firstName, 
            userData.lastName
          );
          console.log('Welcome email sent successfully');
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
          // Don't block registration for email failures
        }
      }

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      // Clean up auth state
      cleanupAuthState();
      
      // Attempt global sign out
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }
      
      // Force page reload for clean state
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const cleanupAuthState = () => {
    // Remove all Supabase auth keys from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    // Remove from sessionStorage if in use
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  };

  const resetPassword = async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/auth?mode=reset`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};