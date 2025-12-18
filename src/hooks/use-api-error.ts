import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { RateLimitError, ApiError } from '@/lib/api';

export function useApiError() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleError = useCallback((error: unknown, options?: {
    onRateLimit?: (retryAfter: number) => void;
    onAuthError?: () => void;
    skipAuthRedirect?: boolean;
    customMessage?: string;
  }) => {
    console.error('API Error:', error);

    // Handle rate limit errors
    if (error instanceof RateLimitError) {
      toast({
        title: '⏱️ 요청 제한',
        description: `요청이 너무 많습니다. ${error.retryAfter}초 후에 다시 시도해주세요.`,
        variant: 'destructive',
        duration: 5000,
      });
      
      if (options?.onRateLimit) {
        options.onRateLimit(error.retryAfter);
      }
      return;
    }

    // Handle API errors
    if (error instanceof ApiError) {
      // Handle authentication errors (401, 403)
      if ((error.status === 401 || error.status === 403) && !options?.skipAuthRedirect) {
        toast({
          title: '인증 실패',
          description: '다시 로그인해주세요.',
          variant: 'destructive',
        });
        
        if (options?.onAuthError) {
          options.onAuthError();
        } else {
          navigate('/admin/login');
        }
        return;
      }

      // Handle other API errors
      toast({
        title: '오류 발생',
        description: options?.customMessage || error.message,
        variant: 'destructive',
      });
      return;
    }

    // Handle generic errors
    toast({
      title: '오류 발생',
      description: options?.customMessage || (error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'),
      variant: 'destructive',
    });
  }, [toast, navigate]);

  return { handleError };
}
