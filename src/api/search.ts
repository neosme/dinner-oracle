// api/search.ts
export async function searchRecipes(query: string, userId: string) {
  const sessionId = `session_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 10)}`;

  const body = {
    query,
    user_id: userId,
    session_id: sessionId,
    use_preferences: true,
    search_tiers: ["user", "web", "ai"],
  };

  const API_BASE_URL = process.env.VITE_API_BASE_URL;

  const response = await fetch(`${API_BASE_URL}/search/smart`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`);
  }

  return response.json();
}
