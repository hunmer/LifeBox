import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface DialogProps extends HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface DialogContentProps extends HTMLAttributes<HTMLDivElement> {}

interface DialogHeaderProps extends HTMLAttributes<HTMLDivElement> {}

interface DialogFooterProps extends HTMLAttributes<HTMLDivElement> {}

interface DialogTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

interface DialogDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}

const Dialog = ({ open = false, onOpenChange, children, ...props }: DialogProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange?.(false)}
      />

      {/* Dialog content container */}
      <div className="relative z-10" {...props}>
        {children}
      </div>
    </div>
  );
};

const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-background border rounded-lg shadow-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-auto",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
DialogContent.displayName = "DialogContent";

const DialogHeader = forwardRef<HTMLDivElement, DialogHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-6 pb-4", className)}
      {...props}
    />
  )
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = forwardRef<HTMLDivElement, DialogFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 pt-4", className)}
      {...props}
    />
  )
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = forwardRef<HTMLHeadingElement, DialogTitleProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
);
DialogTitle.displayName = "DialogTitle";

const DialogDescription = forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
);
DialogDescription.displayName = "DialogDescription";

export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
};