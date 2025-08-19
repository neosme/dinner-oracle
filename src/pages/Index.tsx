import React, { useState, useEffect } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import { supabase } from '@/supabaseClient';
import LoginProfileModal from '@/components/LoginModal'; 

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

const AvatarButton = ({ user, profile, onClick }: { 
  user: User | null; 
  profile: Profile | null; 
  onClick: () => void;
}) => {
  const getDisplayName = () => {
    if (profile?.full_name) return profile.full_name;
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    return user?.email?.split('@')[0] || 'User';
  };

  const getAvatarUrl = () => {
    return profile?.avatar_url || user?.user_metadata?.avatar_url;
  };

  if (!user) return null;

  return (
    <button
      onClick={onClick}
      className="group relative flex items-center gap-2 hover:opacity-80 transition-opacity"
      title={`Signed in as ${getDisplayName()}`}
    >
      <div className="w-10 h-10 bg-gray-200 dark:bg-zinc-700 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-transparent group-hover:ring-blue-500/30 transition-all">
        {getAvatarUrl() ? (
          <img
            src={getAvatarUrl()}
            alt={getDisplayName()}
            className="w-full h-full object-cover"
          />
        ) : (
          <User size={20} className="text-gray-500 dark:text-zinc-400" />
        )}
      </div>
      <span className="hidden sm:block text-sm text-gray-700 dark:text-zinc-300 max-w-20 truncate">
        {getDisplayName()}
      </span>
    </button>
  );
};

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user as User || null);
      setLoading(false);
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user as User || null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        // Close modal on successful login
        if (event === 'SIGNED_IN') {
          setIsModalOpen(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data || null);
    } catch (err) {
      console.error('Profile fetch error:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile(user.id);
    }
  }, [user]);

  const handleLoginClick = () => {
    setIsSignUp(false);
    setIsModalOpen(true);
  };

  const handleSignUpClick = () => {
    setIsSignUp(true);
    setIsModalOpen(true);
  };

  const handleAvatarClick = () => {
    setIsSignUp(false);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header with Auth */}
      <header className="w-full py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex justify-end">
          {!loading && (
            <div className="flex items-center gap-3">
              {user ? (
                <AvatarButton 
                  user={user} 
                  profile={profile} 
                  onClick={handleAvatarClick}
                />
              ) : (
                <>
                  <Button
                    onClick={handleLoginClick}
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                  >
                    Login
                  </Button>
                  <Button
                    onClick={handleSignUpClick}
                    size="sm"
                    className="rounded-full"
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-1 flex flex-col items-center justify-center px-3 sm:px-4 max-w-2xl mx-auto w-full py-8 sm:py-0">
        <div className="text-center w-full">
          <h1 className="sr-only">Recipe Recommender</h1>
          <div className="mb-6 sm:mb-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-normal text-foreground mb-4 sm:mb-6 leading-tight">
              What's for Dinner?
            </h2>
          </div>
          
          <SearchBar />
        </div>
      </main>
       
      {/* Footer */}
      <footer className="hidden sm:flex justify-center gap-6 md:gap-8 pb-6 sm:pb-8 text-sm text-muted-foreground">
        <a 
          href="/about"
          className="hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded px-2 py-1 min-h-[44px] flex items-center"
        >
          About
        </a>
        <a 
          href="/privacy"
          className="hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded px-2 py-1 min-h-[44px] flex items-center"
        >
          Privacy
        </a>
      </footer>

      <LoginProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={user}
        initialMode={isSignUp ? 'signup' : 'login'}
      />
    </div>
  );
};

export default Index;