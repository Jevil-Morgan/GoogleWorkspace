import React from 'react';
import { cn } from '@/lib/utils';

interface AnimatedIconProps {
  className?: string;
  isActive?: boolean;
}

// Animated Dashboard Icon - pulsing grid
export const AnimatedDashboardIcon: React.FC<AnimatedIconProps> = ({ className, isActive }) => (
  <svg className={cn("transition-all duration-300", className)} viewBox="0 0 24 24" fill="none">
    <rect 
      x="3" y="3" width="8" height="8" rx="2" 
      className={cn(
        "fill-current transition-all duration-500",
        isActive && "animate-pulse"
      )}
    />
    <rect 
      x="13" y="3" width="8" height="8" rx="2" 
      className={cn(
        "fill-current transition-all duration-500 delay-75",
        isActive && "animate-pulse"
      )}
      style={{ animationDelay: '100ms' }}
    />
    <rect 
      x="3" y="13" width="8" height="8" rx="2" 
      className={cn(
        "fill-current transition-all duration-500 delay-150",
        isActive && "animate-pulse"
      )}
      style={{ animationDelay: '200ms' }}
    />
    <rect 
      x="13" y="13" width="8" height="8" rx="2" 
      className={cn(
        "fill-current transition-all duration-500 delay-200",
        isActive && "animate-pulse"
      )}
      style={{ animationDelay: '300ms' }}
    />
  </svg>
);

// Animated Gmail Icon - envelope opening effect
export const AnimatedGmailIcon: React.FC<AnimatedIconProps> = ({ className, isActive }) => (
  <svg className={cn("transition-all duration-300", className)} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="gmail-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#EA4335"/>
        <stop offset="100%" stopColor="#FBBC05"/>
      </linearGradient>
    </defs>
    <path 
      d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6Z" 
      fill="#EA4335"
      className={cn(isActive && "animate-pulse")}
    />
    <path 
      d="M22 6L12 13L2 6" 
      stroke="white" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={cn(
        "transition-all duration-300 origin-center",
        isActive && "animate-bounce"
      )}
      style={{ transformOrigin: 'center' }}
    />
  </svg>
);

// Animated Calendar Icon - date flipping effect
export const AnimatedCalendarIcon: React.FC<AnimatedIconProps> = ({ className, isActive }) => (
  <svg className={cn("transition-all duration-300", className)} viewBox="0 0 24 24" fill="none">
    <rect 
      x="3" y="4" width="18" height="18" rx="2" 
      fill="#4285F4"
      className={cn(isActive && "animate-pulse")}
    />
    <path d="M3 9H21" stroke="white" strokeWidth="1.5"/>
    <rect x="3" y="4" width="18" height="5" rx="2" fill="#1A73E8"/>
    <g className={cn("transition-all duration-300", isActive && "animate-bounce")} style={{ transformOrigin: 'center' }}>
      <circle cx="8" cy="14" r="1.5" fill="white"/>
      <circle cx="12" cy="14" r="1.5" fill="white"/>
      <circle cx="16" cy="14" r="1.5" fill="white"/>
    </g>
  </svg>
);

// Animated Drive Icon - files stacking effect
export const AnimatedDriveIcon: React.FC<AnimatedIconProps> = ({ className, isActive }) => (
  <svg className={cn("transition-all duration-300", className)} viewBox="0 0 24 24" fill="none">
    <path 
      d="M8 4L2 14H8L14 4H8Z" 
      fill="#0066DA"
      className={cn("transition-all duration-300", isActive && "animate-pulse")}
    />
    <path 
      d="M14 4L8 14H14L20 4H14Z" 
      fill="#00AC47"
      className={cn("transition-all duration-300", isActive && "animate-pulse")}
      style={{ animationDelay: '100ms' }}
    />
    <path 
      d="M8 14L2 14L5 20H11L8 14Z" 
      fill="#EA4335"
      className={cn("transition-all duration-300", isActive && "animate-pulse")}
      style={{ animationDelay: '200ms' }}
    />
    <path 
      d="M14 14L8 14L11 20H17L14 14Z" 
      fill="#00832D"
      className={cn("transition-all duration-300", isActive && "animate-pulse")}
      style={{ animationDelay: '250ms' }}
    />
    <path 
      d="M14 14H20L17 20H11L14 14Z" 
      fill="#2684FC"
      className={cn("transition-all duration-300", isActive && "animate-pulse")}
      style={{ animationDelay: '300ms' }}
    />
    <path 
      d="M20 4L14 14H20L22 10L20 4Z" 
      fill="#FFBA00"
      className={cn("transition-all duration-300", isActive && "animate-pulse")}
      style={{ animationDelay: '350ms' }}
    />
  </svg>
);

// Animated Tasks Icon - checkbox checking effect
export const AnimatedTasksIcon: React.FC<AnimatedIconProps> = ({ className, isActive }) => (
  <svg className={cn("transition-all duration-300", className)} viewBox="0 0 24 24" fill="none">
    <rect 
      x="3" y="3" width="18" height="18" rx="2" 
      fill="#4285F4"
      className={cn(isActive && "animate-pulse")}
    />
    <path 
      d="M8 12L10.5 14.5L16 9" 
      stroke="white" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={cn(
        "transition-all duration-500",
        isActive ? "stroke-dasharray-0" : ""
      )}
      style={{
        strokeDasharray: isActive ? '20' : '0',
        strokeDashoffset: isActive ? '0' : '20',
        transition: 'stroke-dashoffset 0.5s ease-in-out'
      }}
    />
  </svg>
);

