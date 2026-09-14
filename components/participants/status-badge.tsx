import * as React from 'react';
import { ParticipantStatus } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: ParticipantStatus;
  className?: string;
  showIcon?: boolean;
}

export function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
  if (status === 'Confirmed') {
    return (
      <Badge variant="success" className={cn('gap-1', className)}>
        {showIcon && <CheckCircle className="h-3 w-3" />}
        Confirmed
      </Badge>
    );
  }

  if (status === 'Cancelled') {
    return (
      <Badge variant="danger" className={cn('gap-1', className)}>
        {showIcon && <XCircle className="h-3 w-3" />}
        Cancelled
      </Badge>
    );
  }

  return (
    <Badge variant="warning" className={cn('gap-1', className)}>
      {showIcon && <Clock className="h-3 w-3" />}
      Pending
    </Badge>
  );
}

