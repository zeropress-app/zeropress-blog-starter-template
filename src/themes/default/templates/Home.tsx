import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Navbar } from "../components/Navbar";
import { SiteMenu } from "@/components/SiteMenu";
import { Footer } from "../components/Footer";
import { PostCard } from "../components/PostCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ChevronLeft, ChevronRight, Grid3x3, List } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

const Home = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const pageFromUrl = parseInt(searchParams.get("page") || "1", 10);
  const [page, setPage] = useState(pageFromUrl);
  
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    const saved = localStorage.getItem("viewMode");
    return (saved === "list" || saved === "grid") ? saved : "grid";
  });
  
  const limit = 9;
  const { settings } = useSiteSettings();

  useEffect(() => {
    setSearchParams({ page: page.toString() }, { replace: true });
  }, [page, setSearchParams]);

  useEffect(() => {
    localStorage.setItem("viewMode", viewMode);
  }, [viewMode]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["posts", page, limit],
    queryFn: () => api.getPosts(page, limit, true),
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex flex-col">
      <Navbar />
      <SiteMenu menuSlug="main-menu" />
      
      {/* Hero Section */}
      <section className="py-8 px-4 text-center bg-gradient-to-br from-primary/5 via-accent/5 to-background">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {settings.site_title}
          </h1>
          {settings.site_tagline && (
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {settings.site_tagline}
            </p>
          )}
        </div>
      </section>

      {/* Posts Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* View Mode Toggle */}
          <div className="flex justify-end mb-6 gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="gap-2"
            >
              <Grid3x3 className="h-4 w-4" />
              그리드
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="gap-2"
            >
              <List className="h-4 w-4" />
              리스트
            </Button>
          </div>
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-48 w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">
                Failed to load posts. Please try again later.
              </p>
            </div>
          )}

          {data && data.data.length === 0 && (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">
                No posts found. Check back soon!
              </p>
            </div>
          )}

          {data && data.data.length > 0 && (
            <>
              <div className={viewMode === "grid" 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" 
                : "flex flex-col gap-4"
              }>
                {data.data.map((post) => (
                  <PostCard key={post.id} post={post} variant={viewMode} />
                ))}
              </div>

              {/* Pagination */}
              {data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-12">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  
                  <span className="text-sm text-muted-foreground">
                    Page {data.pagination.page} of {data.pagination.totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                    disabled={page === data.pagination.totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
