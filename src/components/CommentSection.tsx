import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, RateLimitError } from "@/lib/api";
import { CommentForm } from "./CommentForm";
import { CommentItem } from "./CommentItem";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, AlertCircle, Loader2, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { RateLimitIndicator } from "./RateLimitIndicator";
import type { Comment } from "@/types/api";

interface CommentSectionProps {
  postId: number;
}

export function CommentSection({ postId }: CommentSectionProps) {
  const [showCommentForm, setShowCommentForm] = useState(false);
  const queryClient = useQueryClient();

  // Fetch comments
  const { 
    data: commentsData, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => api.getComments(postId, 1, 50, true), // tree=true for nested structure
    enabled: !!postId,
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: (data: {
      postId: number;
      authorName: string;
      authorEmail: string;
      authorWebsite?: string;
      content: string;
      parentId?: number;
    }) => api.createComment(data),
    onSuccess: () => {
      // Refetch comments
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      
      toast({
        title: "댓글이 제출되었습니다",
        description: "관리자 승인 후 게시됩니다.",
      });
      
      setShowCommentForm(false);
    },
    onError: (error: any) => {
      if (error instanceof RateLimitError) {
        toast({
          title: "⏱️ 요청 제한",
          description: `요청이 너무 많습니다. ${error.retryAfter}초 후에 다시 시도해주세요.`,
          variant: "destructive",
          duration: 5000,
        });
      } else {
        toast({
          title: "댓글 작성 실패",
          description: error.message || "댓글 작성 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    },
  });

  const handleCommentSubmit = async (data: any) => {
    await createCommentMutation.mutateAsync(data);
  };

  const comments = commentsData?.data || [];
  const totalComments = commentsData?.total || 0;

  return (
    <section className="space-y-8">
      {/* Rate Limit Indicator */}
      <RateLimitIndicator />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
            <MessageSquare className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">댓글</h2>
            <p className="text-sm text-muted-foreground">{totalComments}개의 댓글</p>
          </div>
        </div>
        
        {!showCommentForm && (
          <Button 
            onClick={() => setShowCommentForm(true)}
            className="shadow-md hover:shadow-lg transition-shadow"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            댓글 작성
          </Button>
        )}
      </div>

      {/* Comment Form */}
      {showCommentForm && (
        <div className="animate-fade-in">
          <CommentForm
            postId={postId}
            onSubmit={handleCommentSubmit}
            onCancel={() => setShowCommentForm(false)}
            isSubmitting={createCommentMutation.isPending}
          />
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {isLoading && (
          <div className="flex items-center justify-center py-12 bg-muted/30 rounded-xl">
            <Loader2 className="h-6 w-6 animate-spin mr-3 text-primary" />
            <span className="text-muted-foreground">댓글을 불러오는 중...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-12 bg-destructive/5 rounded-xl border border-destructive/20">
            {error instanceof RateLimitError ? (
              <>
                <Clock className="h-5 w-5 mr-3 text-orange-600" />
                <span className="text-orange-800 dark:text-orange-200">
                  요청 제한이 적용되었습니다. {error.retryAfter}초 후에 다시 시도해주세요.
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 mr-3 text-destructive" />
                <span className="text-destructive">댓글을 불러오는데 실패했습니다.</span>
              </>
            )}
          </div>
        )}

        {!isLoading && !error && comments.length === 0 && (
          <div className="text-center py-16 bg-gradient-to-b from-muted/30 to-muted/10 rounded-xl border border-dashed">
            <div className="p-4 rounded-full bg-muted/50 w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <p className="text-lg font-medium mb-1">아직 댓글이 없습니다</p>
            <p className="text-sm text-muted-foreground">첫 번째 댓글을 작성해보세요!</p>
          </div>
        )}

        {!isLoading && !error && comments.length > 0 && (
          <div className="space-y-4">
            {comments.map((comment: Comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onReply={handleCommentSubmit}
                isSubmitting={createCommentMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* Guidelines */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 rounded-2xl p-8 border-2 shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary" />
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 shadow-md">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              댓글 작성 가이드라인
            </h3>
          </div>
          
          <div className="grid gap-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-colors">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mt-0.5">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <span className="text-sm text-muted-foreground leading-relaxed">
                모든 댓글은 관리자 승인 후 게시됩니다.
              </span>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-colors">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mt-0.5">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <span className="text-sm text-muted-foreground leading-relaxed">
                스팸, 광고, 욕설 등 부적절한 내용은 삭제될 수 있습니다.
              </span>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-colors">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mt-0.5">
                <span className="text-xs font-bold text-primary">3</span>
              </div>
              <span className="text-sm text-muted-foreground leading-relaxed">
                다른 사용자를 존중하는 건설적인 댓글을 작성해주세요.
              </span>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-colors">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mt-0.5">
                <span className="text-xs font-bold text-primary">4</span>
              </div>
              <span className="text-sm text-muted-foreground leading-relaxed">
                개인정보는 댓글에 포함하지 마세요.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}