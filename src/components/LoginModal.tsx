import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { Dialog } from '@headlessui/react';
import { X, User, Mail, LogOut, Edit } from 'lucide-react';

type User = {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
};

type Profile = {
  id: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  initialMode?: 'login' | 'signup';
}

const LoginProfileModal = ({ isOpen, onClose, user, initialMode = 'login' }: Props) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [signupSuccessEmail, setSignupSuccessEmail] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    setIsLogin(initialMode === 'login');
  }, [initialMode]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setIsEditing(false);
      setEditName('');
    }
  }, [user]);

  // Handle auth state changes (important for email confirmation)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // User just signed in (including after email confirmation)
          setAuthLoading(true);
          setSignupSuccessEmail(null);
          
          // Small delay to ensure the session is fully established
          setTimeout(() => {
            setAuthLoading(false);
          }, 1000);
        }
        
        if (event === 'SIGNED_OUT') {
          setProfile(null);
          setIsEditing(false);
          setEditName('');
          setSignupSuccessEmail(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          const defaultProfile = {
            id: user.id,
            full_name: user.user_metadata?.full_name || 'Unnamed User',
            created_at: new Date().toISOString(),
          };
          const { error: insertError } = await supabase.from('profiles').insert(defaultProfile);
          if (insertError) {
            console.error('Error creating profile:', insertError);
            setError('Failed to initialize profile.');
            return;
          }
          setProfile(defaultProfile);
          setEditName(defaultProfile.full_name);
        } else {
          console.error('Error fetching profile:', error);
          setError('Failed to fetch profile.');
        }
        return;
      }

      setProfile(data);
      setEditName(data.full_name || '');
    } catch (err) {
      console.error('Profile fetch error:', err);
      setError('An unexpected error occurred while fetching profile.');
    }
  };

  const reset = () => {
    setEmail('');
    setPassword('');
    setName('');
    setError(null);
    setLoading(false);
    setIsEditing(false);
    setIsLogin(initialMode === 'login');
    setSignupSuccessEmail(null);
  };

  const validateForm = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!password.trim()) {
      setError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (!isLogin && !name.trim()) {
      setError('Full name is required for signup');
      return false;
    }
    return true;
  };

  const handleEmailAuth = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError('Invalid email or password.');
          } else if (error.message.includes('Email not confirmed')) {
            setError('Please confirm your email before signing in.');
          } else {
            setError(error.message);
          }
        } else {
          reset();
        }
      } else {
        const signupEmail = email.trim().toLowerCase();
        const { data, error } = await supabase.auth.signUp({
          email: signupEmail,
          password,
          options: {
            data: { full_name: name.trim() },
          },
        });

        if (error) {
          setError(error.message);
          return;
        }

        if (data.user) {
          await supabase.from('profiles').insert({
            id: data.user.id,
            full_name: name.trim(),
            created_at: new Date().toISOString(),
          });

          setSignupSuccessEmail(signupEmail);
        }

        setEmail('');
        setPassword('');
        setName('');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError('Failed to authenticate with Google.');
      console.error('Google auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      reset();
      onClose();
    } catch (err) {
      setError('Failed to sign out.');
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user || !profile) return;

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: editName.trim() })
        .eq('id', user.id);

      if (error) {
        setError('Failed to update profile.');
        return;
      }

      setProfile({ ...profile, full_name: editName.trim() });
      setIsEditing(false);
    } catch (err) {
      setError('An error occurred while updating your profile.');
      console.error('Profile update error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Show loading state while auth is being processed
  if (authLoading) {
    return (
      <Dialog open={isOpen} onClose={handleClose} className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-xl p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-zinc-400">Loading your profile...</p>
          </div>
        </div>
      </Dialog>
    );
  }

  // If signup just happened, show confirmation screen
  if (signupSuccessEmail) {
    return (
      <Dialog open={isOpen} onClose={handleClose} className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-xl p-8 text-center">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition"
              disabled={loading}
            >
              <X size={22} />
            </button>
            <Dialog.Title className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Confirm Your Email
            </Dialog.Title>
            <p className="text-gray-600 dark:text-zinc-400 mb-6">
              We've sent a confirmation link to <strong>{signupSuccessEmail}</strong>. <br />
              Please check your inbox and confirm your account.
            </p>
            <button
              onClick={() => {
                setSignupSuccessEmail(null);
                setIsLogin(true); // return to login
              }}
              className="w-full bg-black dark:bg-white text-white dark:text-black py-2 rounded-md font-medium hover:opacity-90 transition"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </Dialog>
    );
  }

  if (user) {
    const displayName = profile?.full_name || user.user_metadata?.full_name || 'User';
    const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url;

    return (
      <Dialog open={isOpen} onClose={handleClose} className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-xl p-8">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition"
              disabled={loading}
            >
              <X size={22} />
            </button>
            <Dialog.Title className="text-2xl font-semibold text-center text-gray-900 dark:text-white mb-6">
              Profile
            </Dialog.Title>
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-gray-200 dark:bg-zinc-700 rounded-full flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover" />
                  ) : (
                    <User size={32} className="text-gray-500 dark:text-zinc-400" />
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User size={18} className="text-gray-500 dark:text-zinc-400" />
                    {isEditing ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-3 py-1 rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={loading}
                      />
                    ) : (
                      <span className="text-gray-900 dark:text-white">{displayName}</span>
                    )}
                  </div>
                  <button
                    onClick={isEditing ? handleUpdateProfile : () => setIsEditing(true)}
                    disabled={loading}
                    className="text-blue-600 hover:text-blue-700 disabled:opacity-50"
                  >
                    <Edit size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-gray-500 dark:text-zinc-400" />
                  <span className="text-gray-900 dark:text-white">{user.email}</span>
                </div>
                {profile?.created_at && (
                  <div className="text-sm text-gray-500 dark:text-zinc-400">
                    Member since {new Date(profile.created_at).toLocaleDateString()}
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {isEditing && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdateProfile}
                      disabled={loading || !editName.trim()}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditName(profile?.full_name || '');
                      }}
                      disabled={loading}
                      className="flex-1 bg-gray-200 dark:bg-zinc-700 text-gray-900 dark:text-white py-2 rounded-md font-medium hover:bg-gray-300 dark:hover:bg-zinc-600 transition"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 py-2 rounded-md font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              </div>
              {error && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Dialog>
    );
  }

  // Show login/signup form if not logged in
  return (
    <Dialog open={isOpen} onClose={handleClose} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
        <div className="relative z-10 w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-xl p-8">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition"
            disabled={loading}
          >
            <X size={22} />
          </button>
          <Dialog.Title className="text-2xl font-semibold text-center text-gray-900 dark:text-white mb-6">
            {isLogin ? 'Sign In' : 'Sign Up'}
          </Dialog.Title>
          <div className="flex justify-center mb-4 text-sm text-gray-600 dark:text-zinc-400">
            {isLogin ? (
              <>
                Don't have an account?&nbsp;
                <button
                  onClick={() => setIsLogin(false)}
                  className="text-blue-600 hover:underline"
                  disabled={loading}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?&nbsp;
                <button
                  onClick={() => setIsLogin(true)}
                  className="text-blue-600 hover:underline"
                  disabled={loading}
                >
                  Sign in
                </button>
              </>
            )}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleEmailAuth();
            }}
            className="space-y-4"
          >
            {!isLogin && (
              <div>
                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            )}
            <div>
              <input
                type="email"
                placeholder="Email"
                className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-black dark:bg-white text-white dark:text-black py-2 rounded-md font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>
          <div className="flex items-center gap-2 my-4">
            <hr className="flex-1 border-gray-300 dark:border-zinc-700" />
            <span className="text-sm text-gray-500 dark:text-zinc-400">or</span>
            <hr className="flex-1 border-gray-300 dark:border-zinc-700" />
          </div>
          <button
            onClick={handleGoogleAuth}
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 dark:bg-zinc-800 dark:border-zinc-700 text-black dark:text-white py-2 rounded-md hover:bg-gray-50 dark:hover:bg-zinc-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-5 h-5"
            />
            Continue with Google
          </button>
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
};

export default LoginProfileModal;