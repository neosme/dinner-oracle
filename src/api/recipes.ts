// src/api/recipes.ts
const API_URL = import.meta.env.VITE_API_URL as string;

// --- Types ---
export interface Recipe {
  id: number;
  title: string;
  ingredients: string[];
  instructions: string;
}

export interface Recommendation {
  id: number;
  recipeId: number;
  score: number;
}

// --- API Functions ---

// Fetch all recipes
export async function fetchRecipes(): Promise<Recipe[]> {
  const res = await fetch(`${API_URL}/recipes`);
  if (!res.ok) throw new Error("Failed to fetch recipes");
  return res.json();
}

// Get AI recommendations for a user
export async function getRecommendations(
  userId: string
): Promise<Recommendation[]> {
  const res = await fetch(`${API_URL}/recommendations/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch recommendations");
  return res.json();
}

// Add a new recipe
export async function addRecipe(recipe: Omit<Recipe, "id">): Promise<Recipe> {
  const res = await fetch(`${API_URL}/recipes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(recipe),
  });
  if (!res.ok) throw new Error("Failed to add recipe");
  return res.json();
}
