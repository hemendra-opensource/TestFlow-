import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase.js';
import { apiClient } from '../../lib/apiClient.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEmailUnconfirmed, setIsEmailUnconfirmed] = useState(false);

  // Fetch safe profile info from the server /api/v1/auth/me
  const fetchProfile = useCallback(async () => {
    try {
      const profileData = await apiClient.get('/auth/me');
      setProfile(profileData);
      return profileData;
    } catch (err) {
      console.warn('Failed to fetch user profile from server:', err.message);
      return null;
    }
  }, []);

  // Initialize session and restore state
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        setLoading(true);
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (mounted) {
          if (initialSession) {
            setSession(initialSession);
            setUser(initialSession.user);
            setIsEmailUnconfirmed(!initialSession.user.email_confirmed_at);
            await fetchProfile();
          } else {
            setSession(null);
            setUser(null);
            setProfile(null);
          }
        }
      } catch (err) {
        if (mounted) {
          console.error('Error during auth initialization:', err);
          setError(err.message);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    // Listen for auth state changes (login, logout, token refresh, password reset)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        setSession(newSession);
        setUser(newSession?.user || null);
        setIsEmailUnconfirmed(Boolean(newSession?.user && !newSession.user.email_confirmed_at));
        if (newSession) {
          await fetchProfile();
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    // Listen for auth expiration event dispatched by apiClient
    const handleAuthExpired = () => {
      logout();
    };
    window.addEventListener('teamflow:auth-expired', handleAuthExpired);

    return () => {
      mounted = false;
      subscription?.unsubscribe();
      window.removeEventListener('teamflow:auth-expired', handleAuthExpired);
    };
  }, [fetchProfile]);

  // Register
  const register = async ({ email, password, fullName }) => {
    setError(null);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (signUpError) {
      throw signUpError;
    }

    // Check if email confirmation is required by Supabase project settings
    if (data.user && !data.session) {
      setIsEmailUnconfirmed(true);
    }

    return data;
  };

  // Login
  const login = async ({ email, password }) => {
    setError(null);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      throw signInError;
    }

    setSession(data.session);
    setUser(data.user);
    setIsEmailUnconfirmed(!data.user.email_confirmed_at);
    await fetchProfile();
    return data;
  };

  // Logout
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Error signing out:', err);
    } finally {
      setSession(null);
      setUser(null);
      setProfile(null);
    }
  };

  // Forgot password request
  const requestPasswordReset = async (email) => {
    setError(null);
    const redirectUrl = `${window.location.origin}/reset-password`;
    const { data, error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (resetError) {
      throw resetError;
    }

    return data;
  };

  // Update password (during reset-password recovery)
  const updatePassword = async (newPassword) => {
    setError(null);
    const { data, error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      throw updateError;
    }

    return data;
  };

  // Update profile
  const updateProfile = async ({ full_name, avatar_url }) => {
    const updated = await apiClient.patch('/auth/profile', {
      full_name,
      avatar_url,
    });
    setProfile(updated);
    return updated;
  };

  const value = {
    user,
    session,
    profile,
    loading,
    error,
    isEmailUnconfirmed,
    isConfigured: isSupabaseConfigured,
    register,
    login,
    logout,
    requestPasswordReset,
    updatePassword,
    updateProfile,
    refreshProfile: fetchProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
