import React from 'react';
import { LayoutDashboard, Mail, Calendar, FolderOpen, CheckSquare, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GoogleButton } from '../ui/GoogleButton';
import { 
  AnimatedDashboardIcon, 
  AnimatedGmailIcon, 
  AnimatedCalendarIcon, 
  AnimatedDriveIcon, 
  AnimatedTasksIcon,
  AnimatedSparklesIcon 
} from '../icons/AnimatedIcons';
import { useSoundEffects } from '@/hooks/useSoundEffects';

export type TabType = 'dashboard' | 'email' | 'calendar' | 'documents' | 'tasks' | 'summaries' | 'search';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems: { id: TabType; label: string; icon: React.ReactNode; AnimatedIcon: React.FC<{className?: string; isActive?: boolean}> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, AnimatedIcon: AnimatedDashboardIcon },
  { id: 'email', label: 'Email Intelligence', icon: <Mail className="w-5 h-5" />, AnimatedIcon: AnimatedGmailIcon },
  { id: 'calendar', label: 'Smart Calendar', icon: <Calendar className="w-5 h-5" />, AnimatedIcon: AnimatedCalendarIcon },
  { id: 'documents', label: 'Documents', icon: <FolderOpen className="w-5 h-5" />, AnimatedIcon: AnimatedDriveIcon },
  { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="w-5 h-5" />, AnimatedIcon: AnimatedTasksIcon },
  { id: 'summaries', label: 'Summaries', icon: <FileText className="w-5 h-5" />, AnimatedIcon: ({ className, isActive }) => <FileText className={cn("w-5 h-5 text-google-green", className, isActive && "animate-pulse")} /> },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, isOpen, onClose }) => {
  const { playClick, playTabSwitch, playHover } = useSoundEffects();

  const handleTabChange = (tab: TabType) => {
    if (tab !== activeTab) {
      playTabSwitch();
    }
    onTabChange(tab);
    onClose?.();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      <aside className={cn(
        "fixed md:sticky top-0 md:top-16 left-0 z-50 md:z-0 h-screen md:h-[calc(100vh-4rem)] w-64 bg-card border-r border-border transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-6 md:hidden">
            <span className="font-medium text-foreground">Navigation</span>
            <GoogleButton variant="ghost" size="icon-sm" onClick={() => { playClick(); onClose?.(); }}>
              <X className="w-5 h-5" />
            </GoogleButton>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  onMouseEnter={playHover}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-all duration-200 btn-press",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground hover-lift"
                  )}
                >
                  <item.AnimatedIcon className="w-5 h-5" isActive={isActive} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-8 p-4 bg-gradient-to-br from-google-blue/10 via-purple-500/10 to-google-red/10 rounded-2xl border border-border">
            <div className="flex items-center gap-2 mb-2">
              <AnimatedSparklesIcon className="w-4 h-4" isActive />
              <span className="text-sm font-medium text-foreground">AI Insights</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Your productivity score is <span className="text-google-green font-medium">87%</span> this week
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
