import { Logo } from "@/views/atoms";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { toast } from "sonner";

interface HeaderProps {
  className?: string;
}

export const Header = ({ className = "" }: HeaderProps) => {
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Signed out successfully", {
        description: "You have been logged out. See you next time!",
      });
    } catch {
      toast.error("Error signing out");
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border shadow-sm ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          <div className="flex-shrink-0">
            <Logo />
          </div>

          <div className="flex items-center space-x-4">
            <ThemeToggle />

            {isAuthenticated && (
              <>
                <span className="text-sm text-textSecondary hidden sm:block">
                  Welcome, {user?.username}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="text-destructive border-destructive/20 hover:bg-destructive/10 hover:border-destructive/30"
                >
                  Sign Out
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
