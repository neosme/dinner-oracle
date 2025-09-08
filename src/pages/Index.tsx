import React, { useState, useEffect, useCallback } from "react";
import SearchBar from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import {
  User,
  BookOpen,
  Plus,
  Menu,
  Clock,
  Users,
  ChefHat,
  X,
  PanelLeftOpen,
  PanelLeftClose,
} from "lucide-react";
import { supabase } from "@/supabaseClient";
import LoginProfileModal from "@/components/LoginModal";
import RecipeCard, { RecipeCardProps } from "@/components/RecipeCard";

import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type UserType = {
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

type SavedRecipe = {
  id: number;
  title: string;
  ingredients: string[];
  instructions: string[];
  prep_time_minutes: number;
  cook_time_minutes: number;
  total_time_minutes: number;
  servings: number;
  notes?: string;
  cuisine: string;
  diet_type: string;
  spice_level: string;
  is_veg: boolean;
  protein_rich: boolean;
  occasion: string;
  season: string;
  meal_types: string[];
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || process.env.REACT_APP_API_BASE_URL;

const AvatarButton = ({
  user,
  profile,
  onClick,
}: {
  user: UserType | null;
  profile: Profile | null;
  onClick: () => void;
}) => {
  const getDisplayName = () => {
    if (profile?.full_name) return profile.full_name;
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    return user?.email?.split("@")[0] || "User";
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
      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center overflow-hidden ring-2 ring-transparent group-hover:ring-primary/40 transition-all">
        {getAvatarUrl() ? (
          <img
            src={getAvatarUrl()}
            alt={getDisplayName()}
            className="w-full h-full object-cover"
          />
        ) : (
          <User size={20} className="text-primary-foreground" />
        )}
      </div>
      <span className="hidden sm:block text-sm text-foreground max-w-20 truncate">
        {getDisplayName()}
      </span>
    </button>
  );
};

const Index = () => {
  const [user, setUser] = useState<UserType | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [recipes, setRecipes] = useState<RecipeCardProps[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);

  const [selectedRecipe, setSelectedRecipe] = useState<SavedRecipe | null>(
    null
  );
  const [isRecipeDetailOpen, setIsRecipeDetailOpen] = useState(false);
  const [recentChats, setRecentChats] = useState<string[]>([
    "Tomato Rice Recipe",
    "Quick Pasta Ideas",
    "Healthy Salads",
  ]);
  const navigate = useNavigate();

  useEffect(() => {
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser((session?.user as UserType) || null);
      setLoading(false);
    };

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser((session?.user as UserType) || null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setSavedRecipes([]);
        setIsLoaded(false);
      }
      if (event === "SIGNED_IN") {
        setIsModalOpen(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }
      setProfile(data || null);
    } catch (err) {
      console.error("Profile fetch error:", err);
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

  const handleRecipeClick = (recipe: SavedRecipe) => {
    setSelectedRecipe(recipe);
    setIsRecipeDetailOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col border-r border-gray-200 bg-white shadow-lg fixed h-screen z-30 transition-transform duration-300 ease-in-out w-64 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-4 py-4 border-b border-gray-200 flex items-center justify-between w-full h-14">
          <h1 className="text-lg font-bold text-primary flex-1">
            Dinner Oracle
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="h-8 w-8 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
          <Button
            variant="outline"
            className="w-full flex items-center justify-start gap-2 text-sm"
          >
            <Plus size={14} className="flex-shrink-0" />
            <span className="truncate">New Chat</span>
          </Button>
          <div className="space-y-2">
            <h2 className="text-xs text-muted-foreground px-2">Recents</h2>
            <ul className="space-y-1">
              {recentChats.map((chat, idx) => (
                <li
                  key={idx}
                  className="cursor-pointer px-2 py-1.5 rounded-md hover:bg-muted text-xs truncate"
                  title={chat}
                >
                  {chat}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="fixed top-4 left-4 z-40 md:hidden h-10 w-10 bg-white shadow-md border"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="px-4 py-4 border-b h-14">
            <SheetTitle className="text-lg font-bold text-primary text-left">
              Dinner Oracle
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
            <Button
              variant="outline"
              className="w-full flex items-center justify-start gap-2 text-sm"
            >
              <Plus size={14} /> New Chat
            </Button>
            <div className="space-y-2">
              <h2 className="text-xs text-muted-foreground px-2">Recents</h2>
              <ul className="space-y-1">
                {recentChats.map((chat, idx) => (
                  <li
                    key={idx}
                    className="cursor-pointer px-2 py-1.5 rounded-md hover:bg-muted text-xs"
                  >
                    {chat}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sidebar Toggle Button for Desktop */}
      {!sidebarOpen && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-40 hidden md:flex h-10 w-10 bg-white shadow-md border hover:bg-gray-50"
        >
          <PanelLeftOpen className="h-5 w-5" />
        </Button>
      )}

      {/* Header */}
      <header className="fixed top-0 right-0 left-0 z-20 bg-white shadow-sm border-b border-gray-200 h-16 pt-2">
        <div className="px-4 sm:px-6 h-full flex items-center justify-end gap-3">
          {!loading && (
            <>
              {user ? (
                <>
                  {/* Saved Recipes */}
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full border-primary/30"
                    onClick={() => navigate("/saved-recipes")}
                  >
                    <BookOpen className="h-5 w-5 text-primary" />
                  </Button>

                  {/* Avatar / Profile */}
                  <AvatarButton
                    user={user}
                    profile={profile}
                    onClick={handleAvatarClick}
                  />
                </>
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
                    className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-screen flex flex-col items-center justify-start pt-16">
        <div className="w-full max-w-4xl mx-auto px-6 sm:px-8 md:px-10 min-w-[320px]">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold font-serif text-foreground">
              What's for <span className="text-primary">Meals</span>?
            </h1>
          </div>
        </div>
        <SearchBar
          userId={user?.id || null}
          sessionId="session-123"
          onResults={(results) => setRecipes(results)}
        />
      </main>

      <LoginProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={user}
        initialMode={isSignUp ? "signup" : "login"}
      />
    </div>
  );
};

export default Index;
