import { Loader2 } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

const loaderVariants = cva(
  'animate-spin text-muted-foreground',
  {
    variants: {
      size: {
        default: 'h-8 w-8',
        sm: 'h-4 w-4',
        lg: 'h-12 w-12',
        xl: 'h-16 w-16',
      },
      variant: {
        default: 'text-muted-foreground',
        primary: 'text-accent',
        secondary: 'text-secondary',
        destructive: 'text-destructive',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
);

interface LoaderProps extends VariantProps<typeof loaderVariants> {
  className?: string;
  label?: string;
  centered?: boolean;
}

export function Loader({ 
  size, 
  variant, 
  className = '',
  label,
  centered = false
}: LoaderProps) {
  const LoaderComponent = (
    <div className={centered ? 'flex flex-col items-center justify-center' : ''}>
      <Loader2 className={loaderVariants({ size, variant, className })} />
      {label && (
        <p className="mt-2 text-sm text-muted-foreground">{label}</p>
      )}
    </div>
  );

  if (centered) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        {LoaderComponent}
      </div>
    );
  }

  return LoaderComponent;
}

interface FullPageLoaderProps {
  label?: string;
}

export function FullPageLoader({ label }: FullPageLoaderProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
      <div className="flex flex-col items-center justify-center">
        <Loader size="lg" variant="primary" />
        {label && (
          <p className="mt-4 text-lg text-foreground">{label}</p>
        )}
      </div>
    </div>
  );
}

export default Loader; 