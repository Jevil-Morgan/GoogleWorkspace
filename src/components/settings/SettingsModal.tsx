import React, { useState, useEffect } from 'react';
import { Moon, Sun, Bell, Shield, User, Palette, Globe, HelpCircle, X, Check, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import { GoogleButton } from '../ui/GoogleButton';
import { useTheme } from '@/hooks/use-theme';
import { toast } from 'sonner';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignOut: () => void;
}

type SettingsTab = 'appearance' | 'notifications' | 'account' | 'privacy' | 'help';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onOpenChange,
  onSignOut,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { setEnabled, isEnabled, playSuccess } = useSoundEffects();
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [settings, setSettings] = useState({
    emailNotifications: true,
    taskReminders: true,
    meetingAlerts: true,
    soundEnabled: isEnabled(),
    compactMode: false,
    language: 'en',
  });

  // Sync sound state
  useEffect(() => {
    setSettings(prev => ({ ...prev, soundEnabled: isEnabled() }));
  }, [open, isEnabled]);

  const tabs = [
    { id: 'appearance' as const, label: 'Appearance', icon: Palette },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'account' as const, label: 'Account', icon: User },
    { id: 'privacy' as const, label: 'Privacy', icon: Shield },
    { id: 'help' as const, label: 'Help', icon: HelpCircle },
  ];

  const handleSettingChange = (key: string, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // Handle sound toggle specifically
    if (key === 'soundEnabled') {
      setEnabled(value as boolean);
      if (value) {
        setTimeout(() => playSuccess(), 100); // Play a sound when enabling
      }
    }
    
    toast.success('Setting updated');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl">Settings</DialogTitle>
        </DialogHeader>
        
        <div className="flex min-h-[400px]">
          {/* Sidebar */}
          <div className="w-48 border-r border-border bg-secondary/30 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  activeTab === tab.id 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-4">Theme</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => theme === 'dark' && toggleTheme()}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all",
                        theme === 'light' 
                          ? "border-google-blue bg-google-blue/10" 
                          : "border-border hover:border-muted-foreground"
                      )}
                    >
                      <div className="w-full h-20 rounded-lg bg-white border border-gray-200 mb-3 flex items-center justify-center">
                        <Sun className="w-8 h-8 text-google-yellow" />
                      </div>
                      <p className="text-sm font-medium text-foreground">Light</p>
                    </button>
                    <button
                      onClick={() => theme === 'light' && toggleTheme()}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all",
                        theme === 'dark' 
                          ? "border-google-blue bg-google-blue/10" 
                          : "border-border hover:border-muted-foreground"
                      )}
                    >
                      <div className="w-full h-20 rounded-lg bg-gray-900 border border-gray-700 mb-3 flex items-center justify-center">
                        <Moon className="w-8 h-8 text-google-blue" />
                      </div>
                      <p className="text-sm font-medium text-foreground">Dark</p>
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-foreground mb-4">Display</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">Compact Mode</p>
                        <p className="text-xs text-muted-foreground">Show more content with less spacing</p>
                      </div>
                      <Switch
                        checked={settings.compactMode}
                        onCheckedChange={(checked) => handleSettingChange('compactMode', checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-foreground mb-4">Notification Preferences</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                    <div>
                      <p className="text-sm font-medium text-foreground">Email Notifications</p>
                      <p className="text-xs text-muted-foreground">Get notified about new emails</p>
                    </div>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                    <div>
                      <p className="text-sm font-medium text-foreground">Task Reminders</p>
                      <p className="text-xs text-muted-foreground">Reminders for due tasks</p>
                    </div>
                    <Switch
                      checked={settings.taskReminders}
                      onCheckedChange={(checked) => handleSettingChange('taskReminders', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                    <div>
                      <p className="text-sm font-medium text-foreground">Meeting Alerts</p>
                      <p className="text-xs text-muted-foreground">Alerts before meetings start</p>
                    </div>
                    <Switch
                      checked={settings.meetingAlerts}
                      onCheckedChange={(checked) => handleSettingChange('meetingAlerts', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                    <div className="flex items-center gap-3">
                      {settings.soundEnabled ? (
                        <Volume2 className="w-5 h-5 text-google-blue" />
                      ) : (
                        <VolumeX className="w-5 h-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-foreground">Sound Effects</p>
                        <p className="text-xs text-muted-foreground">Play sounds for clicks, notifications, and feedback</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.soundEnabled}
                      onCheckedChange={(checked) => handleSettingChange('soundEnabled', checked)}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-foreground mb-4">Account Settings</h3>
                
                <div className="p-4 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-google-blue to-google-green flex items-center justify-center">
                      <User className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Google Account</p>
                      <p className="text-sm text-muted-foreground">Connected via OAuth</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm text-foreground">Language</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-sm">English</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>
                </div>

                <div className="pt-4 border-t border-border">
                  <GoogleButton 
                    variant="destructive" 
                    className="w-full"
                    onClick={onSignOut}
                  >
                    Sign Out
                  </GoogleButton>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-foreground mb-4">Privacy & Security</h3>
                
                <div className="p-4 rounded-xl bg-google-green/10 border border-google-green/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-5 h-5 text-google-green" />
                    <span className="font-medium text-foreground">Data Security</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your data is encrypted and securely stored. We never share your personal information with third parties.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-secondary/50">
                    <p className="text-sm font-medium text-foreground mb-1">OAuth Permissions</p>
                    <p className="text-xs text-muted-foreground">
                      This app accesses your Gmail, Calendar, Drive, and Tasks via Google OAuth 2.0
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-secondary/50">
                    <p className="text-sm font-medium text-foreground mb-1">Data Storage</p>
                    <p className="text-xs text-muted-foreground">
                      Only OAuth tokens are stored. Your emails, files, and tasks remain in Google's servers.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'help' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-foreground mb-4">Help & Support</h3>
                
                <div className="space-y-3">
                  <a 
                    href="https://support.google.com/mail" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <p className="text-sm font-medium text-foreground">Gmail Help</p>
                    <p className="text-xs text-muted-foreground">Learn more about Gmail features</p>
                  </a>

                  <a 
                    href="https://support.google.com/calendar" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <p className="text-sm font-medium text-foreground">Calendar Help</p>
                    <p className="text-xs text-muted-foreground">Learn more about Google Calendar</p>
                  </a>

                  <a 
                    href="https://support.google.com/drive" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <p className="text-sm font-medium text-foreground">Drive Help</p>
                    <p className="text-xs text-muted-foreground">Learn more about Google Drive</p>
                  </a>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-google-blue/10 via-purple-500/10 to-google-red/10 border border-border">
                  <p className="text-sm font-medium text-foreground mb-1">Powered by Gemini AI</p>
                  <p className="text-xs text-muted-foreground">
                    This workspace uses Google's Gemini AI to help you manage emails, schedule meetings, and organize tasks.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
