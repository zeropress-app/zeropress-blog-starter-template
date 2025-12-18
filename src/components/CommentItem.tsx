import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import type { Comment } from "@/types/api";
import { CommentForm } from "./CommentForm";

interface CommentItemProps {
  comment: Comment;
  onReply: (data: {
    postId: number;
    authorName: string;
    authorEmail: string;
    authorWebsite?: string;
    content: string;
    parentId?: number;
  }) => Promise<void>;
  isSubmitting?: boolean;
  depth?: number;
}

export function CommentItem({ 
  comment, 
  onReply, 
  isSubmitting = false, 
  depth = 0 
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);

  const handleReply = async (data: any) => {
    await onReply(data);
    setShowReplyForm(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const maxDepth = 3; // 최대 중첩 깊이 제한

  return (
    <div className={`${depth > 0 ? 'ml-8 mt-4' : ''} animate-fade-in`}>
      <Card className="w-full hover:shadow-md transition-shadow border-l-2 border-l-primary/20 hover:border-l-primary/50">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Avatar className="h-11 w-11 flex-shrink-0 ring-2 ring-primary/10">
              <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-primary/20 to-accent/20">
                {getInitials(comment.authorName)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h4 className="font-semibold text-base">
                  {comment.authorWebsite ? (
                    <a 
                      href={comment.authorWebsite} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-primary flex items-center gap-1.5 transition-colors group"
                    >
                      {comment.authorName}
                      <ExternalLink className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ) : (
                    comment.authorName
                  )}
                </h4>
                <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                  {format(new Date(comment.createdAt), 'PPp', { locale: ko })}
                </span>
              </div>
              
              <div className="prose prose-sm max-w-none dark:prose-invert mb-4">
                <p className="whitespace-pre-wrap break-words leading-relaxed">{comment.content}</p>
              </div>
              
              {depth < maxDepth && (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    className="h-8 px-3 text-xs hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                    답글 작성
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {showReplyForm && (
            <div className="mt-6 pt-4 border-t animate-fade-in">
              <CommentForm
                postId={comment.postId}
                parentComment={comment}
                onSubmit={handleReply}
                onCancel={() => setShowReplyForm(false)}
                isSubmitting={isSubmitting}
              />
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Render replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              isSubmitting={isSubmitting}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}