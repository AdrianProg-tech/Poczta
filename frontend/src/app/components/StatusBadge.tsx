interface StatusBadgeProps {
  status: string;
  type?: 'shipment' | 'payment';
}

export function StatusBadge({ status, type = 'shipment' }: StatusBadgeProps) {
  const getStatusColor = () => {
    if (type === 'payment') {
      switch (status) {
        case 'Opłacona':
          return 'bg-success/10 text-success border-success/20';
        case 'Oczekująca':
          return 'bg-warning/10 text-warning border-warning/20';
        case 'Nieudana':
        case 'Anulowana':
          return 'bg-destructive/10 text-destructive border-destructive/20';
        case 'Offline — do potwierdzenia':
          return 'bg-info/10 text-info border-info/20';
        default:
          return 'bg-muted text-muted-foreground border-border';
      }
    }
    
    // Shipment statuses
    switch (status) {
      case 'Doręczona':
      case 'Opłacona':
        return 'bg-success/10 text-success border-success/20';
      case 'Utworzona':
      case 'Oczekuje na odbiór':
        return 'bg-info/10 text-info border-info/20';
      case 'W transporcie':
      case 'Wydana kurierowi':
      case 'Nadana':
        return 'bg-accent/10 text-accent border-accent/20';
      case 'Próba doręczenia':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'Zwrócona':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md border text-xs ${getStatusColor()}`}>
      {status}
    </span>
  );
}
