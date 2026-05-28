import { useTranslation } from 'react-i18next';

interface StatusBadgeProps {
  status: string | null | undefined;
  type?: 'shipment' | 'payment' | 'complaint';
}

function getStatusColor(type: StatusBadgeProps['type'], status: string | null | undefined) {
  if (type === 'payment') {
    switch (status) {
      case 'PAID':
      case 'OFFLINE_CONFIRMED':
        return 'bg-success/10 text-success border-success/20';
      case 'PENDING':
      case 'OFFLINE_PENDING':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'FAILED':
      case 'CANCELED':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  }

  if (type === 'complaint') {
    switch (status) {
      case 'SUBMITTED':
        return 'bg-info/10 text-info border-info/20';
      case 'IN_REVIEW':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'ACCEPTED':
      case 'CLOSED':
        return 'bg-success/10 text-success border-success/20';
      case 'REJECTED':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  }

  switch (status) {
    case 'DELIVERED':
      return 'bg-success/10 text-success border-success/20';
    case 'REGISTERED':
    case 'CREATED':
    case 'PAID':
    case 'READY_FOR_POSTING':
    case 'IN_TRANSIT':
    case 'OUT_FOR_DELIVERY':
    case 'POSTED':
      return 'bg-accent/10 text-accent border-accent/20';
    case 'AWAITING_PICKUP':
    case 'REDIRECTED_TO_PICKUP':
      return 'bg-info/10 text-info border-info/20';
    case 'DELIVERY_ATTEMPT':
      return 'bg-warning/10 text-warning border-warning/20';
    case 'RETURNED':
    case 'CANCELED':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

export function StatusBadge({ status, type = 'shipment' }: StatusBadgeProps) {
  const { t } = useTranslation();

  const label = status
    ? (t(`status.${type}.${status}`, { defaultValue: status }) as string)
    : t('status.unknown');

  return (
    <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs ${getStatusColor(type, status)}`}>
      {label}
    </span>
  );
}
