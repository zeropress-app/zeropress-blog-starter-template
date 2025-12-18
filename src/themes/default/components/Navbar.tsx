import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

export const Navbar = () => {
  const { theme, setTheme } = useTheme();
  const { settings } = useSiteSettings();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl hover:text-primary transition-colors">
          <BookOpen className="h-6 w-6 text-primary" />
          <span>{settings.site_title}</span>
        </Link>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={toggleTheme}>
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">테마 전환</span>
          </Button>
          
          <Link to="/admin/login">
            <Button variant="ghost" size="sm">
              Admin
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};
