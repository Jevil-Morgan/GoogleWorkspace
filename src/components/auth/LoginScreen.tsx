import React from 'react';
import { Mail, Calendar, FileText, CheckSquare, Sparkles, Shield, Zap } from 'lucide-react';
import { GoogleButton } from '../ui/GoogleButton';
import { GoogleLogo, GeminiIcon } from '../icons/GoogleIcons';

interface LoginScreenProps {
  onLogin: () => void;
  isLoading?: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, isLoading }) => {
  const features = [
    {
      icon: <Mail className="w-5 h-5" />,
      title: 'Email Intelligence',
      description: 'Auto-categorize, draft replies, extract actions',
      color: 'text-google-red',
      bg: 'bg-google-red/10',
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      title: 'Smart Scheduling',
      description: 'Find optimal times, manage conflicts',
      color: 'text-google-blue',
      bg: 'bg-google-blue/10',
    },
    {
      icon: <FileText className="w-5 h-5" />,
      title: 'Document Search',
      description: 'AI-powered search across Drive',
      color: 'text-google-green',
      bg: 'bg-google-green/10',
    },
    {
      icon: <CheckSquare className="w-5 h-5" />,
      title: 'Task Automation',
      description: 'Create and prioritize tasks automatically',
      color: 'text-google-yellow',
      bg: 'bg-google-yellow/10',
    },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-google-blue via-purple-600 to-google-red p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary-foreground/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <GeminiIcon className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary-foreground">Workspace Agent</h1>
              <p className="text-primary-foreground/80 text-sm">Powered by Gemini AI</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-bold text-primary-foreground leading-tight">
            Your intelligent<br />productivity<br />companion
          </h2>
          <p className="text-primary-foreground/80 text-lg max-w-md">
            Manage your entire Google Workspace with AI-powered insights, smart automation, and seamless integration.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-primary-foreground/60 text-sm">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>Secure OAuth 2.0</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span>Real-time sync</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-google-blue via-purple-500 to-google-red mb-6 shadow-google-lg">
              <GeminiIcon className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Welcome back</h1>
            <p className="text-muted-foreground">Connect your Google account to get started</p>
          </div>

          <div className="space-y-4 mb-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 rounded-2xl bg-card border border-border shadow-google hover:shadow-google-hover transition-all duration-200 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`w-10 h-10 rounded-xl ${feature.bg} flex items-center justify-center flex-shrink-0`}>
                  <span className={feature.color}>{feature.icon}</span>
                </div>
                <div>
                  <h3 className="font-medium text-foreground text-sm">{feature.title}</h3>
                  <p className="text-muted-foreground text-xs mt-0.5">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          <GoogleButton
            variant="google"
            size="xl"
            className="w-full gap-3"
            onClick={onLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
            ) : (
              <GoogleLogo className="w-5 h-5" />
            )}
            <span>{isLoading ? 'Connecting...' : 'Continue with Google'}</span>
          </GoogleButton>

          <p className="text-xs text-muted-foreground text-center mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};
