import { cn } from "@/utils/cn";

export type ItemStatus = 'unclaimed' | 'claimed' | 'disposed';

interface StatusBadgeProps {
  status: ItemStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const styles = {
    unclaimed: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    claimed: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    disposed: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  const icons = {
    unclaimed: '🟡',
    claimed: '✅',
    disposed: '❌',
  };

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded px-2 py-0.5 font-sans text-[10px] font-bold tracking-wider uppercase border",
      styles[status],
      className
    )}>
      {icons[status]} {status}
    </span>
  );
}
