// Mock API endpoint for search functionality
export const searchRecipes = async (query: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock response
  return {
    ok: true,
    query,
    results: [
      {
        id: 1,
        title: `Recipe suggestions for: ${query}`,
        description: 'Mock recipe results would appear here'
      }
    ]
  };
};