import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

type DialogContextValue = {
  close: () => void;
};

const DialogContext = React.createContext<DialogContextValue | null>(null);

const FOCUSABLE_SELECTORS =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const getFocusableElements = (container: HTMLElement | null) => {
  if (!container) return [] as HTMLElement[];

  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS),
  ).filter((element) => !element.hasAttribute("data-focus-guard"));
};

const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleClose = React.useCallback(() => {
    onOpenChange?.(false);
  }, [onOpenChange]);

  if (!open || !isMounted || typeof document === "undefined") return null;

  return createPortal(
    <DialogContext.Provider value={{ close: handleClose }}>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="fixed inset-0 bg-black/50 dark:bg-black/70"
          aria-hidden="true"
          onClick={handleClose}
        />
        {children}
      </div>
    </DialogContext.Provider>,
    document.body,
  );
};

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, ...props }, ref) => {
    const context = React.useContext(DialogContext);
    const localRef = React.useRef<HTMLDivElement | null>(null);
    const combinedRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        localRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      },
      [ref],
    );

    React.useEffect(() => {
      const previouslyFocused = document.activeElement as HTMLElement | null;
      const node = localRef.current;
      const focusable = getFocusableElements(node);

      (focusable[0] ?? node)?.focus();

      return () => {
        previouslyFocused?.focus();
      };
    }, []);

    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          event.preventDefault();
          context?.close();
          return;
        }

        if (event.key !== "Tab") {
          return;
        }

        const node = localRef.current;
        const focusable = getFocusableElements(node);

        if (focusable.length === 0) {
          event.preventDefault();
          node?.focus();
          return;
        }

        const activeElement = document.activeElement as HTMLElement | null;
        const currentIndex = focusable.findIndex(
          (element) => element === activeElement,
        );
        const lastIndex = focusable.length - 1;

        if (event.shiftKey) {
          if (currentIndex <= 0) {
            event.preventDefault();
            focusable[lastIndex].focus();
          }
          return;
        }

        if (currentIndex === -1 || currentIndex === lastIndex) {
          event.preventDefault();
          focusable[0].focus();
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [context]);

    return (
      <div
        ref={combinedRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={cn(
          "relative z-50 w-full max-w-lg rounded-lg bg-surface p-6 shadow-lg border outline-none",
          className,
        )}
        onClick={(event) => event.stopPropagation()}
        {...props}
      >
        {children}
      </div>
    );
  },
);
DialogContent.displayName = "DialogContent";

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 mb-4", className)} {...props} />
);

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className,
    )}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription };
