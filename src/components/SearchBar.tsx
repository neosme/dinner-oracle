import React, { useState } from "react";
import RecipeCard, { RecipeCardProps } from "./RecipeCard";
import { supabase } from "@/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface ApiResponse {
  session_id: string;
  original_query: string;
  conversational_response: string;
  search_result?: {
    recipes?: Recipe[];
  };
}

type Recipe = {
  id: string;
  title: string;
  description?: string;
  notes?: string[];
  ingredients?: string[];
  instructions?: string[];
  image_url?: string;
  total_time_minutes?: number;
  cuisine?: string;
  is_veg?: boolean;
  spice_level?: string;
  protein?: string;
};

type Message = {
  role: "user" | "assistant";
  content: string | JSX.Element;
  recipes?: Recipe[];
  isLoading?: boolean;
};

type SearchBarProps = {
  userId?: string | null;
  sessionId?: string | null;
  onResults?: (recipes: Recipe[]) => void;
  className?: string;
};

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default function SearchBar({
  userId,
  sessionId,
  onResults,
  className = "",
}: SearchBarProps) {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const handleViewRecipe = (recipe: RecipeCardProps) => {
    const details = (
      <div className="space-y-2 text-sm">
        <p>
          <strong>Time:</strong> {recipe.time || "N/A"}
        </p>
        <p>
          <strong>Cuisine:</strong> {recipe.cuisine || "N/A"}
        </p>
        <p>
          <strong>Spice Level:</strong> {recipe.spice_level || "N/A"}
        </p>
        <p>
          <strong>Type:</strong>{" "}
          {recipe.is_veg ? "Vegetarian 🥦" : "Non-Veg 🍗"}
        </p>

        {recipe.ingredients?.length > 0 && (
          <div>
            <strong>Ingredients:</strong>
            <ul className="list-disc pl-5">
              {recipe.ingredients.map((ing, i) => (
                <li key={i}>{ing}</li>
              ))}
            </ul>
          </div>
        )}

        {recipe.instructions?.length > 0 && (
          <div>
            <strong>Instructions:</strong>
            <ol className="list-decimal pl-5">
              {recipe.instructions.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        )}

        {recipe.notes?.length > 0 && (
          <div>
            <strong>Notes:</strong>
            <ul className="list-disc pl-5">
              {recipe.notes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );

    setMessages((prev) => [...prev, { role: "assistant", content: details }]);
  };

  // ✅ save handler
  const handleSaveRecipe = async (recipe: RecipeCardProps) => {
    if (!userId) {
      toast({
        title: "Login required",
        description: "⚠️ You must be logged in to save recipes.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("customer_recipes").insert({
      user_id: userId,
      recipe_id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      image_url: recipe.image_url,
      cuisine: recipe.cuisine,
      is_veg: recipe.is_veg,
      spice_level: recipe.spice_level,
      time: recipe.time,
      ingredients: recipe.ingredients || [],
      instructions: recipe.instructions || [],
      notes: recipe.notes || [],
    });
    if (error) {
      console.error("Error saving recipe:", error.message);
      toast({
        title: "Error",
        description: "❌ Failed to save recipe. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Recipe saved",
        description: `✅ ${recipe.title} was added to your saved recipes.`,
      });
    }
  };

  const Loader = () => (
    <div className="flex gap-2">
      <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
      <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
      <span className="w-2 h-2 bg-primary rounded-full animate-bounce"></span>
    </div>
  );

  // ✅ search handler
  const handleSearch = async () => {
    if (!query.trim()) return;
    const currentQuery = query;
    setQuery("");

    const newUserMsg: Message = { role: "user", content: query };
    setMessages((prev) => [...prev, newUserMsg]);

    const loaderMsg: Message = {
      role: "assistant",
      content: <Loader />,
      isLoading: true,
    };
    setMessages((prev) => [...prev, loaderMsg]);

    try {
      const response = await fetch(`${API_URL}/search/smart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          user_id: userId || "guest",
          session_id: sessionId || "default-session",
        }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data: ApiResponse = await response.json();

      // ✅ map recipes
      const mappedRecipes: Recipe[] =
        data.search_result?.recipes?.map((r) => ({
          id: r.id,
          title: r.title || "Untitled Recipe",
          description:
            r.description ||
            r.notes ||
            r.instructions ||
            "No description provided",
          image_url: r.image_url,
          total_time_minutes: r.total_time_minutes,
          cuisine: r.cuisine,
          is_veg: r.is_veg,
          spice_level: r.spice_level,
          protein: r.protein,
          ingredients: Array.isArray(r.ingredients)
            ? r.ingredients
            : r.ingredients
            ? [r.ingredients]
            : [],
          instructions: Array.isArray(r.instructions)
            ? r.instructions
            : r.instructions
            ? [r.instructions]
            : [],
          notes: Array.isArray(r.notes) ? r.notes : r.notes ? [r.notes] : [],
        })) || [];

      const assistantReply: Message = {
        role: "assistant",
        content:
          data.conversational_response || "Sorry, I couldn't find an answer.",
        recipes: mappedRecipes.map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          image_url: r.image_url,
          cuisine: r.cuisine,
          is_veg: r.is_veg,
          spice_level: r.spice_level,
          time: r.total_time_minutes || 0,
          ingredients: r.ingredients,
          instructions: r.instructions,
          notes: r.notes,
        })),
      };

      setMessages((prev) => {
        const newMsgs = [...prev];
        const loaderIndex = newMsgs.findIndex((m) => m.isLoading);
        if (loaderIndex !== -1) newMsgs.splice(loaderIndex, 1, assistantReply);
        else newMsgs.push(assistantReply);
        return newMsgs;
      });

      if (onResults) {
        onResults(mappedRecipes);
      }
    } catch (err) {
      console.error("Search failed:", err);
      setMessages((prev) => {
        const newMsgs = [...prev];
        const loaderIndex = newMsgs.findIndex((m) => m.isLoading);
        if (loaderIndex !== -1)
          newMsgs.splice(loaderIndex, 1, {
            role: "assistant",
            content: "Something went wrong. Try again.",
          });
        return newMsgs;
      });
    }
  };

  return (
    <div
      className={`flex flex-col items-center gap-6 w-full min-h-screen ${className}`}
    >
      {/* Chat messages with proper spacing */}
      <div className="w-full max-w-2xl space-y-6 pt-20 pb-32 px-4 sm:px-6 md:px-8">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex w-full ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`rounded-2xl px-4 sm:px-6 py-3 sm:py-4 shadow-sm overflow-hidden ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-none max-w-[85%] sm:max-w-[80%]"
                  : "bg-card text-card-foreground border border-border rounded-bl-none max-w-[95%] sm:max-w-full"
              }`}
            >
              {typeof msg.content === "string" ? (
                <p className="font-sans mb-2 leading-relaxed">{msg.content}</p>
              ) : (
                <div className="mb-2">{msg.content}</div>
              )}

              {msg.role === "assistant" && msg.recipes?.length > 0 && (
                <div className="mt-6">
                  {msg.recipes.map((recipe, index) => (
                    <div
                      key={recipe.id}
                      style={{
                        marginBottom:
                          index < msg.recipes.length - 1 ? "16px" : "0",
                        width: "100%",
                      }}
                      className="sm:inline-block sm:w-1/2 sm:align-top"
                    >
                      <div
                        style={{
                          margin: "0 8px 0 0",
                          padding: "4px",
                        }}
                      >
                        <RecipeCard
                          recipe={recipe}
                          userId={userId || null}
                          onSave={handleSaveRecipe}
                          onView={handleViewRecipe}
                          onNewMessage={(msg) =>
                            setMessages((prev) => [...prev, msg])
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Search input with proper spacing */}
      <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 bg-background/95 backdrop-blur-sm border-t border-border z-30">
        <div className="max-w-2xl mx-auto flex gap-2 sm:gap-3 px-2 sm:px-0">
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearch();
              }
            }}
            placeholder="Ask for a recipe..."
            className="flex-1 rounded-full border-border px-4 sm:px-6 py-2.5 sm:py-3 focus:ring-2 focus:ring-ring text-sm sm:text-base"
          />
          <Button
            onClick={handleSearch}
            className="rounded-full px-4 sm:px-6 py-2.5 sm:py-3 bg-primary hover:bg-primary/90 text-primary-foreground text-sm sm:text-base min-w-fit"
          >
            Search
          </Button>
        </div>
      </div>
    </div>
  );
}
