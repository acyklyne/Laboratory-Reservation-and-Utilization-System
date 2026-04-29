import { Badge } from '@/components/ui/badge';
import { ReservationStatus } from '@/types/reservation';
import { cn } from '@/lib/utils';

const statusMap: Record<string, { label: string; className: string }> = {
  approved: { label: 'Approved', className: 'bg-primary/10 text-primary border-primary/20' },
  pending: { label: 'Pending', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  rejected: { label: 'Rejected', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  cancelled: { label: 'Cancelled', className: 'bg-muted text-muted-foreground border-muted' },
  APPROVED: { label: 'Approved', className: 'bg-primary/10 text-primary border-primary/20' },
  PENDING: { label: 'Pending', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  REJECTED: { label: 'Rejected', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  CANCELLED: { label: 'Cancelled', className: 'bg-muted text-muted-foreground border-muted' },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusMap[status];
  if (!config) return null;
  return (
    <Badge variant="outline" className={cn("px-2.5 py-0.5 rounded-full font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}
