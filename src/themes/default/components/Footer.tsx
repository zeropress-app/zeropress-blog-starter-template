import { useSiteSettings } from "@/contexts/SiteSettingsContext";

const Footer = () => {
  const { settings } = useSiteSettings();

  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container mx-auto px-4 py-6">
        <p className="text-center text-sm text-muted-foreground">
          Copyright © {settings.site_title}. Powered by{" "}
          <a 
            href="https://zeropress.app" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-semibold text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
          >
            ZeroPress
          </a>
          . ✉️ hello@zeropress.org
        </p>
      </div>
    </footer>
  );
};

export { Footer };
