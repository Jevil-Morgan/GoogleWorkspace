import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useSoundEffects } from "@/hooks/useSoundEffects";

const googleButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 btn-press",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-google hover:shadow-google-hover hover:brightness-105 active:scale-[0.98]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-google hover:shadow-google-hover",
        outline:
          "border border-border bg-card text-foreground hover:bg-secondary shadow-google hover:shadow-google-hover",
        ghost:
          "text-foreground hover:bg-secondary/80",
        destructive:
          "bg-destructive text-destructive-foreground shadow-google hover:shadow-google-hover hover:brightness-105",
        google:
          "bg-card border border-border text-foreground shadow-google hover:shadow-google-hover hover:bg-secondary/50",
        blue:
          "bg-google-blue text-primary-foreground shadow-google hover:shadow-google-hover hover:brightness-105",
        text:
          "text-primary hover:bg-accent",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-8 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface GoogleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof googleButtonVariants> {
  enableSound?: boolean;
}

const GoogleButton = React.forwardRef<HTMLButtonElement, GoogleButtonProps>(
  ({ className, variant, size, enableSound = true, onClick, ...props }, ref) => {
    const { playClick } = useSoundEffects();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (enableSound) {
        playClick();
      }
      onClick?.(e);
    };

    return (
      <button
        className={cn(googleButtonVariants({ variant, size, className }))}
        ref={ref}
        onClick={handleClick}
        {...props}
      />
    );
  }
);

GoogleButton.displayName = "GoogleButton";

export { GoogleButton, googleButtonVariants };
