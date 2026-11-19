import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

/** A bordered surface. Elevation is declared once, by the hairline, never by a shadow. */
export function Card({ className, children, ...props }: CardProps) {
  return (
    <div className={cn('panel', className)} {...props}>
      {children}
    </div>
  );
}
