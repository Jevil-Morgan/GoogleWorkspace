import React from 'react';

export const GmailIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6Z" fill="#EA4335"/>
    <path d="M22 6L12 13L2 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 6L12 13L22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6Z" fill="#FBBC05" fillOpacity="0.3"/>
  </svg>
);

export const CalendarIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="4" width="18" height="18" rx="2" fill="#4285F4"/>
    <path d="M3 9H21" stroke="white" strokeWidth="1.5"/>
    <rect x="3" y="4" width="18" height="5" rx="2" fill="#1A73E8"/>
    <circle cx="8" cy="14" r="1.5" fill="white"/>
    <circle cx="12" cy="14" r="1.5" fill="white"/>
    <circle cx="16" cy="14" r="1.5" fill="white"/>
  </svg>
);

export const DriveIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path d="M8 4L2 14H8L14 4H8Z" fill="#0066DA"/>
    <path d="M14 4L8 14H14L20 4H14Z" fill="#00AC47"/>
    <path d="M8 14L2 14L5 20H11L8 14Z" fill="#EA4335"/>
    <path d="M14 14L8 14L11 20H17L14 14Z" fill="#00832D"/>
    <path d="M14 14H20L17 20H11L14 14Z" fill="#2684FC"/>
    <path d="M20 4L14 14H20L22 10L20 4Z" fill="#FFBA00"/>
  </svg>
);

export const TasksIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="2" fill="#4285F4"/>
    <path d="M8 12L10.5 14.5L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const GeminiIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="gemini-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4285F4"/>
        <stop offset="50%" stopColor="#9B72CB"/>
        <stop offset="100%" stopColor="#D96570"/>
      </linearGradient>
    </defs>
    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" fill="url(#gemini-gradient)"/>
    <path d="M12 6L14 10L18 12L14 14L12 18L10 14L6 12L10 10L12 6Z" fill="white"/>
  </svg>
);

export const GoogleLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);
