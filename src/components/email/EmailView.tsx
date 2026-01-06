import React, { useState } from 'react';
import { Search, Mail, Sparkles, Send, CheckSquare, Paperclip, RotateCw } from 'lucide-react';
import { GoogleCard } from '../ui/GoogleCard';
import { GoogleButton } from '../ui/GoogleButton';
import { GeminiIcon } from '../icons/GoogleIcons';
import { EmailBodyRenderer } from './EmailBodyRenderer';
import type { Email } from '@/lib/api';
import { cn } from '@/lib/utils';

interface EmailViewProps {
  emails: Email[];
  selectedEmail: Email | null;
  onSelectEmail: (email: Email) => void;
  onGenerateReply: (email: Email) => Promise<void>;
  onExtractActions: (email: Email) => Promise<void>;
  onSendReply: (reply: string) => Promise<void>;
  aiReply: string;
  actionItems: string[];
  isProcessing: boolean;
  onReplyChange: (reply: string) => void;
}

const categoryConfig = {
  urgent: { 
    label: 'URGENT', 
    bg: 'bg-google-red/10', 
    text: 'text-google-red',
    border: 'border-google-red/30',
    dot: 'bg-google-red'
  },
  action: { 
    label: 'ACTION', 
    bg: 'bg-google-yellow/10', 
    text: 'text-google-yellow',
    border: 'border-google-yellow/30',
    dot: 'bg-google-yellow'
  },
  fyi: { 
    label: 'FYI', 
    bg: 'bg-google-blue/10', 
    text: 'text-google-blue',
    border: 'border-google-blue/30',
    dot: 'bg-google-blue'
  },
  later: { 
    label: 'LATER', 
    bg: 'bg-muted', 
    text: 'text-muted-foreground',
    border: 'border-border',
    dot: 'bg-muted-foreground'
  },
};

export const EmailView: React.FC<EmailViewProps> = ({
  emails,
  selectedEmail,
  onSelectEmail,
  onGenerateReply,
  onExtractActions,
  onSendReply,
  aiReply,
  actionItems,
  isProcessing,
  onReplyChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const filteredEmails = emails.filter(email => {
    const matchesSearch = email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         email.from.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = !filterCategory || email.category === filterCategory;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      {/* Email List */}
      <div className="lg:col-span-1">
        <GoogleCard padding="sm">
          <div className="p-2">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search emails..."
                className="w-full h-12 pl-12 pr-4 bg-secondary rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              <GoogleButton
                variant={filterCategory === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterCategory(null)}
              >
                All
              </GoogleButton>
              {Object.entries(categoryConfig).map(([key, config]) => (
                <GoogleButton
                  key={key}
                  variant={filterCategory === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterCategory(key)}
                >
                  {config.label}
                </GoogleButton>
              ))}
            </div>

            {/* Email List */}
            <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto">
              {filteredEmails.map((email) => {
                const config = categoryConfig[email.category] || categoryConfig.later;
                return (
                  <div
                    key={email.id}
                    onClick={() => {
                      onSelectEmail(email);
                      onExtractActions(email);
                    }}
                    className={cn(
                      "p-4 rounded-xl cursor-pointer transition-all duration-200",
                      selectedEmail?.id === email.id
                        ? "bg-accent border-2 border-primary shadow-google"
                        : "bg-card border border-border hover:bg-secondary hover:shadow-google"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={cn("text-sm font-medium truncate max-w-[60%]", email.unread && "font-semibold")}>
                        {email.from.split('<')[0].trim()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {email.date ? new Date(email.date).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                    <p className={cn("text-sm mb-2 truncate", email.unread && "font-medium")}>
                      {email.subject}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{email.snippet}</p>
                    <div className="flex items-center justify-between">
                      <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium border", config.bg, config.text, config.border)}>
                        {config.label}
                      </span>
                      {email.hasAttachment && <Paperclip className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>
                );
              })}
              {filteredEmails.length === 0 && (
                <div className="text-center py-12">
                  <Mail className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No emails found</p>
                </div>
              )}
            </div>
          </div>
        </GoogleCard>
      </div>

      {/* Email Detail */}
      <div className="lg:col-span-2">
        <GoogleCard>
          {selectedEmail ? (
            <div className="space-y-6">
              {/* Email Header */}
              <div className="border-b border-border pb-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-semibold text-foreground mb-2 truncate">{selectedEmail.subject}</h2>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span>From: {selectedEmail.from}</span>
                      <span>{selectedEmail.date ? new Date(selectedEmail.date).toLocaleString() : 'Recent'}</span>
                    </div>
                  </div>
                  <span className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border flex-shrink-0",
                    categoryConfig[selectedEmail.category]?.bg,
                    categoryConfig[selectedEmail.category]?.text,
                    categoryConfig[selectedEmail.category]?.border
                  )}>
                    {categoryConfig[selectedEmail.category]?.label}
                  </span>
                </div>
              </div>

              {/* Email Body */}
              <div className="max-w-none">
                <EmailBodyRenderer
                  subject={selectedEmail.subject}
                  bodyText={selectedEmail.bodyText || selectedEmail.body || selectedEmail.snippet}
                  bodyHtml={selectedEmail.bodyHtml}
                />
              </div>

              {/* Action Items */}
              {actionItems.length > 0 && (
                <div className="bg-google-blue/5 rounded-2xl p-6 border border-google-blue/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-google-blue/10 flex items-center justify-center">
                      <CheckSquare className="w-5 h-5 text-google-blue" />
                    </div>
                    <h3 className="font-semibold text-foreground">AI-Extracted Action Items</h3>
                  </div>
                  <ul className="space-y-2">
                    {actionItems.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3 p-3 bg-card rounded-xl">
                        <CheckSquare className="w-5 h-5 text-google-blue mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* AI Reply Section */}
              <div className="bg-gradient-to-br from-purple-500/5 via-google-blue/5 to-google-red/5 rounded-2xl p-6 border border-primary/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-google-blue via-purple-500 to-google-red flex items-center justify-center">
                      <GeminiIcon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-foreground">AI-Generated Reply</h3>
                  </div>
                  <GoogleButton
                    variant="blue"
                    size="sm"
                    onClick={() => onGenerateReply(selectedEmail)}
                    disabled={isProcessing}
                    className="gap-2"
                  >
                    {isProcessing ? (
                      <RotateCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {isProcessing ? 'Generating...' : 'Generate Reply'}
                  </GoogleButton>
                </div>

                {aiReply && (
                  <div className="space-y-4 animate-fade-in">
                    <textarea
                      className="w-full p-4 bg-card border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                      rows={8}
                      value={aiReply}
                      onChange={(e) => onReplyChange(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-3">
                      <GoogleButton
                        variant="blue"
                        onClick={() => onSendReply(aiReply)}
                        disabled={isProcessing}
                        className="gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Send Reply
                      </GoogleButton>
                      <GoogleButton variant="outline" onClick={() => onReplyChange('')}>
                        Clear
                      </GoogleButton>
                    </div>
                  </div>
                )}

                {isProcessing && !aiReply && (
                  <div className="flex items-center justify-center gap-3 py-8">
                    <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
                    <span className="text-muted-foreground font-medium">AI is crafting your response...</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-10 h-10 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">Select an email to view details</p>
                <p className="text-sm text-muted-foreground/70 mt-1">AI insights and replies will appear here</p>
              </div>
            </div>
          )}
        </GoogleCard>
      </div>
    </div>
  );
};
