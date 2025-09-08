// src/pages/SavedRecipesPage.tsx
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/supabaseClient";
import { useNavigate } from "react-router-dom";

type SavedRecipe = {
  id: string;
  title: string;
  total_time_minutes: number;
  is_veg: boolean;
  cuisine: string;
  meal_types?: string;
  notes?: string;
  ingredients?: string[];
  instructions?: string[];
  interaction_id?: string;
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || process.env.REACT_APP_API_BASE_URL;

const SavedRecipesPage = () => {
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<SavedRecipe | null>(
    null
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchRecipes = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;

    try {
      const response = await fetch(`${API_BASE_URL}/users/saved-recipes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ user_id: user.id, limit: 50, offset: 0 }),
      });

      const data = await response.json();
      setRecipes(data.recipes || []);
    } catch (err) {
      console.error("Error fetching recipes", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const response = await fetch(
        `${API_BASE_URL}/users/saved-recipes/delete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({ id }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete recipe");
      }

      // ✅ Re-fetch from backend instead of just optimistic update
      await fetchRecipes();
    } catch (err) {
      console.error("Error deleting recipe:", err);
    } finally {
      setDeletingId(null);
    }
  };
  return (
    <div className="p-8 flex flex-col items-center">
      <div className="w-full max-w-6xl flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <Button
          onClick={() => navigate("/")}
          className="bg-orange-500 hover:bg-orange-600 text-white w-fit"
        >
          ⬅ Back to Chat
        </Button>

        <h1 className="text-primary font-bold text-2xl md:text-4xl text-center flex-1">
          Saved Recipes
        </h1>

        {/* Empty spacer to keep center alignment in desktop view */}
        <div className="hidden sm:block w-[110px]" />
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : recipes.length === 0 ? (
        <p>No saved recipes yet.</p>
      ) : (
        <div className="w-full max-w-6xl flex justify-center">
          <div className="w-full border-2 border-gray-300 rounded-lg shadow-md bg-card text-card-foreground">
            <Table className="table-auto w-full  text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead className="px-3 text-lg py-2">Name</TableHead>
                  <TableHead className="px-3 text-lg py-2">Time</TableHead>
                  <TableHead className="px-3 text-lg py-2">Is Veg</TableHead>
                  <TableHead className="px-3 text-lg py-2">Cuisine</TableHead>
                  <TableHead className="px-3 text-lg py-2 text-center">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipes.map((r) => (
                  <TableRow key={r.id} className="hover:bg-muted/30">
                    <TableCell className="px-3 py-2 font-medium">
                      {r.title}
                    </TableCell>
                    <TableCell className="px-3 py-2">
                      {r.total_time_minutes}m
                    </TableCell>
                    <TableCell className="px-3 py-2">
                      {r.is_veg ? "Yes" : "No"}
                    </TableCell>
                    <TableCell className="px-3 py-2 capitalize">
                      {r.cuisine}
                    </TableCell>
                    <TableCell className="px-3 py-2 flex justify-center gap-2">
                      <Button size="sm" onClick={() => setSelectedRecipe(r)}>
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={deletingId === r.id}
                        onClick={() => handleDelete(r.interaction_id)}
                      >
                        {deletingId === r.id ? "Deleting..." : "Delete"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* View Recipe Dialog */}
      {selectedRecipe && (
        <Dialog
          open={!!selectedRecipe}
          onOpenChange={() => setSelectedRecipe(null)}
        >
          <DialogContent className="w-[90vw] max-w-4xl max-h-[85vh] bg-card text-card-foreground overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-orange-700">
                {selectedRecipe.title}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {selectedRecipe.cuisine && (
                  <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                    {selectedRecipe.cuisine}
                  </span>
                )}
                {selectedRecipe.is_veg && (
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    Vegetarian
                  </span>
                )}
                {selectedRecipe.meal_types && (
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm capitalize">
                    {selectedRecipe.meal_types}
                  </span>
                )}
              </div>

              {/* Meta Info with icons */}
              <div className="flex flex-wrap gap-6 text-gray-700">
                <div className="flex items-center gap-2">
                  <span role="img" aria-label="prep">
                    ⏱️
                  </span>
                  <span>
                    <strong>Prep:</strong>{" "}
                    {Math.floor(selectedRecipe.total_time_minutes / 2)}m
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span role="img" aria-label="cook">
                    🍳
                  </span>
                  <span>
                    <strong>Cook:</strong>{" "}
                    {Math.ceil(selectedRecipe.total_time_minutes / 2)}m
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span role="img" aria-label="serves">
                    👥
                  </span>
                  <span>
                    <strong>Serves:</strong> 4
                  </span>
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Ingredients
                </h3>
                <ul className="list-disc pl-6 space-y-1">
                  {selectedRecipe.ingredients?.length ? (
                    selectedRecipe.ingredients.map((ing, i) => (
                      <li key={i}>{ing}</li>
                    ))
                  ) : (
                    <li>No ingredients provided</li>
                  )}
                </ul>
              </div>

              {/* Instructions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Instructions
                </h3>
                {selectedRecipe.instructions?.length ? (
                  <ol className="list-decimal pl-6 space-y-2">
                    {selectedRecipe.instructions.map((step, i) => (
                      <li key={i} className="text-gray-700 leading-relaxed">
                        {step}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-gray-700">No instructions provided</p>
                )}
              </div>

              {/* Notes */}
              {selectedRecipe.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Notes
                  </h3>
                  <p className="text-gray-700">{selectedRecipe.notes}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default SavedRecipesPage;
