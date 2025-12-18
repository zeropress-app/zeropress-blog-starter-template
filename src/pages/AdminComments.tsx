import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { useApiError } from "@/hooks/use-api-error";
import { RateLimitIndicator } from "@/components/RateLimitIndicator";
import { 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Trash2, 
  ExternalLink,
  Search,
  Filter,
  MoreHorizontal
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import type { Comment } from "@/types/api";

type CommentStatus = 'pending' | 'approved' | 'spam' | 'trash';

interface AdminComment extends Comment {
  post_title?: string;
  post_slug?: string;
}

export default function AdminComments() {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<CommentStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();
  const { handleError } = useApiError();

  // Fetch comment statistics
  const { data: statsData } = useQuery({
    queryKey: ["admin", "comments", "stats"],
    queryFn: () => api.getCommentStats(),
  });

  // Fetch comments
  const { data: commentsData, isLoading, error } = useQuery({
    queryKey: ["admin", "comments", currentPage, statusFilter, searchQuery],
    queryFn: () => api.getAdminComments({
      page: currentPage,
      limit: 20,
      status: statusFilter === 'all' ? undefined : statusFilter,
    }),
  });

  // Moderate comment mutation
  const moderateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'approved' | 'spam' | 'trash' }) =>
      api.moderateComment(id, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "comments"] });
      toast({
        title: "댓글 상태 변경 완료",
        description: `댓글이 ${getStatusLabel(status)}(으)로 변경되었습니다.`,
      });
    },
    onError: (error: any) => {
      handleError(error, { 
        customMessage: "댓글 상태 변경에 실패했습니다.",
        skipAuthRedirect: true 
      });
    },
  });

  // Delete comment mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "comments"] });
      toast({
        title: "댓글 삭제 완료",
        description: "댓글이 완전히 삭제되었습니다.",
      });
    },
    onError: (error: any) => {
      handleError(error, { 
        customMessage: "댓글 삭제에 실패했습니다.",
        skipAuthRedirect: true 
      });
    },
  });

  const handleModerate = (id: number, status: 'approved' | 'spam' | 'trash') => {
    moderateMutation.mutate({ id, status });
  };

  const handleDelete = (id: number) => {
    if (confirm('이 댓글을 완전히 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />승인됨</Badge>;
      case 'pending':
        return <Badge variant="secondary"><AlertTriangle className="h-3 w-3 mr-1" />대기중</Badge>;
      case 'spam':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />스팸</Badge>;
      case 'trash':
        return <Badge variant="outline"><Trash2 className="h-3 w-3 mr-1" />휴지통</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return '승인됨';
      case 'pending': return '대기중';
      case 'spam': return '스팸';
      case 'trash': return '휴지통';
      default: return status;
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'AN'; // Anonymous
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    try {
      // "2025-11-03 19:45:52" 형식을 ISO 형식으로 변환
      const isoDate = dateString.replace(' ', 'T') + 'Z';
      return format(new Date(isoDate), 'PPp', { locale: ko });
    } catch (error) {
      return dateString; // 파싱 실패시 원본 반환
    }
  };

  const stats = statsData?.data || {
    total: 0,
    pending: 0,
    approved: 0,
    spam: 0,
    trash: 0,
    recent: 0,
  };

  const comments = commentsData?.data?.comments || [];
  const pagination = commentsData?.data?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">댓글 관리</h1>
        <p className="text-muted-foreground mt-2">
          블로그 댓글을 관리하고 모더레이션합니다.
        </p>
      </div>

      {/* Rate Limit Indicator */}
      <RateLimitIndicator />

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 댓글</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">대기중</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">승인됨</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">스팸</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.spam}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">휴지통</CardTitle>
            <Trash2 className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.trash}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">최근 7일</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recent}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>필터</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="댓글 내용 또는 작성자 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="상태 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 상태</SelectItem>
                <SelectItem value="pending">대기중</SelectItem>
                <SelectItem value="approved">승인됨</SelectItem>
                <SelectItem value="spam">스팸</SelectItem>
                <SelectItem value="trash">휴지통</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Comments Table */}
      <Card>
        <CardHeader>
          <CardTitle>댓글 목록</CardTitle>
          <CardDescription>
            {pagination && `총 ${pagination.total}개의 댓글 (${pagination.page}/${pagination.totalPages} 페이지)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">댓글을 불러오는 중...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8 text-destructive">
              댓글을 불러오는데 실패했습니다.
            </div>
          ) : comments.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              댓글이 없습니다.
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment: AdminComment) => (
                <Card key={comment.id} className="p-4">
                  <div className="flex gap-4">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className="text-sm">
                        {getInitials(comment.authorName)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-sm">
                          {comment.authorWebsite ? (
                            <a 
                              href={comment.authorWebsite} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:text-primary flex items-center gap-1"
                            >
                              {comment.authorName}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            comment.authorName
                          )}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          {comment.authorEmail}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(comment.createdAt)}
                        </span>
                        {getStatusBadge(comment.status)}
                      </div>
                      
                      {comment.post_title && (
                        <div className="text-xs text-muted-foreground mb-2">
                          포스트: <span className="font-medium">{comment.post_title}</span>
                        </div>
                      )}
                      
                      <div className="prose prose-sm max-w-none dark:prose-invert mb-3">
                        <p className="whitespace-pre-wrap break-words text-sm">
                          {comment.content}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        {comment.status !== 'approved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleModerate(comment.id, 'approved')}
                            disabled={moderateMutation.isPending}
                            className="h-8 px-2 text-xs"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            승인
                          </Button>
                        )}
                        
                        {comment.status !== 'spam' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleModerate(comment.id, 'spam')}
                            disabled={moderateMutation.isPending}
                            className="h-8 px-2 text-xs"
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            스팸
                          </Button>
                        )}
                        
                        {comment.status !== 'trash' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleModerate(comment.id, 'trash')}
                            disabled={moderateMutation.isPending}
                            className="h-8 px-2 text-xs"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            휴지통
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(comment.id)}
                          disabled={deleteMutation.isPending}
                          className="h-8 px-2 text-xs"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          삭제
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                {pagination.total}개 중 {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)}개 표시
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  이전
                </Button>
                <span className="flex items-center px-3 text-sm">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  다음
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}