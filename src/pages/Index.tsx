import { SearchBar } from '@/components/SearchBar';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
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
    </div>
  );
};

export default Index;
