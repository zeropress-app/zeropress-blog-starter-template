import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TiptapEditor } from "@/components/TiptapEditor";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, History, RotateCcw } from "lucide-react";
import type { CreatePostRequest, UpdatePostRequest, Revision, ContentFormat } from "@/types/api";
import { format } from "date-fns";

const AdminPostEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [formData, setFormData] = useState<CreatePostRequest & { published?: boolean }>({
    title: "",
    content: "",
    contentFormat: "visual" as ContentFormat,
    summary: "",
    slug: "",
    published: false,
  });

  const [isRevisionsOpen, setIsRevisionsOpen] = useState(false);
  const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null);

  // Fetch post data if editing
  const { data: post, isLoading } = useQuery({
    queryKey: ["post", id],
    queryFn: () => api.getPost(Number(id)),
    enabled: isEditing,
  });

  // Fetch revisions if editing
  const { data: revisions, isLoading: isLoadingRevisions } = useQuery({
    queryKey: ["revisions", id],
    queryFn: () => api.getRevisions(Number(id)),
    enabled: isEditing,
  });

  // Populate form when editing
  useEffect(() => {
    if (post?.data) {
      setFormData({
        title: post.data.title,
        content: post.data.content,
        contentFormat: post.data.contentFormat || "visual",
        summary: post.data.summary || "",
        slug: post.data.slug,
        published: post.data.published,
      });
    }
  }, [post]);

  const createMutation = useMutation({
    mutationFn: (data: CreatePostRequest) => api.createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      toast({ title: "글이 생성되었습니다" });
      navigate("/admin/dashboard");
    },
    onError: (error) => {
      toast({
        title: "글 생성 실패",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdatePostRequest) => api.updatePost(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", id] });
      queryClient.invalidateQueries({ queryKey: ["revisions", id] });
      toast({ title: "글이 수정되었습니다" });
      navigate("/admin/dashboard");
    },
    onError: (error) => {
      toast({
        title: "글 수정 실패",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: ({ postId, revisionId }: { postId: number; revisionId: number }) => 
      api.restoreRevision(postId, revisionId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", id] });
      queryClient.invalidateQueries({ queryKey: ["revisions", id] });
      setSelectedRevision(null);
      setIsRevisionsOpen(false);
      toast({ title: "리비전이 복원되었습니다" });
    },
    onError: (error) => {
      toast({
        title: "리비전 복원 실패",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditing) {
      updateMutation.mutate(formData);
    } else {
      const { published, ...createData } = formData;
      createMutation.mutate(createData);
    }
  };

  if (isEditing && isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>글 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/dashboard")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            대시보드로 돌아가기
          </Button>

          {isEditing && (
            <Sheet open={isRevisionsOpen} onOpenChange={setIsRevisionsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <History className="h-4 w-4 mr-2" />
                  리비전 히스토리
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>리비전 히스토리</SheetTitle>
                  <SheetDescription>
                    이전 버전을 확인하고 복원할 수 있습니다
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-4">
                  {isLoadingRevisions && (
                    <p className="text-muted-foreground text-sm">리비전 불러오는 중...</p>
                  )}

                  {revisions && revisions.data.length === 0 && (
                    <p className="text-muted-foreground text-sm">저장된 리비전이 없습니다</p>
                  )}

                  {revisions?.data.map((revision) => (
                    <Card key={revision.id} className="cursor-pointer hover:border-primary" onClick={() => setSelectedRevision(revision)}>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium line-clamp-1">{revision.title}</h4>
                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                              {revision.revisionType}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(revision.createdAt), "yyyy-MM-dd HH:mm:ss")}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </header>

      {/* Revision Preview Dialog */}
      <Dialog open={!!selectedRevision} onOpenChange={(open) => !open && setSelectedRevision(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>리비전 미리보기</DialogTitle>
            <DialogDescription>
              {selectedRevision && format(new Date(selectedRevision.createdAt), "yyyy-MM-dd HH:mm:ss")}에 저장된 버전
            </DialogDescription>
          </DialogHeader>

          {selectedRevision && (
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-muted-foreground">제목</Label>
                <p className="font-medium mt-1">{selectedRevision.title}</p>
              </div>

              {selectedRevision.summary && (
                <div>
                  <Label className="text-muted-foreground">요약</Label>
                  <p className="text-sm mt-1">{selectedRevision.summary}</p>
                </div>
              )}

              <div>
                <Label className="text-muted-foreground">내용</Label>
                <div 
                  className="prose prose-sm max-w-none mt-2 p-4 border rounded-md bg-muted/30"
                  dangerouslySetInnerHTML={{ __html: selectedRevision.content }}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => {
                    if (selectedRevision) {
                      restoreMutation.mutate({
                        postId: selectedRevision.postId,
                        revisionId: selectedRevision.id,
                      });
                    }
                  }}
                  disabled={restoreMutation.isPending}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  이 버전으로 복원
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedRevision(null)}
                >
                  닫기
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? "글 수정" : "새 글 작성"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">제목</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="글 제목을 입력하세요"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">슬러그 (URL)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="my-blog-post"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">요약</Label>
                <Textarea
                  id="summary"
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  rows={3}
                  placeholder="글의 요약을 입력하세요"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contentFormat">콘텐츠 형식</Label>
                <Select
                  value={formData.contentFormat}
                  onValueChange={(value: ContentFormat) => setFormData({ ...formData, contentFormat: value })}
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
                <p className="text-sm text-muted-foreground">
                  {formData.contentFormat === "visual" && "리치 텍스트 에디터로 작성"}
                  {formData.contentFormat === "markdown" && "마크다운 문법으로 작성"}
                  {formData.contentFormat === "html" && "HTML 코드로 직접 작성"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">내용</Label>
                {formData.contentFormat === "visual" && (
                  <TiptapEditor
                    content={formData.content}
                    onChange={(content) => setFormData({ ...formData, content })}
                  />
                )}

                {formData.contentFormat === "markdown" && (
                  <MarkdownEditor
                    content={formData.content}
                    onChange={(content) => setFormData({ ...formData, content })}
                  />
                )}

                {formData.contentFormat === "html" && (
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="HTML 코드를 입력하세요..."
                    className="min-h-[500px] font-mono"
                  />
                )}
              </div>

              {isEditing && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="published"
                    checked={formData.published}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, published: checked })
                    }
                  />
                  <Label htmlFor="published">발행됨</Label>
                </div>
              )}

              <div className="flex gap-3">
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {isEditing ? "수정 완료" : "글 작성"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/dashboard")}
                >
                  취소
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminPostEditor;
