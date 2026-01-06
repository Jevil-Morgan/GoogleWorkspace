import * as React from "react";
import { cn } from "@/lib/utils";

interface GoogleCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const GoogleCard = React.forwardRef<HTMLDivElement, GoogleCardProps>(
  ({ className, hover = false, padding = "md", children, ...props }, ref) => {
    const paddingClasses = {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "bg-card rounded-2xl border border-border shadow-google transition-all duration-200",
          hover && "hover:shadow-google-hover cursor-pointer",
          paddingClasses[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GoogleCard.displayName = "GoogleCard";

const GoogleCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center justify-between mb-4", className)}
    {...props}
  />
));

GoogleCardHeader.displayName = "GoogleCardHeader";

const GoogleCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-lg font-medium text-foreground", className)}
    {...props}
  />
));

GoogleCardTitle.displayName = "GoogleCardTitle";

const GoogleCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));

GoogleCardContent.displayName = "GoogleCardContent";

export { GoogleCard, GoogleCardHeader, GoogleCardTitle, GoogleCardContent };
