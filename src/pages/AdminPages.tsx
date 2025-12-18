import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useApiError } from "@/hooks/use-api-error";
import { RateLimitIndicator } from "@/components/RateLimitIndicator";
import { Plus, Edit, Trash2, FileText, Layers } from "lucide-react";

const AdminPages = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { handleError } = useApiError();
  const queryClient = useQueryClient();

  const { data: pages, isLoading } = useQuery({
    queryKey: ["admin-pages"],
    queryFn: () => api.getPosts(1, 100, false, 'page'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pages"] });
      toast({ title: "페이지가 삭제되었습니다" });
    },
    onError: (error) => {
      handleError(error, { customMessage: "페이지 삭제에 실패했습니다." });
    },
  });

  // Group pages by parent
  const groupedPages = pages?.data.reduce((acc, page) => {
    const parentId = page.parentId || 0;
    if (!acc[parentId]) {
      acc[parentId] = [];
    }
    acc[parentId].push(page);
    return acc;
  }, {} as Record<number, typeof pages.data>) || {};

  // Sort pages by menu order
  Object.keys(groupedPages).forEach(key => {
    groupedPages[Number(key)].sort((a, b) => a.menuOrder - b.menuOrder);
  });

  const renderPage = (page: typeof pages.data[0], level = 0) => {
    const children = groupedPages[page.id] || [];
    
    return (
      <div key={page.id}>
        <Card className="admin-card admin-card-hover overflow-hidden mb-4" style={{ marginLeft: `${level * 2}rem` }}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  {level > 0 && <Layers className="h-4 w-4 text-muted-foreground" />}
                  <CardTitle className="text-xl truncate">{page.title}</CardTitle>
                  <Badge variant={page.published ? "default" : "secondary"} className="shrink-0">
                    {page.published ? "Published" : "Draft"}
                  </Badge>
                  {children.length > 0 && (
                    <Badge variant="outline" className="shrink-0">
                      {children.length} 하위 페이지
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-base line-clamp-2">
                  {page.summary || page.content.substring(0, 150) + "..."}
                </CardDescription>
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  <span>/{page.slug}</span>
                  {page.menuOrder > 0 && (
                    <>
                      <span>•</span>
                      <span>순서: {page.menuOrder}</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/admin/page/edit/${page.id}`)}
                  className="hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (children.length > 0) {
                      toast({
                        title: "삭제 불가",
                        description: "하위 페이지가 있는 페이지는 삭제할 수 없습니다.",
                        variant: "destructive",
                      });
                      return;
                    }
                    if (confirm("정말로 이 페이지를 삭제하시겠습니까?")) {
                      deleteMutation.mutate(page.id);
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
        
        {/* Render children */}
        {children.map(child => renderPage(child, level + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">페이지 관리</h1>
        <p className="text-muted-foreground mt-2">
          정적 페이지를 관리합니다 (About, Contact 등)
        </p>
      </div>

      <RateLimitIndicator />

      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          총 {pages?.data.length || 0}개의 페이지
        </div>
        <Button 
          className="admin-button-gradient shadow-lg hover:shadow-xl transition-all hover:scale-105"
          onClick={() => navigate("/admin/page/new")}
        >
          <Plus className="h-5 w-5 mr-2" />
          새 페이지 작성
        </Button>
      </div>

      <div>
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
        
        {!isLoading && pages?.data.length === 0 && (
          <Card>
            <CardHeader className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <CardTitle>페이지가 없습니다</CardTitle>
              <CardDescription className="mt-2">
                첫 번째 페이지를 만들어보세요!
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {!isLoading && pages?.data && (
          <div>
            {/* Render top-level pages (no parent) */}
            {(groupedPages[0] || []).map(page => renderPage(page, 0))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPages;
