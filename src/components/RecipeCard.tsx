import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock, Leaf, ChefHat } from "lucide-react";

export type RecipeCardProps = {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  time?: string | number;
  cuisine?: string;
  is_veg?: boolean;
  spice_level?: string;
  protein?: string;
  ingredients?: string[];
  instructions?: string[];
  notes?: string[];
};

// ✅ Message type so system bubbles work
export type Message = {
  role: "user" | "assistant" | "system";
  content: string;
  type?: string;
};

const API_URL = import.meta.env.VITE_API_BASE_URL;

const RecipeCard: React.FC<{
  recipe: RecipeCardProps;
  userId?: string | null;
  onSave?: (recipe: RecipeCardProps) => void;
  onView?: (recipe: RecipeCardProps) => void;
  onNewMessage?: (msg: Message) => void; // 👈 added callback from parent
}> = ({ recipe, userId, onSave, onView, onNewMessage }) => {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!userId) {
      alert("⚠️ Please log in to save recipes.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        user_id: userId,
        recipe_id: recipe.id,
        interaction_type: "saved",
        context: {
          session_id: `session_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 10)}`,
          timestamp: new Date().toISOString(),
        },
      };

      const response = await fetch(`${API_URL}/recipes/interact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("❌ Failed to save recipe!");
      }

      const data = await response.json();
      console.log("✅ API Response:", data);

      // ✅ Instead of setMessages, call the parent's callback
      onNewMessage?.({
        role: "assistant",
        content: "✅ Recipe saved to your favorites!",
        type: "system",
      });

      if (onSave) onSave(recipe);
    } catch (err) {
      console.error("Error saving recipe:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-muted text-muted-foreground p-4 border border-border shadow-sm w-full sm:w-[300px]">
      <h3 className="text-lg font-semibold mb-3 text-foreground font-serif">
        {recipe.title}
      </h3>

      <div className="flex flex-wrap items-center gap-4 text-sm mb-3">
        {recipe.time && (
          <div className="flex items-center gap-1 text-foreground">
            <Clock className="w-4 h-4 text-primary" />
            <span>{recipe.time}</span>
          </div>
        )}
        {recipe.cuisine && (
          <div className="flex items-center gap-1 text-foreground">
            <span className="w-2 h-2 bg-secondary rounded-full"></span>
            <span>{recipe.cuisine}</span>
          </div>
        )}
        {recipe.is_veg && (
          <div className="flex items-center gap-1 text-green-600">
            <Leaf className="w-4 h-4" />
            <span>Veg</span>
          </div>
        )}
        {recipe.spice_level && (
          <div className="flex items-center gap-1 text-primary">
            <ChefHat className="w-4 h-4" />
            <span>{recipe.spice_level}</span>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
        {recipe.description || "No description provided."}
      </p>

      <div className="flex gap-3">
        <Button
          onClick={() => onView?.(recipe)}
          variant="outline"
          size="sm"
          className="border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
        >
          View
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          variant="outline"
          size="sm"
          className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white bg-transparent disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </Card>
  );
};

export default RecipeCard;
