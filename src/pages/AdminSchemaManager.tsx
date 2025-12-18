import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useApiError } from "@/hooks/use-api-error";
import { RateLimitIndicator } from "@/components/RateLimitIndicator";
import { CheckCircle2, XCircle, AlertCircle, Database, RefreshCw, Wrench } from "lucide-react";

interface SchemaIssue {
  type: 'missing_table' | 'missing_column' | 'missing_index' | 'wrong_type' | 'missing_constraint';
  severity: 'error' | 'warning';
  table?: string;
  column?: string;
  index?: string;
  expected: string;
  actual?: string;
  fixable: boolean;
  fixQuery?: string;
}

interface ValidationResult {
  valid: boolean;
  issues: SchemaIssue[];
  tablesCount: number;
  indexesCount: number;
}

export default function AdminSchemaManager() {
  const [validating, setValidating] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [dbInfo, setDbInfo] = useState<any>(null);
  const { handleError } = useApiError();

  const handleValidate = async () => {
    setValidating(true);
    try {
      const result = await api.validateSchema();

      // 안전한 데이터 구조 보장
      const safeResult = {
        valid: result.valid || false,
        issues: Array.isArray(result.issues) ? result.issues : [],
        tablesCount: result.tablesCount || 0,
        indexesCount: result.indexesCount || 0,
      };

      setValidation(safeResult);

      if (safeResult.valid) {
        toast({
          title: "검증 완료",
          description: "스키마에 문제가 없습니다.",
        });
      } else {
        toast({
          title: "검증 완료",
          description: `${safeResult.issues.length}개의 이슈가 발견되었습니다.`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      handleError(error, { 
        customMessage: "스키마 검증에 실패했습니다.",
        skipAuthRedirect: true 
      });

      // 에러 시에도 기본 구조 설정
      setValidation({
        valid: false,
        issues: [],
        tablesCount: 0,
        indexesCount: 0,
      });
    } finally {
      setValidating(false);
    }
  };

  const handleFix = async () => {
    if (!validation || !validation.issues) {
      toast({
        title: "수정 실패",
        description: "수정할 이슈가 없습니다. 먼저 스키마를 검증해주세요.",
        variant: "destructive",
      });
      return;
    }

    const fixableIssues = validation.issues.filter(issue => issue.fixable);
    if (fixableIssues.length === 0) {
      toast({
        title: "수정할 이슈 없음",
        description: "자동으로 수정할 수 있는 이슈가 없습니다.",
        variant: "destructive",
      });
      return;
    }

    setFixing(true);
    try {
      const result = await api.fixSchema(fixableIssues);
      toast({
        title: "수정 완료",
        description: `${result.fixed}개의 이슈가 수정되었습니다.`,
      });

      // 수정 후 재검증
      await handleValidate();
    } catch (error: any) {
      handleError(error, { 
        customMessage: "스키마 수정에 실패했습니다.",
        skipAuthRedirect: true 
      });
    } finally {
      setFixing(false);
    }
  };

  const handleLoadDbInfo = async () => {
    setLoadingInfo(true);
    try {
      const info = await api.getDatabaseInfo();

      // 안전한 데이터 구조 보장
      const safeInfo = {
        tables: Array.isArray(info.tables) ? info.tables : [],
        indexes: Array.isArray(info.indexes) ? info.indexes : [],
        tableStats: Array.isArray(info.tableStats) ? info.tableStats : [],
        totalTables: info.totalTables || 0,
        totalIndexes: info.totalIndexes || 0,
      };

      setDbInfo(safeInfo);
    } catch (error: any) {
      handleError(error, { 
        customMessage: "데이터베이스 정보 조회에 실패했습니다.",
        skipAuthRedirect: true 
      });
    } finally {
      setLoadingInfo(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "error":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      case "warning":
        return <Badge className="bg-yellow-500">Warning</Badge>;
      default:
        return <Badge variant="secondary">Info</Badge>;
    }
  };

  // Calculate summary from issues
  const getIssueSummary = (issues?: SchemaIssue[]) => {
    const safeIssues = issues || [];
    return {
      total: safeIssues.length,
      errors: safeIssues.filter(i => i.severity === 'error').length,
      warnings: safeIssues.filter(i => i.severity === 'warning').length,
      fixable: safeIssues.filter(i => i.fixable).length,
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">스키마 관리</h1>
        <p className="text-muted-foreground mt-2">
          데이터베이스 스키마를 검증하고 자동으로 수정합니다.
        </p>
      </div>

      {/* Rate Limit Indicator */}
      <RateLimitIndicator />

      {/* Action Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              스키마 검증
            </CardTitle>
            <CardDescription>
              현재 스키마 상태를 점검합니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleValidate}
              disabled={validating}
              className="w-full"
            >
              {validating ? "검증 중..." : "검증 시작"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              자동 수정
            </CardTitle>
            <CardDescription>
              발견된 이슈를 자동으로 수정합니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleFix}
              disabled={fixing || !validation || getIssueSummary(validation?.issues).fixable === 0}
              className="w-full"
              variant="secondary"
            >
              {fixing ? "수정 중..." : "이슈 수정"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              DB 정보
            </CardTitle>
            <CardDescription>
              데이터베이스 정보를 조회합니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleLoadDbInfo}
              disabled={loadingInfo}
              className="w-full"
              variant="outline"
            >
              {loadingInfo ? "조회 중..." : "정보 조회"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Validation Results */}
      {validation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>검증 결과</span>
              {validation.valid ? (
                <Badge className="bg-green-500">정상</Badge>
              ) : (
                <Badge variant="destructive">이슈 발견</Badge>
              )}
            </CardTitle>
            <CardDescription>
              {(() => {
                const summary = getIssueSummary(validation?.issues);
                return `총 ${summary.total}개 이슈 | 에러 ${summary.errors}개 | 경고 ${summary.warnings}개 | 수정 가능 ${summary.fixable}개`;
              })()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {validation.valid ? (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  모든 스키마가 정상입니다.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {(validation.issues || []).map((issue, index) => (
                  <Alert key={index} variant={issue.severity === "error" ? "destructive" : "default"}>
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(issue.severity)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getSeverityBadge(issue.severity)}
                          {issue.fixable && (
                            <Badge variant="outline" className="text-green-600">
                              수정 가능
                            </Badge>
                          )}
                        </div>
                        <AlertDescription>
                          <strong>{issue.type}:</strong> {issue.expected}
                          {issue.table && ` (테이블: ${issue.table})`}
                          {issue.column && ` (컬럼: ${issue.column})`}
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Database Info */}
      {dbInfo && (
        <Card>
          <CardHeader>
            <CardTitle>데이터베이스 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium">테이블 수:</div>
                <div>{dbInfo.totalTables || 0}</div>

                <div className="font-medium">인덱스 수:</div>
                <div>{dbInfo.totalIndexes || 0}</div>

                <div className="font-medium">총 레코드 수:</div>
                <div>{dbInfo.tableStats?.reduce((sum: number, table: any) => sum + (table.rowCount || 0), 0) || 0}</div>

                {dbInfo.tableStats && dbInfo.tableStats.length > 0 && (
                  <>
                    <div className="col-span-2 font-medium mt-4 mb-2">테이블 목록:</div>
                    {dbInfo.tableStats.map((table: any) => (
                      <div key={table.name} className="col-span-2 flex justify-between p-2 bg-muted rounded">
                        <span>{table.name}</span>
                        <span className="text-muted-foreground">{table.rowCount || 0} rows</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
