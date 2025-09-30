import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/views/components";

export const TasksContainer = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-surface overflow-hidden">
        <div className="w-full px-4 py-4 flex justify-between items-center gap-2">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-primary truncate min-w-0">
            Tasks Management
          </h1>
          <div className="flex items-center gap-2 flex-shrink-0">
            <ThemeToggle />
            <span className="text-textSecondary hidden lg:inline text-sm truncate">
              Welcome, {user?.username}
            </span>
            <Button
              onClick={logout}
              variant="outline"
              size="sm"
              className="whitespace-nowrap"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Tasks</h1>
        <p className="text-textSecondary">Tasks management coming soon...</p>
      </main>
    </div>
  );
};
