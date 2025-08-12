import { SearchBar } from '@/components/SearchBar';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Main content area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 max-w-2xl mx-auto w-full">
        <div className="text-center mb-8">
          <h1 className="sr-only">Recipe Recommender</h1>
          <div className="mb-6">
            <h2 className="text-4xl sm:text-5xl font-normal text-foreground mb-2">
              What's for Dinner?
            </h2>
          </div>
          
          <SearchBar />
        </div>
      </main>

      {/* Footer */}
      <footer className="hidden sm:flex justify-center gap-8 pb-8 text-sm text-muted-foreground">
        <a 
          href="/about" 
          className="hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded px-1 py-0.5"
        >
          About
        </a>
        <a 
          href="/privacy" 
          className="hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded px-1 py-0.5"
        >
          Privacy
        </a>
      </footer>
    </div>
  );
};

export default Index;
