import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock } from 'lucide-react';

export function RateLimitIndicator() {
  const [waitTime, setWaitTime] = useState(0);

  useEffect(() => {
    const checkRateLimit = () => {
      const time = api.getRateLimitWaitTime();
      setWaitTime(time);
    };

    // Check immediately
    checkRateLimit();

    // Update every second
    const interval = setInterval(checkRateLimit, 1000);

    return () => clearInterval(interval);
  }, []);

  if (waitTime <= 0) return null;

  return (
    <Alert className="mb-4 border-orange-500 bg-orange-50 dark:bg-orange-950/20">
      <Clock className="h-4 w-4 text-orange-600" />
      <AlertDescription className="text-orange-800 dark:text-orange-200">
        요청 제한이 적용되었습니다. <strong>{waitTime}초</strong> 후에 다시 시도할 수 있습니다.
      </AlertDescription>
    </Alert>
  );
}
