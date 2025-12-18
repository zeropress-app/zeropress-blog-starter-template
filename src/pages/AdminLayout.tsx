import { useState, useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { api, RateLimitError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useApiError } from "@/hooks/use-api-error";
import { RateLimitIndicator } from "@/components/RateLimitIndicator";
import { LogOut, Eye } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";

const AdminLayout = () => {
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { handleError } = useApiError();

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await api.checkAuth();
        setIsAuthChecking(false);
      } catch (error) {
        // Don't redirect on rate limit errors
        if (error instanceof RateLimitError) {
          setIsAuthChecking(false);
          handleError(error);
          return;
        }
        
        // Only redirect on actual auth errors
        handleError(error);
      }
    };
    
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    try {
      await api.logout();
      navigate("/admin/login");
      toast({ title: "로그아웃되었습니다" });
    } catch (error) {
      handleError(error, { 
        customMessage: "로그아웃에 실패했습니다.",
        skipAuthRedirect: true 
      });
    }
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>인증 확인 중...</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b border-border bg-card flex items-center px-4">
            <SidebarTrigger className="mr-4" />
            <h1 className="text-xl font-bold flex-1">Admin Dashboard</h1>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate("/")}>
                <Eye className="h-4 w-4 mr-2" />
                View Site
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-8">
            <RateLimitIndicator />
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
