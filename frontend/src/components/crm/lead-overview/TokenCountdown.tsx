import { useState, useEffect } from 'react';
import { Clock, XCircle } from 'lucide-react';
import { differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';

export function TokenCountdown({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const expiry = new Date(expiresAt);

      if (now >= expiry) {
        setIsExpired(true);
        setTimeLeft('Expirado');
        return;
      }

      const days = differenceInDays(expiry, now);
      const hours = differenceInHours(expiry, now) % 24;
      const minutes = differenceInMinutes(expiry, now) % 60;

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h restantes`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}min restantes`);
      } else {
        setTimeLeft(`${minutes}min restantes`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  if (isExpired) {
    return (
      <span className="text-red-600 flex items-center gap-1">
        <XCircle className="w-3 h-3" />
        Expirado
      </span>
    );
  }

  return (
    <span className="text-amber-600 flex items-center gap-1">
      <Clock className="w-3 h-3" />
      {timeLeft}
    </span>
  );
}
