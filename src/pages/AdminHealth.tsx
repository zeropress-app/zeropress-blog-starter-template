import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, CheckCircle, XCircle, Clock } from "lucide-react";

const AdminHealth = () => {
  const { data: health, isLoading, error } = useQuery({
    queryKey: ["health-check"],
    queryFn: () => api.healthCheck(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">헬스체크</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                전체 상태
              </CardTitle>
              {isLoading ? (
                <Badge variant="secondary">확인 중...</Badge>
              ) : error ? (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  에러
                </Badge>
              ) : health?.status === "ok" ? (
                <Badge className="flex items-center gap-1 bg-green-500">
                  <CheckCircle className="h-3 w-3" />
                  정상
                </Badge>
              ) : (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  비정상
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading && <p className="text-muted-foreground">시스템 상태 확인 중...</p>}
            {error && (
              <p className="text-destructive">
                시스템 상태를 확인할 수 없습니다: {error instanceof Error ? error.message : "Unknown error"}
              </p>
            )}
            {health && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  모든 시스템이 정상적으로 작동하고 있습니다.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              마지막 확인
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {new Date().toLocaleTimeString('ko-KR')}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              30초마다 자동으로 갱신됩니다
            </p>
          </CardContent>
        </Card>
      </div>

      {health && (
        <Card>
          <CardHeader>
            <CardTitle>시스템 정보</CardTitle>
            <CardDescription>API 응답 데이터</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              {JSON.stringify(health, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminHealth;
