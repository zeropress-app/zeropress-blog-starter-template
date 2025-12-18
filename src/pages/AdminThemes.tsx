import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, Eye } from "lucide-react";
import { getAvailableThemes } from "@/themes/registry";

const AdminThemes = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);

  const availableThemes = getAvailableThemes();

  // Get current active theme from settings
  const { data: settingsData } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => api.getSiteSettings(),
  });

  const activeTheme = (settingsData?.data as any)?.active_theme || 'default';

  // Update theme mutation
  const updateThemeMutation = useMutation({
    mutationFn: (themeId: string) => 
      api.updateSiteSettings({ active_theme: themeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings"] }); // 공용 설정 캐시도 무효화
      toast({ 
        title: "테마가 변경되었습니다",
        description: "새로고침하여 변경사항을 확인하세요" 
      });
    },
    onError: (error: any) => {
      toast({
        title: "테마 변경 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleActivateTheme = (themeId: string) => {
    if (confirm(`"${themeId}" 테마를 활성화하시겠습니까?`)) {
      updateThemeMutation.mutate(themeId);
    }
  };

  const handlePreview = (themeId: string) => {
    // Open preview in new window
    const previewUrl = `${window.location.origin}?preview_theme=${themeId}`;
    window.open(previewUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">테마 관리</h2>
          <p className="text-muted-foreground mt-2">
            블로그의 외관을 변경할 테마를 선택하세요
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableThemes.map((theme) => {
          const isActive = theme.id === activeTheme;
          
          return (
            <Card key={theme.id} className={isActive ? "border-primary shadow-lg" : ""}>
              <CardHeader>
                <div className="aspect-video bg-muted rounded-lg mb-4 overflow-hidden">
                  {theme.screenshot ? (
                    <img 
                      src={theme.screenshot} 
                      alt={theme.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      No Preview
                    </div>
                  )}
                </div>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {theme.name}
                      {isActive && (
                        <Badge variant="default" className="gap-1">
                          <Check className="h-3 w-3" />
                          활성
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      v{theme.version} by {theme.author}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {theme.description}
                </p>
                <div className="flex gap-2">
                  {!isActive && (
                    <Button
                      onClick={() => handleActivateTheme(theme.id)}
                      disabled={updateThemeMutation.isPending}
                      className="flex-1"
                    >
                      활성화
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => handlePreview(theme.id)}
                    className={isActive ? "flex-1" : ""}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    미리보기
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {availableThemes.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              사용 가능한 테마가 없습니다
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminThemes;
