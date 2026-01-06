import React, { useState } from 'react';
import { Search, Bell, Settings, LogOut, Menu, X } from 'lucide-react';
import { GeminiIcon } from '../icons/GoogleIcons';
import { GoogleButton } from '../ui/GoogleButton';
import { SettingsModal } from '../settings/SettingsModal';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export interface Notification {
  id: string;
  title: string;
  time: string;
  read: boolean;
  type: 'email' | 'task' | 'calendar' | 'general';
}

interface HeaderProps {
  onSignOut: () => void;
  onMenuToggle?: () => void;
  onSearch?: (query: string) => void;
  onClearSearch?: () => void;
  isSearchActive?: boolean;
  notifications?: Notification[];
  onNotificationClick?: (notification: Notification) => void;
  needsReconnect?: boolean;
  onReconnect?: () => void;
  userId?: string | null;
}

export const Header: React.FC<HeaderProps> = ({ 
  onSignOut, 
  onMenuToggle,
  onSearch,
  onClearSearch,
  isSearchActive = false,
  notifications = [],
  onNotificationClick,
  needsReconnect = false,
  onReconnect,
  userId = null,
}) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery.trim());
      setSearchOpen(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    onClearSearch?.();
  };

  const handleNotificationClick = (notif: Notification) => {
    onNotificationClick?.(notif);
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between h-16 px-4 md:px-6">
          <div className="flex items-center gap-4">
            {onMenuToggle && (
              <GoogleButton
                variant="ghost"
                size="icon"
                onClick={onMenuToggle}
                className="md:hidden"
              >
                <Menu className="w-5 h-5" />
              </GoogleButton>
            )}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-google-blue via-purple-500 to-google-red flex items-center justify-center">
                <GeminiIcon className="w-6 h-6" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-medium text-foreground">Workspace Agent</h1>
                <p className="text-xs text-muted-foreground">Powered by Gemini AI</p>
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-xl mx-4 hidden md:block">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across emails, documents, and tasks..."
                className="w-full h-12 pl-12 pr-4 bg-secondary rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
              {isSearchActive && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </form>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile search button */}
            <GoogleButton 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="w-5 h-5" />
            </GoogleButton>

            {/* Notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <GoogleButton variant="ghost" size="icon" className="relative hidden sm:flex">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </GoogleButton>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b border-border">
                  <h3 className="font-medium text-foreground">Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <button 
                        key={notif.id} 
                        onClick={() => handleNotificationClick(notif)}
                        className={`w-full text-left p-4 border-b border-border last:border-0 hover:bg-secondary/50 cursor-pointer transition-colors ${!notif.read ? 'bg-accent/30' : ''}`}
                      >
                        <p className="text-sm text-foreground">{notif.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{notif.time}</p>
                      </button>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Settings */}
            <GoogleButton 
              variant="ghost" 
              size="icon" 
              className="hidden sm:flex"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="w-5 h-5" />
            </GoogleButton>

            <GoogleButton
              variant="outline"
              size="sm"
              onClick={onSignOut}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </GoogleButton>
          </div>
        </div>

        {needsReconnect && (
          <div className="border-t border-border bg-accent/30">
            <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6">
              <p className="text-sm text-foreground">
                Connection expired — some features may fail until you reconnect.
              </p>
              <GoogleButton variant="blue" size="sm" onClick={onReconnect}>
                Reconnect
              </GoogleButton>
            </div>
          </div>
        )}
      </header>

      {/* Mobile search dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Search</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search emails, documents, tasks..."
              autoFocus
            />
            <GoogleButton type="submit">Search</GoogleButton>
          </form>
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <SettingsModal 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen}
        onSignOut={onSignOut}
      />
    </>
  );
};
