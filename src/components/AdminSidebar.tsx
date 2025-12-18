import { FileText, Activity, Database, MessageSquare, Settings, Menu, Palette, Layers } from "lucide-react";
import { NavLink } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "글목록", url: "/admin/dashboard", icon: FileText },
  { title: "페이지 관리", url: "/admin/pages", icon: Layers },
  { title: "댓글 관리", url: "/admin/comments", icon: MessageSquare },
  { title: "메뉴 관리", url: "/admin/menus", icon: Menu },
  { title: "테마 관리", url: "/admin/themes", icon: Palette },
  { title: "일반 설정", url: "/admin/options-general", icon: Settings },
  { title: "헬스체크", url: "/admin/health", icon: Activity },
  { title: "스키마 관리", url: "/admin/schema", icon: Database },
];

export function AdminSidebar() {
  const { open } = useSidebar();

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 backdrop-blur-sm">
      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink 
                      to={item.url} 
                      end
                      className={({ isActive }) =>
                        `transition-all duration-200 rounded-lg ${
                          isActive 
                            ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-md scale-105" 
                            : "hover:bg-muted/50 hover:scale-105"
                        }`
                      }
                    >
                      <item.icon className={`h-5 w-5 ${open ? "mr-3" : ""}`} />
                      {open && <span className="font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