// Animated Sparkles Icon - twinkling effect
export const AnimatedSparklesIcon: React.FC<AnimatedIconProps> = ({ className, isActive }) => (
  <svg className={cn("transition-all duration-300", className)} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="sparkle-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4285F4"/>
        <stop offset="50%" stopColor="#9B72CB"/>
        <stop offset="100%" stopColor="#D96570"/>
      </linearGradient>
    </defs>
    <path 
      d="M12 2L14 8L20 10L14 12L12 18L10 12L4 10L10 8L12 2Z" 
      fill="url(#sparkle-gradient)"
      className={cn(
        "transition-all duration-300 origin-center",
        isActive && "animate-spin"
      )}
      style={{ 
        animationDuration: '3s',
        transformOrigin: 'center'
      }}
    />
    <circle 
      cx="19" cy="5" r="1.5" 
      fill="#FBBC05"
      className={cn("transition-all duration-500", isActive && "animate-ping")}
      style={{ animationDuration: '1.5s' }}
    />
    <circle 
      cx="5" cy="19" r="1" 
      fill="#34A853"
      className={cn("transition-all duration-500", isActive && "animate-ping")}
      style={{ animationDuration: '2s', animationDelay: '0.5s' }}
    />
  </svg>
);

// Animated Gemini Icon - glowing AI effect
export const AnimatedGeminiIcon: React.FC<AnimatedIconProps> = ({ className, isActive }) => (
  <svg className={cn("transition-all duration-300", className)} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="gemini-gradient-animated" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4285F4">
          <animate 
            attributeName="stop-color" 
            values="#4285F4;#9B72CB;#D96570;#4285F4" 
            dur="3s" 
            repeatCount="indefinite"
          />
        </stop>
        <stop offset="50%" stopColor="#9B72CB">
          <animate 
            attributeName="stop-color" 
            values="#9B72CB;#D96570;#4285F4;#9B72CB" 
            dur="3s" 
            repeatCount="indefinite"
          />
        </stop>
        <stop offset="100%" stopColor="#D96570">
          <animate 
            attributeName="stop-color" 
            values="#D96570;#4285F4;#9B72CB;#D96570" 
            dur="3s" 
            repeatCount="indefinite"
          />
        </stop>
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <circle 
      cx="12" cy="12" r="10" 
      fill="url(#gemini-gradient-animated)"
      className={cn(isActive && "animate-pulse")}
      filter={isActive ? "url(#glow)" : undefined}
    />
    <path 
      d="M12 6L14 10L18 12L14 14L12 18L10 14L6 12L10 10L12 6Z" 
      fill="white"
      className={cn(
        "transition-all duration-300 origin-center",
        isActive && "animate-pulse"
      )}
    />
  </svg>
);

// Animated Search Icon - magnifying glass zooming
export const AnimatedSearchIcon: React.FC<AnimatedIconProps> = ({ className, isActive }) => (
  <svg className={cn("transition-all duration-300", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle 
      cx="11" cy="11" r="8"
      className={cn(
        "transition-all duration-300",
        isActive && "animate-pulse"
      )}
    />
    <path 
      d="M21 21L16.65 16.65"
      strokeLinecap="round"
      className={cn(
        "transition-all duration-300 origin-bottom-right",
        isActive && "animate-bounce"
      )}
    />
  </svg>
);

// Animated Bell Icon - ringing notification
export const AnimatedBellIcon: React.FC<AnimatedIconProps> = ({ className, isActive }) => (
  <svg className={cn("transition-all duration-300", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path 
      d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
      className={cn(
        "transition-all duration-300 origin-top",
        isActive && "animate-wiggle"
      )}
      style={{ transformOrigin: 'top center' }}
    />
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

// Animated Send Icon - flying away effect
export const AnimatedSendIcon: React.FC<AnimatedIconProps> = ({ className, isActive }) => (
  <svg className={cn("transition-all duration-300", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path 
      d="M22 2L11 13"
      className={cn(
        "transition-all duration-300",
        isActive && "animate-pulse"
      )}
    />
    <path 
      d="M22 2L15 22L11 13L2 9L22 2Z"
      className={cn(
        "transition-all duration-500 origin-bottom-left",
        isActive && "animate-bounce"
      )}
    />
  </svg>
);

// Animated Loading Spinner with Gemini colors
export const AnimatedLoadingSpinner: React.FC<AnimatedIconProps> = ({ className }) => (
  <svg className={cn("animate-spin", className)} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="spinner-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4285F4"/>
        <stop offset="33%" stopColor="#9B72CB"/>
        <stop offset="66%" stopColor="#D96570"/>
        <stop offset="100%" stopColor="#4285F4"/>
      </linearGradient>
    </defs>
    <circle 
      cx="12" cy="12" r="10" 
      stroke="url(#spinner-gradient)" 
      strokeWidth="3" 
      strokeLinecap="round"
      strokeDasharray="40 60"
    />
  </svg>
);

// Animated Upload Icon - arrow bouncing up
export const AnimatedUploadIcon: React.FC<AnimatedIconProps> = ({ className, isActive }) => (
  <svg className={cn("transition-all duration-300", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <g className={cn("transition-all duration-300", isActive && "animate-bounce")}>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </g>
  </svg>
);

// Animated Trash Icon - shaking before delete
export const AnimatedTrashIcon: React.FC<AnimatedIconProps> = ({ className, isActive }) => (
  <svg 
    className={cn(
      "transition-all duration-300",
      isActive && "animate-wiggle",
      className
    )} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
  >
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);

// CSS for custom animations - add to index.css
export const animatedIconsCSS = `
@keyframes wiggle {
  0%, 100% { transform: rotate(-3deg); }
  50% { transform: rotate(3deg); }
}

.animate-wiggle {
  animation: wiggle 0.3s ease-in-out infinite;
}
`;
