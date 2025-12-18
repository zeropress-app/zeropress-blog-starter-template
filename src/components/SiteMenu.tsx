import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface MenuItem {
  id: number;
  menuId: number;
  parentId?: number;
  title: string;
  type: 'hyperlink' | 'post';
  url?: string;
  postId?: number;
  target: string;
  cssClasses?: string;
  sortOrder: number;
  children?: MenuItem[];
}

export const SiteMenu = ({ menuSlug = "main-menu" }: { menuSlug?: string }) => {
  const [openSubmenu, setOpenSubmenu] = useState<number | null>(null);

  const { data: menuData } = useQuery({
    queryKey: ["site-menu", menuSlug],
    queryFn: () => api.getMenuBySlug(menuSlug),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (!menuData?.data?.items || menuData.data.items.length === 0) {
    return null;
  }

  // Build menu tree structure
  const buildMenuTree = (items: MenuItem[]): MenuItem[] => {
    const itemMap = new Map<number, MenuItem>();
    const rootItems: MenuItem[] = [];

    // First pass: create map and initialize children array
    items.forEach(item => {
      itemMap.set(item.id, { ...item, children: [] });
    });

    // Second pass: build tree structure
    items.forEach(item => {
      const menuItem = itemMap.get(item.id)!;
      if (item.parentId) {
        const parent = itemMap.get(item.parentId);
        if (parent) {
          parent.children!.push(menuItem);
        }
      } else {
        rootItems.push(menuItem);
      }
    });

    // Sort by sortOrder
    const sortItems = (items: MenuItem[]) => {
      items.sort((a, b) => a.sortOrder - b.sortOrder);
      items.forEach(item => {
        if (item.children && item.children.length > 0) {
          sortItems(item.children);
        }
      });
    };

    sortItems(rootItems);
    return rootItems;
  };

  const menuTree = buildMenuTree(menuData.data.items);

  const getMenuItemUrl = (item: MenuItem): string => {
    if (item.type === 'hyperlink') {
      return item.url || '#';
    } else if (item.type === 'post' && item.postId) {
      return `/post/${item.postId}`;
    }
    return '#';
  };

  const renderMenuItem = (item: MenuItem, isSubmenu = false) => {
    const hasChildren = item.children && item.children.length > 0;
    const url = getMenuItemUrl(item);
    const isExternal = item.type === 'hyperlink' && item.url?.startsWith('http');
    const className = `${item.cssClasses || ''} ${isSubmenu ? 'block px-4 py-2 text-sm hover:bg-accent rounded-md transition-colors' : 'px-4 py-2 hover:text-primary transition-colors'}`;

    if (hasChildren) {
      return (
        <div
          key={item.id}
          className="relative group"
          onMouseEnter={() => setOpenSubmenu(item.id)}
          onMouseLeave={() => setOpenSubmenu(null)}
        >
          <button className={`flex items-center gap-1 ${className}`}>
            {item.title}
            <ChevronDown className="h-4 w-4" />
          </button>
          
          {/* Submenu */}
          <div className={`absolute left-0 top-full mt-1 min-w-[200px] bg-card border rounded-lg shadow-lg py-2 z-50 transition-opacity ${openSubmenu === item.id ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
            {item.children!.map(child => renderMenuItem(child, true))}
          </div>
        </div>
      );
    }

    if (isExternal) {
      return (
        <a
          key={item.id}
          href={url}
          target={item.target}
          rel={item.target === '_blank' ? 'noopener noreferrer' : undefined}
          className={className}
        >
          {item.title}
        </a>
      );
    }

    return (
      <Link
        key={item.id}
        to={url}
        className={className}
      >
        {item.title}
      </Link>
    );
  };

  return (
    <nav className="border-b bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-2 h-12 text-sm font-medium">
          {menuTree.map(item => renderMenuItem(item))}
        </div>
      </div>
    </nav>
  );
};
