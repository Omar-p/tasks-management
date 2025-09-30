import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useTheme } from "@/contexts/ThemeProvider";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme, resolvedTheme } = useTheme();
  const themeProp: ToasterProps["theme"] =
    theme === "system" ? "system" : resolvedTheme;

  return (
    <Sonner
      theme={themeProp}
      className="toaster group"
      duration={4000}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
