import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TiptapEditor } from "@/components/TiptapEditor";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useApiError } from "@/hooks/use-api-error";
import { RateLimitIndicator } from "@/components/RateLimitIndicator";
import { ArrowLeft, FileText } from "lucide-react";
import type { CreatePostRequest, UpdatePostRequest, ContentFormat } from "@/types/api";

const AdminPageEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { handleError } = useApiError();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [formData, setFormData] = useState<CreatePostRequest & { published?: boolean }>({
    title: "",
    content: "",
    contentFormat: "visual" as ContentFormat,
    summary: "",
    slug: "",
    postType: "page",
    parentId: undefined,
    menuOrder: 0,
    pageTemplate: "default",
    published: false,
  });

  // Fetch page data if editing
  const { data: page, isLoading } = useQuery({
    queryKey: ["page", id],
    queryFn: () => api.getPost(Number(id)),
    enabled: isEditing,
  });

  // Fetch all pages for parent selection
  const { data: allPages } = useQuery({
    queryKey: ["admin-pages-all"],
    queryFn: () => api.getPosts(1, 100, false, 'page'),
  });

  // Populate form when editing
  useEffect(() => {
    if (page?.data) {
      setFormData({
        title: page.data.title,
        content: page.data.content,
        contentFormat: page.data.contentFormat || "visual",
        summary: page.data.summary || "",
        slug: page.data.slug,
        postType: "page",
        parentId: page.data.parentId,
        menuOrder: page.data.menuOrder || 0,
        pageTemplate: page.data.pageTemplate || "default",
        published: page.data.published,
      });
    }
  }, [page]);

  const createMutation = useMutation({
    mutationFn: (data: CreatePostRequest) => api.createPage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pages"] });
      toast({ title: "페이지가 생성되었습니다" });
      navigate("/admin/pages");
    },
    onError: (error) => {
      handleError(error, { customMessage: "페이지 생성에 실패했습니다." });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdatePostRequest) => api.updatePage(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pages"] });
      queryClient.invalidateQueries({ queryKey: ["page", id] });
      toast({ title: "페이지가 수정되었습니다" });
      navigate("/admin/pages");
    },
    onError: (error) => {
      handleError(error, { customMessage: "페이지 수정에 실패했습니다." });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast({
        title: "제목을 입력하세요",
        variant: "destructive",
      });
      return;
    }

    if (!formData.content.trim()) {
      toast({
        title: "내용을 입력하세요",
        variant: "destructive",
      });
      return;
    }

    const submitData = {
      ...formData,
      postType: "page" as const,
      parentId: formData.parentId || undefined,
    };

    if (isEditing) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  // Auto-generate slug from title
  const handleTitleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      title: value,
      slug: prev.slug || value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    }));
  };

  // Filter out current page and its descendants from parent options
  const availableParents = allPages?.data.filter(p => {
    if (!isEditing) return true;
    return p.id !== Number(id) && p.parentId !== Number(id);
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin/pages")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          페이지 목록
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEditing ? "페이지 수정" : "새 페이지 작성"}
          </h1>
        </div>
      </div>

      <RateLimitIndicator />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>페이지 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="페이지 제목을 입력하세요"
                required
              />
            </div>

            <div>
              <Label htmlFor="slug">슬러그 (URL)</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="page-url-slug"
              />
              <p className="text-sm text-muted-foreground mt-1">
                URL: /{formData.slug || 'page-url-slug'}
              </p>
            </div>

            <div>
              <Label htmlFor="summary">요약</Label>
              <Input
                id="summary"
                value={formData.summary}
                onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                placeholder="페이지 요약 (선택사항)"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>페이지 설정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="parent">부모 페이지</Label>
              <Select
                value={formData.parentId?.toString() || "none"}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  parentId: value === "none" ? undefined : Number(value) 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="부모 페이지 선택 (선택사항)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">없음 (최상위 페이지)</SelectItem>
                  {availableParents.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="menuOrder">메뉴 순서</Label>
              <Input
                id="menuOrder"
                type="number"
                value={formData.menuOrder}
                onChange={(e) => setFormData(prev => ({ ...prev, menuOrder: Number(e.target.value) }))}
                placeholder="0"
                min="0"
              />
              <p className="text-sm text-muted-foreground mt-1">
                숫자가 작을수록 먼저 표시됩니다
              </p>
            </div>

            <div>
              <Label htmlFor="template">페이지 템플릿</Label>
              <Select
                value={formData.pageTemplate}
                onValueChange={(value) => setFormData(prev => ({ ...prev, pageTemplate: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">기본 템플릿</SelectItem>
                  <SelectItem value="full-width">전체 너비</SelectItem>
                  <SelectItem value="sidebar">사이드바 포함</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="published">발행 상태</Label>
                <p className="text-sm text-muted-foreground">
                  발행하면 공개적으로 표시됩니다
                </p>
              </div>
              <Switch
                id="published"
                checked={formData.published}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, published: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>페이지 내용 *</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="contentFormat">콘텐츠 형식</Label>
              <Select
                value={formData.contentFormat}
                onValueChange={(value: ContentFormat) => setFormData(prev => ({ ...prev, contentFormat: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visual">비주얼 에디터 (Tiptap)</SelectItem>
                  <SelectItem value="markdown">마크다운</SelectItem>
                  <SelectItem value="html">HTML</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                {formData.contentFormat === "visual" && "리치 텍스트 에디터로 작성"}
                {formData.contentFormat === "markdown" && "마크다운 문법으로 작성"}
                {formData.contentFormat === "html" && "HTML 코드로 직접 작성"}
              </p>
            </div>

            {formData.contentFormat === "visual" && (
              <TiptapEditor
                content={formData.content}
                onChange={(content) => setFormData(prev => ({ ...prev, content }))}
              />
            )}

            {formData.contentFormat === "markdown" && (
              <MarkdownEditor
                content={formData.content}
                onChange={(content) => setFormData(prev => ({ ...prev, content }))}
              />
            )}

            {formData.contentFormat === "html" && (
              <div>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="HTML 코드를 입력하세요..."
                  className="min-h-[500px] font-mono"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/admin/pages")}
          >
            취소
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="admin-button-gradient"
          >
            {createMutation.isPending || updateMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                저장 중...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                {isEditing ? "페이지 수정" : "페이지 생성"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminPageEditor;
