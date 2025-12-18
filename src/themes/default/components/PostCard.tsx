import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Bookmark, BookmarkCheck } from "lucide-react";
import type { Post } from "@/types/api";
import { calculateReadingTime, formatReadingTime } from "@/lib/reading-time";
import { useBookmarks } from "@/hooks/use-bookmarks";

interface PostCardProps {
  post: Post;
  variant?: "grid" | "list";
}

export const PostCard = ({ post, variant = "grid" }: PostCardProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };
  
  const formattedDate = formatDate(post.createdAt);
  const readingTime = calculateReadingTime(post.content);
  const { isBookmarked, toggleBookmark } = useBookmarks();
  
  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleBookmark(post.id);
  };
  
  if (variant === "list") {
    return (
      <Link to={`/post/${post.id}`}>
        <Card className="hover:shadow-2xl transition-all duration-300 hover:translate-x-1 border-2 shadow-md bg-card/80 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row gap-4 p-6">
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{formattedDate}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{formatReadingTime(readingTime)}</span>
                  </div>
                  {!post.published && (
                    <Badge variant="secondary">Draft</Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBookmarkClick}
                  className="h-8 w-8"
                  aria-label={isBookmarked(post.id) ? "Remove bookmark" : "Add bookmark"}
                >
                  {isBookmarked(post.id) ? (
                    <BookmarkCheck className="h-5 w-5 fill-primary text-primary" />
                  ) : (
                    <Bookmark className="h-5 w-5" />
                  )}
                </Button>
              </div>
              <CardTitle className="text-2xl hover:text-primary transition-colors">
                {post.title}
              </CardTitle>
              <CardDescription className="text-base line-clamp-2">
                {post.summary || post.content.substring(0, 200) + "..."}
              </CardDescription>
            </div>
          </div>
        </Card>
      </Link>
    );
  }
  
  return (
    <Link to={`/post/${post.id}`}>
      <Card className="hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 h-full border-2 shadow-md bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap text-sm text-muted-foreground mb-2">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{formatReadingTime(readingTime)}</span>
              </div>
              {!post.published && (
                <Badge variant="secondary">
                  Draft
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBookmarkClick}
              className="h-8 w-8"
              aria-label={isBookmarked(post.id) ? "Remove bookmark" : "Add bookmark"}
            >
              {isBookmarked(post.id) ? (
                <BookmarkCheck className="h-5 w-5 fill-primary text-primary" />
              ) : (
                <Bookmark className="h-5 w-5" />
              )}
            </Button>
          </div>
          <CardTitle className="text-2xl hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-base line-clamp-3">
            {post.summary || post.content.substring(0, 150) + "..."}
          </CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
};
