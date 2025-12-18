import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api, RateLimitError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useApiError } from "@/hooks/use-api-error";
import { RateLimitIndicator } from "@/components/RateLimitIndicator";
import { Plus, Edit, Trash2, LogOut, Eye } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";

const AdminDashboard = () => {
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { handleError } = useApiError();
  const queryClient = useQueryClient();

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

  const { data: posts, isLoading } = useQuery({
    queryKey: ["admin-posts"],
    queryFn: () => api.getPosts(1, 100, false),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      toast({ title: "글이 삭제되었습니다" });
    },
    onError: (error) => {
      handleError(error, { customMessage: "글 삭제에 실패했습니다." });
    },
  });

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
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-muted/20">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-16 admin-header sticky top-0 z-10 flex items-center px-6 gap-4">
            <SidebarTrigger className="mr-2" />
            <h1 className="text-2xl font-bold flex-1 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate("/")} className="transition-all hover:scale-105">
                <Eye className="h-4 w-4 mr-2" />
                View Site
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="transition-all hover:scale-105">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-8">
            <div className="max-w-7xl mx-auto space-y-8">
              <RateLimitIndicator />
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-4xl font-bold mb-2 text-foreground">Posts</h2>
                  <p className="text-muted-foreground">Manage your blog posts and content</p>
                </div>
                
                <Button 
                  className="admin-button-gradient shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  onClick={() => navigate("/admin/post/new")}
                  size="lg"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  새 글 작성
                </Button>
              </div>

              <div className="grid gap-6">
                {isLoading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                )}
                
                {posts?.data.map((post) => (
                  <Card key={post.id} className="admin-card admin-card-hover overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3">
                            <CardTitle className="text-xl truncate">{post.title}</CardTitle>
                            <Badge 
                              variant={post.published ? "default" : "secondary"}
                              className="shrink-0"
                            >
                              {post.published ? "Published" : "Draft"}
                            </Badge>
                          </div>
                          <CardDescription className="text-base line-clamp-2">
                            {post.summary || post.content.substring(0, 150) + "..."}
                          </CardDescription>
                        </div>
                        
                        <div className="flex gap-2 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/post/edit/${post.id}`)}
                            className="hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm("정말로 이 글을 삭제하시겠습니까?")) {
                                deleteMutation.mutate(post.id);
                              }
                            }}
                            className="hover:bg-destructive/10 hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
                
                {!isLoading && posts?.data.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="text-lg">No posts yet. Create your first post!</p>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
