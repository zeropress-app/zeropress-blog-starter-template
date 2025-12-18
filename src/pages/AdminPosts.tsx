import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2 } from "lucide-react";

const AdminPosts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ["admin-posts"],
    queryFn: () => api.getPosts(1, 100, false),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      toast({ title: "글이 삭제되었습니다" });
    },
    onError: (error) => {
      toast({
        title: "글 삭제 실패",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Posts</h2>
        
        <Button 
          className="bg-gradient-to-r from-primary to-accent"
          onClick={() => navigate("/admin/post/new")}
        >
          <Plus className="h-4 w-4 mr-2" />
          새 글 작성
        </Button>
      </div>

      <div className="grid gap-4">
        {isLoading && <p>Loading posts...</p>}
        
        {posts?.data.map((post) => (
          <Card key={post.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle 
                      className="cursor-pointer hover:text-primary transition-colors"
                      onClick={() => navigate(`/admin/post/edit/${post.id}`)}
                    >
                      {post.title}
                    </CardTitle>
                    <Badge variant={post.published ? "default" : "secondary"}>
                      {post.published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <CardDescription>
                    {post.summary || post.content.substring(0, 100) + "..."}
                  </CardDescription>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/admin/post/edit/${post.id}`)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm("정말로 이 글을 삭제하시겠습니까?")) {
                        deleteMutation.mutate(post.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminPosts;
