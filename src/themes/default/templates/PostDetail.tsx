import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Navbar } from "../components/Navbar";
import { SiteMenu } from "@/components/SiteMenu";
import { Footer } from "../components/Footer";
import { CommentSection } from "@/components/CommentSection";
import { SocialShare } from "@/components/SocialShare";
import { TableOfContents } from "@/components/TableOfContents";
import { ContentRenderer } from "@/components/ContentRenderer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ArrowLeft, Calendar, ArrowUp, Clock, Bookmark, BookmarkCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { calculateReadingTime, formatReadingTime } from "@/lib/reading-time";
import { useBookmarks } from "@/hooks/use-bookmarks";

const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const { isBookmarked, toggleBookmark } = useBookmarks();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["post", id],
    queryFn: () => api.getPost(Number(id)),
    enabled: !!id,
    retry: false, // Don't retry on 404 errors
  });

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
      
      // Calculate scroll progress
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const trackLength = documentHeight - windowHeight;
      const progress = (scrollTop / trackLength) * 100;
      
      setScrollProgress(Math.min(100, Math.max(0, progress)));
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex flex-col">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-muted/30 z-50">
        <div 
          className="h-full bg-gradient-to-r from-primary via-accent to-primary transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>
      
      <Navbar />
      <SiteMenu menuSlug="main-menu" />

      <article className="container mx-auto max-w-4xl px-4 py-6 flex-1">
        <Link to="/">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-6 hover:translate-x-[-4px] transition-transform"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        {isLoading && (
          <div className="space-y-8">
            <div className="space-y-4">
              <Skeleton className="h-16 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
            </div>
            <div className="bg-card rounded-xl p-8 space-y-4 border">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        )}

        {error && (
          <div className="text-center py-16 bg-card rounded-xl border">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-6" />
            <p className="text-xl font-medium text-foreground mb-2">
              {(error as any)?.status === 404
                ? "포스트를 찾을 수 없습니다"
                : "포스트를 불러올 수 없습니다"}
            </p>
            <p className="text-muted-foreground">
              {(error as any)?.status === 404
                ? "요청하신 포스트가 존재하지 않거나 접근 권한이 없습니다."
                : "잠시 후 다시 시도해주세요."}
            </p>
          </div>
        )}

        {data && (
          <>
            {/* Hero Header Section */}
            <header className="mb-12 relative">
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-gradient-to-br from-accent/20 to-primary/20 rounded-full blur-3xl" />
              
              <div className="relative">
                <h1 className="text-4xl font-bold mb-6 leading-tight bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent">
                  {data.data.title}
                </h1>

                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 flex-wrap text-muted-foreground">
                    <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-full">
                      <Calendar className="h-4 w-4" />
                      <time 
                        dateTime={data.data.createdAt}
                        className="text-sm font-medium"
                      >
                        {formatDate(data.data.createdAt)}
                      </time>
                    </div>
                    <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-full">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {formatReadingTime(calculateReadingTime(data.data.content))}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleBookmark(data.data.id)}
                      className="h-10 w-10"
                      aria-label={isBookmarked(data.data.id) ? "Remove bookmark" : "Add bookmark"}
                    >
                      {isBookmarked(data.data.id) ? (
                        <BookmarkCheck className="h-5 w-5 fill-primary text-primary" />
                      ) : (
                        <Bookmark className="h-5 w-5" />
                      )}
                    </Button>
                    <SocialShare 
                      title={data.data.title}
                      url={window.location.href}
                    />
                  </div>
                </div>
              </div>
            </header>

            {/* Content Section */}
            <div className="bg-card rounded-2xl border shadow-lg mb-12 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary" />
              <ContentRenderer
                content={data.data.content.replace(/https:\/\/blog.lael.be\//g, 'https://blog-assets.lael.be/')}
                format={data.data.contentFormat}
                className="prose-lg break-words p-8 md:p-12"
              />
            </div>

            {/* Table of Contents */}
            <TableOfContents content={data.data.content} />

            {/* Comments Section */}
            <div className="bg-card rounded-2xl border shadow-lg overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-accent via-primary to-accent" />
              <div className="p-8 md:p-12">
                <CommentSection postId={data.data.id} />
              </div>
            </div>
          </>
        )}
      </article>

      <Footer />

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          size="icon"
          className="fixed bottom-8 right-8 rounded-full shadow-2xl z-50 bg-gradient-to-r from-primary to-accent hover:scale-110 transition-transform border-2 border-background"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};

export default PostDetail;
