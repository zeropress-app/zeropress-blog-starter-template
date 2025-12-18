import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useApiError } from "@/hooks/use-api-error";
import { RateLimitIndicator } from "@/components/RateLimitIndicator";
import { Loader2, Save, Settings } from "lucide-react";

interface SiteSettings {
  site_title: string;
  site_tagline: string;
  admin_email: string;
  timezone: string;
  date_format: string;
  time_format: string;
  favicon_url: string;
}

const AdminOptionsGeneral = () => {
  const { toast } = useToast();
  const { handleError } = useApiError();
  const queryClient = useQueryClient();
  
  const [settings, setSettings] = useState<SiteSettings>({
    site_title: '',
    site_tagline: '',
    admin_email: '',
    timezone: 'Asia/Seoul',
    date_format: 'Y년 m월 d일',
    time_format: 'A g:i',
    favicon_url: '',
  });

  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string>('');

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => api.getSiteSettings(),
  });

  const uploadFaviconMutation = useMutation({
    mutationFn: (file: File) => api.uploadFavicon(file),
    onSuccess: (data) => {
      // data already has the correct structure from confirmUpload
      const faviconUrl = data.data.url;
      setSettings(prev => ({ ...prev, favicon_url: faviconUrl }));
      setFaviconPreview(faviconUrl);
      toast({
        title: "Favicon 업로드 완료",
        description: "Favicon이 성공적으로 업로드되었습니다.",
      });
    },
    onError: (error: any) => {
      handleError(error, { 
        customMessage: "Favicon 업로드에 실패했습니다.",
        skipAuthRedirect: true 
      });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: SiteSettings) => api.updateSiteSettings(data as unknown as Record<string, string>),
    onSuccess: () => {
      toast({
        title: "설정 저장 완료",
        description: "사이트 설정이 성공적으로 저장되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      queryClient.invalidateQueries({ queryKey: ['site-settings'] }); // 공용 설정 캐시도 무효화
    },
    onError: (error: any) => {
      handleError(error, { 
        customMessage: "설정 저장에 실패했습니다.",
        skipAuthRedirect: true 
      });
    },
  });

  useEffect(() => {
    if (settingsData?.data) {
      const data = settingsData.data as unknown as SiteSettings;
      setSettings(data);
      setFaviconPreview(data.favicon_url || '');
    }
  }, [settingsData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare settings to save
    let settingsToSave = { ...settings };
    
    // Upload favicon first if a new file is selected
    if (faviconFile) {
      try {
        const uploadResult = await uploadFaviconMutation.mutateAsync(faviconFile);
        // Use the uploaded favicon URL directly
        settingsToSave.favicon_url = uploadResult.data.url;
        setFaviconFile(null);
      } catch (error) {
        return; // Stop if favicon upload fails
      }
    }
    
    updateSettingsMutation.mutate(settingsToSave);
  };

  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/x-icon', 'image/vnd.microsoft.icon', 'image/png', 'image/jpeg', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "잘못된 파일 형식",
          description: "ICO, PNG, JPEG, GIF 파일만 업로드할 수 있습니다.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 1MB)
      if (file.size > 1024 * 1024) {
        toast({
          title: "파일 크기 초과",
          description: "파일 크기는 1MB 이하여야 합니다.",
          variant: "destructive",
        });
        return;
      }

      setFaviconFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setFaviconPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (key: keyof SiteSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const timezones = [
    { value: 'Asia/Seoul', label: '서울' },
    { value: 'Asia/Tokyo', label: '도쿄' },
    { value: 'Asia/Shanghai', label: '상하이' },
    { value: 'UTC', label: 'UTC (협정 세계시)' },
    { value: 'America/New_York', label: '뉴욕' },
    { value: 'America/Los_Angeles', label: '로스앤젤레스' },
    { value: 'Europe/London', label: '런던' },
    { value: 'Europe/Paris', label: '파리' },
  ];

  const dateFormats = [
    { value: 'Y년 m월 d일', label: '2025년 11월 04일', format: 'Y년 m월 d일' },
    { value: 'Y-m-d', label: '2025-11-04', format: 'Y-m-d' },
    { value: 'm/d/Y', label: '11/04/2025', format: 'm/d/Y' },
    { value: 'd/m/Y', label: '04/11/2025', format: 'd/m/Y' },
    { value: 'd.m.Y', label: '04.11.2025', format: 'd.m.Y' },
  ];

  const timeFormats = [
    { value: 'g:i a', label: '12:45 오후', format: 'g:i a' },
    { value: 'g:i A', label: '12:45 오후', format: 'g:i A' },
    { value: 'H:i', label: '12:45', format: 'H:i' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">일반 설정</h1>
      </div>

      {/* Rate Limit Indicator */}
      <RateLimitIndicator />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 사이트 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>사이트 기본 정보</CardTitle>
            <CardDescription>
              사이트의 기본 정보를 설정합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="site_title">사이트 제목</Label>
              <Input
                id="site_title"
                value={settings.site_title}
                onChange={(e) => handleInputChange('site_title', e.target.value)}
                placeholder="사이트 제목을 입력하세요"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="site_tagline">태그라인</Label>
              <Textarea
                id="site_tagline"
                value={settings.site_tagline}
                onChange={(e) => handleInputChange('site_tagline', e.target.value)}
                placeholder="사이트에 대한 짧은 설명을 입력하세요"
                rows={3}
              />
              <p className="text-sm text-muted-foreground">
                이 사이트에 대해 몇 마디로 설명하십시오. 예: '또 하나의 워드프레스 사이트.'
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Favicon 설정 */}
        <Card>
          <CardHeader>
            <CardTitle>사이트 아이콘 (Favicon)</CardTitle>
            <CardDescription>
              브라우저 탭에 표시될 사이트 아이콘을 설정합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              {faviconPreview && (
                <div className="flex-shrink-0">
                  <img 
                    src={faviconPreview} 
                    alt="Favicon Preview" 
                    className="w-8 h-8 object-contain border rounded"
                  />
                </div>
              )}
              <div className="flex-1">
                <Input
                  type="file"
                  accept=".ico,.png,.jpg,.jpeg,.gif"
                  onChange={handleFaviconChange}
                  className="cursor-pointer"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  ICO, PNG, JPEG, GIF 파일을 업로드할 수 있습니다. (최대 1MB)
                </p>
              </div>
            </div>
            {faviconFile && (
              <div className="text-sm text-muted-foreground">
                선택된 파일: {faviconFile.name} ({Math.round(faviconFile.size / 1024)}KB)
              </div>
            )}
          </CardContent>
        </Card>

        {/* 관리자 이메일 */}
        <Card>
          <CardHeader>
            <CardTitle>관리자 이메일 주소</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Input
                type="email"
                value={settings.admin_email}
                onChange={(e) => handleInputChange('admin_email', e.target.value)}
                placeholder="admin@example.com"
              />
              <p className="text-sm text-muted-foreground">
                이 주소는 관리 목적으로 사용됩니다. 이를 변경하려면, 이 이메일 주소로 새 주소를 보낼 것입니다. 새 주소는 확인될 때까지 활성화되지 않습니다.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 시간대 설정 */}
        <Card>
          <CardHeader>
            <CardTitle>시간대</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>시간대 선택</Label>
              <Select
                value={settings.timezone}
                onValueChange={(value) => handleInputChange('timezone', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                같은 시간대의 도시나 UTC (협정 세계시) 시차를 선택하세요.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm">
                <strong>세계시는</strong> 2025-11-04 03:45:55 입니다.
              </p>
              <p className="text-sm">
                <strong>지역 시간은</strong> 2025-11-04 12:45:55 입니다.
              </p>
              <p className="text-sm text-muted-foreground">
                이 시간대가 현재 표준 시간대입니다.
              </p>
              <p className="text-sm text-muted-foreground">
                이 시간대는 일광 절약 시간제를 사용하지 않습니다.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 날짜 표시 형식 */}
        <Card>
          <CardHeader>
            <CardTitle>날짜 표시 형식</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={settings.date_format}
              onValueChange={(value) => handleInputChange('date_format', value)}
            >
              {dateFormats.map((format) => (
                <div key={format.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={format.value} id={`date-${format.value}`} />
                  <Label htmlFor={`date-${format.value}`} className="flex-1 cursor-pointer">
                    <span className="mr-4">{format.label}</span>
                    <code className="text-xs text-muted-foreground">{format.format}</code>
                  </Label>
                </div>
              ))}
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="date-custom" />
                <Label htmlFor="date-custom" className="cursor-pointer">사용자 정의:</Label>
                <Input
                  className="flex-1 max-w-32"
                  value={settings.date_format}
                  onChange={(e) => handleInputChange('date_format', e.target.value)}
                  placeholder="Y년 F j일"
                />
              </div>
            </RadioGroup>
            <p className="text-sm">
              <strong>미리보기:</strong> 2025년 11월 4일
            </p>
          </CardContent>
        </Card>

        {/* 시간 표시 형식 */}
        <Card>
          <CardHeader>
            <CardTitle>시간 표시 형식</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={settings.time_format}
              onValueChange={(value) => handleInputChange('time_format', value)}
            >
              {timeFormats.map((format) => (
                <div key={format.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={format.value} id={`time-${format.value}`} />
                  <Label htmlFor={`time-${format.value}`} className="flex-1 cursor-pointer">
                    <span className="mr-4">{format.label}</span>
                    <code className="text-xs text-muted-foreground">{format.format}</code>
                  </Label>
                </div>
              ))}
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="time-custom" />
                <Label htmlFor="time-custom" className="cursor-pointer">사용자 정의:</Label>
                <Input
                  className="flex-1 max-w-32"
                  value={settings.time_format}
                  onChange={(e) => handleInputChange('time_format', e.target.value)}
                  placeholder="A g:i"
                />
              </div>
            </RadioGroup>
            <p className="text-sm">
              <strong>미리보기:</strong> 오후 12:45
            </p>
          </CardContent>
        </Card>

        <Separator />

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={updateSettingsMutation.isPending || uploadFaviconMutation.isPending}
            className="min-w-32"
          >
            {(updateSettingsMutation.isPending || uploadFaviconMutation.isPending) ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {uploadFaviconMutation.isPending ? 'Favicon 업로드 중...' : '저장 중...'}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                변경사항 저장
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminOptionsGeneral;