import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, X } from "lucide-react";
import type { Comment } from "@/types/api";

interface CommentFormProps {
  postId: number;
  parentComment?: Comment;
  onSubmit: (data: {
    postId: number;
    authorName: string;
    authorEmail: string;
    authorWebsite?: string;
    content: string;
    parentId?: number;
  }) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function CommentForm({ 
  postId, 
  parentComment, 
  onSubmit, 
  onCancel, 
  isSubmitting = false 
}: CommentFormProps) {
  const [formData, setFormData] = useState({
    authorName: '',
    authorEmail: '',
    authorWebsite: '',
    content: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.authorName.trim()) {
      newErrors.authorName = '이름을 입력해주세요.';
    }

    if (!formData.authorEmail.trim()) {
      newErrors.authorEmail = '이메일을 입력해주세요.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.authorEmail)) {
      newErrors.authorEmail = '올바른 이메일 형식을 입력해주세요.';
    }

    if (!formData.content.trim()) {
      newErrors.content = '댓글 내용을 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        postId,
        authorName: formData.authorName.trim(),
        authorEmail: formData.authorEmail.trim(),
        authorWebsite: formData.authorWebsite.trim() || undefined,
        content: formData.content.trim(),
        parentId: parentComment?.id,
      });

      // Reset form on success
      setFormData({
        authorName: '',
        authorEmail: '',
        authorWebsite: '',
        content: ''
      });
      setErrors({});
    } catch (error) {
      console.error('Comment submission error:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Card className="relative overflow-hidden border-2 shadow-xl">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary" />
      <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-accent/5 rounded-full blur-3xl -z-10" />
      
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 shadow-md">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {parentComment ? `${parentComment.authorName}님에게 답글` : '댓글 작성'}
            </span>
          </div>
          {onCancel && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onCancel}
              className="hover:bg-destructive/10 hover:text-destructive transition-colors rounded-lg"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="authorName" className="text-sm font-semibold flex items-center gap-1.5">
                이름 
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="authorName"
                value={formData.authorName}
                onChange={(e) => handleInputChange('authorName', e.target.value)}
                placeholder="홍길동"
                className={`transition-all ${errors.authorName ? 'border-destructive shadow-sm shadow-destructive/20' : 'focus:shadow-md focus:shadow-primary/10'}`}
              />
              {errors.authorName && (
                <p className="text-sm text-destructive flex items-center gap-1.5 animate-fade-in">
                  <span className="w-1 h-1 rounded-full bg-destructive" />
                  {errors.authorName}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="authorEmail" className="text-sm font-semibold flex items-center gap-1.5">
                이메일 
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="authorEmail"
                type="email"
                value={formData.authorEmail}
                onChange={(e) => handleInputChange('authorEmail', e.target.value)}
                placeholder="hong@example.com"
                className={`transition-all ${errors.authorEmail ? 'border-destructive shadow-sm shadow-destructive/20' : 'focus:shadow-md focus:shadow-primary/10'}`}
              />
              {errors.authorEmail && (
                <p className="text-sm text-destructive flex items-center gap-1.5 animate-fade-in">
                  <span className="w-1 h-1 rounded-full bg-destructive" />
                  {errors.authorEmail}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="authorWebsite" className="text-sm font-semibold text-muted-foreground">
              웹사이트 (선택사항)
            </Label>
            <Input
              id="authorWebsite"
              type="url"
              value={formData.authorWebsite}
              onChange={(e) => handleInputChange('authorWebsite', e.target.value)}
              placeholder="https://example.com"
              className="transition-all focus:shadow-md focus:shadow-primary/10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content" className="text-sm font-semibold flex items-center gap-1.5">
              댓글 
              <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="댓글을 입력해주세요..."
              rows={4}
              className={`transition-all resize-none ${errors.content ? 'border-destructive shadow-sm shadow-destructive/20' : 'focus:shadow-md focus:shadow-primary/10'}`}
            />
            {errors.content && (
              <p className="text-sm text-destructive flex items-center gap-1.5 animate-fade-in">
                <span className="w-1 h-1 rounded-full bg-destructive" />
                {errors.content}
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-2">
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                className="hover:bg-muted/50 transition-all"
              >
                취소
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/30 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              {isSubmitting ? '제출 중...' : '댓글 작성'}
            </Button>
          </div>
        </form>

        <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-muted-foreground/10">
          <div className="flex flex-col gap-2 text-sm">
            <p className="flex items-start gap-2 text-muted-foreground">
              <span className="text-primary mt-0.5">•</span>
              <span>댓글은 관리자 승인 후 게시됩니다.</span>
            </p>
            <p className="flex items-start gap-2 text-muted-foreground">
              <span className="text-primary mt-0.5">•</span>
              <span>이메일 주소는 공개되지 않습니다.</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}