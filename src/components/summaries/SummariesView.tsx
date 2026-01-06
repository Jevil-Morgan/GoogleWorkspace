import React, { useMemo, useState, useRef } from "react";
import { MessageSquarePlus, Send, FileText, ChevronRight, Trash2, Upload, File } from "lucide-react";
import { GoogleCard, GoogleCardContent, GoogleCardHeader, GoogleCardTitle } from "@/components/ui/GoogleCard";
import { GoogleButton } from "@/components/ui/GoogleButton";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { AnimatedSparklesIcon, AnimatedUploadIcon, AnimatedSendIcon, AnimatedLoadingSpinner } from "@/components/icons/AnimatedIcons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export type SummaryChatMessage = { role: "user" | "assistant"; content: string };

export type SummaryChat = {
  id: string;
  title: string;
  documentId: string;
  documentName: string;
  summary: string;
  createdAt: string;
  messages: SummaryChatMessage[];
};

interface SummariesViewProps {
  chats: SummaryChat[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onNewChat: (file: File) => Promise<void>;
  onSend: (chatId: string, userMessage: string) => Promise<void>;
  isSending: boolean;
  isCreatingChat: boolean;
}

export function SummariesView({
  chats,
  activeChatId,
  onSelectChat,
  onDeleteChat,
  onNewChat,
  onSend,
  isSending,
  isCreatingChat,
}: SummariesViewProps) {
  const activeChat = useMemo(
    () => chats.find((c) => c.id === activeChatId) ?? null,
    [chats, activeChatId]
  );
  const [input, setInput] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    if (!activeChat || !input.trim()) return;
    const msg = input.trim();
    setInput("");
    await onSend(activeChat.id, msg);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please select a PDF file');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please select a PDF file');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleCreateChat = async () => {
    if (!selectedFile) {
      toast.error('Please select a PDF file first');
      return;
    }
    
    try {
      await onNewChat(selectedFile);
      setShowUploadModal(false);
      setSelectedFile(null);
    } catch (error) {
      // Error handled in parent
    }
  };

  const openUploadModal = () => {
    setSelectedFile(null);
    setShowUploadModal(true);
  };

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-summaries">
      <GoogleCard className="lg:col-span-1 animate-chat-bubble">
        <GoogleCardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-google-blue via-purple-500 to-google-red flex items-center justify-center">
                <AnimatedSparklesIcon className="w-5 h-5" isActive />
              </div>
              <GoogleCardTitle>AI Summaries</GoogleCardTitle>
            </div>
            <GoogleButton variant="blue" size="sm" className="gap-2" onClick={openUploadModal}>
              <MessageSquarePlus className="w-4 h-4" />
              New
            </GoogleButton>
          </div>
        </GoogleCardHeader>
        <GoogleCardContent>
          {chats.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">No summary chats yet.</p>
              <GoogleButton variant="blue" size="sm" className="gap-2" onClick={openUploadModal}>
                <Upload className="w-4 h-4" />
                Upload PDF
              </GoogleButton>
            </div>
          ) : (
            <div className="space-y-2">
              {chats
                .slice()
                .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
                .map((c, idx) => (
                  <div
                    key={c.id}
                    className={cn(
                      "relative group p-4 rounded-xl border border-border transition-colors cursor-pointer animate-chat-bubble",
                      c.id === activeChatId ? "bg-accent/40" : "bg-secondary/50 hover:bg-secondary"
                    )}
                    style={{ animationDelay: `${idx * 50}ms` }}
                    onClick={() => onSelectChat(c.id)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(c.id);
                      }}
                      className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all"
                      title="Delete chat"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                    <p className="text-sm font-medium text-foreground truncate pr-8">{c.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{c.documentName}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</p>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </GoogleCardContent>
      </GoogleCard>

      <GoogleCard className="lg:col-span-2 animate-chat-bubble" style={{ animationDelay: '100ms' }}>
        <GoogleCardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <GoogleCardTitle>{activeChat ? activeChat.title : "Summary chat"}</GoogleCardTitle>
              <p className="text-sm text-muted-foreground">
                {activeChat ? "Ask questions about the document." : "Select a chat or upload a PDF."}
              </p>
            </div>
          </div>
        </GoogleCardHeader>
        <GoogleCardContent>
          {!activeChat ? (
            <div className="py-16 text-center">
              <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                <FileText className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium mb-2">No chat selected</p>
              <p className="text-sm text-muted-foreground/70 mb-4">Upload a PDF to create an AI summary and chat</p>
              <GoogleButton variant="blue" className="gap-2" onClick={openUploadModal}>
                <Upload className="w-4 h-4" />
                Upload PDF
              </GoogleButton>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-google-blue/10 via-purple-500/10 to-google-red/10 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <AnimatedSparklesIcon className="w-5 h-5" isActive />
                  <span className="font-medium text-foreground">AI Summary</span>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">{activeChat.summary}</p>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {activeChat.messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Ask your first question about this document below.</p>
                ) : (
                  activeChat.messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "p-4 rounded-xl border border-border animate-chat-bubble",
                        m.role === "user" ? "bg-google-blue/10" : "bg-card"
                      )}
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        {m.role === "user" ? "You" : "AI Assistant"}
                      </p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{m.content}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question about the document..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSend();
                  }}
                  disabled={isSending}
                />
                <GoogleButton variant="blue" className="gap-2" onClick={handleSend} disabled={!input.trim() || isSending}>
                  <Send className="w-4 h-4" />
                  {isSending ? "Sending..." : "Send"}
                </GoogleButton>
              </div>
            </div>
          )}
        </GoogleCardContent>
      </GoogleCard>

      {/* Upload PDF Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-google-blue via-purple-500 to-google-red flex items-center justify-center">
                <Upload className="w-5 h-5 text-primary-foreground" />
              </div>
              Upload PDF for AI Summary
            </DialogTitle>
            <DialogDescription>
              Select a PDF file to generate an AI summary and start a conversation
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {/* Drop zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                isDragging 
                  ? "border-primary bg-primary/10" 
                  : "border-border hover:border-primary/50 hover:bg-secondary/50"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {selectedFile ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-google-red/10 flex items-center justify-center">
                    <File className="w-8 h-8 text-google-red" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <GoogleButton 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                  >
                    Choose Different File
                  </GoogleButton>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Drop your PDF here</p>
                    <p className="text-sm text-muted-foreground">or click to browse</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <GoogleButton variant="outline" onClick={() => setShowUploadModal(false)}>
                Cancel
              </GoogleButton>
              <GoogleButton 
                variant="blue" 
                className="gap-2"
                onClick={handleCreateChat}
                disabled={!selectedFile || isCreatingChat}
              >
                {isCreatingChat ? (
                  <AnimatedLoadingSpinner className="w-4 h-4" />
                ) : (
                  <AnimatedSparklesIcon className="w-4 h-4" />
                )}
                {isCreatingChat ? "Creating Summary..." : "Create Summary"}
              </GoogleButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
