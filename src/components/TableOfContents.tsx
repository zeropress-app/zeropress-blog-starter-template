import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { List } from "lucide-react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

export const TableOfContents = ({ content }: TableOfContentsProps) => {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Parse HTML content to extract headings
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/html");
    const headings = doc.querySelectorAll("h2, h3, h4");
    
    const items: TocItem[] = [];
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName[1]);
      const text = heading.textContent || "";
      const id = heading.id || `heading-${index}`;
      
      // Add ID to heading if it doesn't have one
      if (!heading.id) {
        heading.id = id;
      }
      
      items.push({ id, text, level });
    });
    
    setTocItems(items);

    // Update the actual DOM with IDs
    const contentElement = document.querySelector(".prose");
    if (contentElement) {
      const actualHeadings = contentElement.querySelectorAll("h2, h3, h4");
      actualHeadings.forEach((heading, index) => {
        if (!heading.id) {
          heading.id = `heading-${index}`;
        }
      });
    }
  }, [content]);

  useEffect(() => {
    if (tocItems.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-80px 0px -80% 0px",
        threshold: 0.1,
      }
    );

    tocItems.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [tocItems]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  if (tocItems.length === 0) {
    return null;
  }

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="lg:hidden fixed bottom-20 right-4 z-40 w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform border-2 border-background"
      >
        <List className="h-5 w-5" />
      </button>

      {/* TOC Sidebar */}
      <aside
        className={cn(
          "fixed top-24 right-4 w-64 max-h-[calc(100vh-8rem)] overflow-y-auto z-30 transition-all duration-300",
          "bg-card/95 backdrop-blur-sm border rounded-xl shadow-xl p-4",
          "lg:block",
          isVisible ? "block" : "hidden"
        )}
      >
        <div className="flex items-center gap-2 mb-4 pb-3 border-b">
          <List className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">목차</h3>
        </div>

        <nav className="space-y-1">
          {tocItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToHeading(item.id)}
              className={cn(
                "block w-full text-left text-sm py-2 px-3 rounded-md transition-all hover:bg-muted",
                activeId === item.id
                  ? "text-primary font-medium bg-primary/10 border-l-2 border-primary"
                  : "text-muted-foreground hover:text-foreground",
                item.level === 3 && "pl-6",
                item.level === 4 && "pl-9"
              )}
              style={{
                paddingLeft: item.level === 2 ? "0.75rem" : `${(item.level - 2) * 1.5 + 0.75}rem`,
              }}
            >
              {item.text}
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile Backdrop */}
      {isVisible && (
        <div
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-20"
          onClick={() => setIsVisible(false)}
        />
      )}
    </>
  );
};
