import React, { useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

import { apiClient, ApiError, type Email, type CalendarEvent, type Task, type DriveFile, type TimeSlot } from '@/lib/api';
import { LoginScreen } from '@/components/auth/LoginScreen';
import { Header } from '@/components/layout/Header';
import { Sidebar, type TabType } from '@/components/layout/Sidebar';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { EmailView } from '@/components/email/EmailView';
import { CalendarView } from '@/components/calendar/CalendarView';
import { DocumentsView } from '@/components/documents/DocumentsView';
import { TasksView } from '@/components/tasks/TasksView';
import { SearchResultsView } from '@/components/search/SearchResultsView';
import { SummariesView, type SummaryChat } from '@/components/summaries/SummariesView';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { GeminiIntro } from '@/components/GeminiIntro';

import { Notification } from '@/components/layout/Header';

const Index: React.FC = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [needsReconnect, setNeedsReconnect] = useState(false);

  // Intro animation (plays once per session after data loads)
  const [showIntro, setShowIntro] = useState(false);

  // Search context
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [previousTab, setPreviousTab] = useState<TabType>('dashboard');

  // Data states
  const [emails, setEmails] = useState<Email[]>([]);
  const [allEmails, setAllEmails] = useState<Email[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<DriveFile[]>([]);
  const [allDocuments, setAllDocuments] = useState<DriveFile[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Summary chats
  const [summaryChats, setSummaryChats] = useState<SummaryChat[]>(() => {
    try {
      const raw = localStorage.getItem('workspace_summaryChats');
      return raw ? (JSON.parse(raw) as SummaryChat[]) : [];
    } catch {
      return [];
    }
  });
  const [activeSummaryChatId, setActiveSummaryChatId] = useState<string | null>(() => {
    return localStorage.getItem('workspace_activeSummaryChatId');
  });
  const [isSummarySending, setIsSummarySending] = useState(false);
  const [isCreatingSummaryChat, setIsCreatingSummaryChat] = useState(false);

  // Email-specific states
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [aiReply, setAiReply] = useState('');
  const [actionItems, setActionItems] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Check for auth on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userIdParam = params.get('userId');
    const storedUserId = localStorage.getItem('workspace_userId');

    if (userIdParam) {
      localStorage.setItem('workspace_userId', userIdParam);
      apiClient.setUserId(userIdParam);
      setAuthenticated(true);
      // Clean URL without breaking preview/custom domains
      window.history.replaceState({}, '', window.location.pathname);
    } else if (storedUserId) {
      apiClient.setUserId(storedUserId);
      setAuthenticated(true);
    } else {
      setIsLoading(false);
    }
  }, []);

  // Load data when authenticated
  useEffect(() => {
    if (authenticated) {
      loadAllData();
    }
  }, [authenticated]);

  // Play intro once per browser session (after initial data load)
  useEffect(() => {
    if (!authenticated) return;
    if (isLoading) return;

    const key = 'workspace_introPlayed';
    if (sessionStorage.getItem(key) === '1') return;

    sessionStorage.setItem(key, '1');
    setShowIntro(true);
  }, [authenticated, isLoading]);

  // persist summary chats
  useEffect(() => {
    localStorage.setItem('workspace_summaryChats', JSON.stringify(summaryChats));
  }, [summaryChats]);

  useEffect(() => {
    if (activeSummaryChatId) {
      localStorage.setItem('workspace_activeSummaryChatId', activeSummaryChatId);
    } else {
      localStorage.removeItem('workspace_activeSummaryChatId');
    }
  }, [activeSummaryChatId]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      // Load in parallel for faster startup
      const [emailsRes, eventsRes, tasksRes, docsRes] = await Promise.all([
        apiClient.getEmails().catch(() => ({ emails: [] })),
        apiClient.getCalendarEvents().catch(() => ({ events: [] })),
        apiClient.getTasks().catch(() => ({ tasks: [] })),
        apiClient.searchDrive().catch(() => ({ files: [] })),
      ]);

      setEmails(emailsRes.emails);
      setAllEmails(emailsRes.emails);
      setEvents(eventsRes.events);
      setTasks(tasksRes.tasks);
      setAllTasks(tasksRes.tasks);
      setDocuments(docsRes.files);
      setAllDocuments(docsRes.files);

      // Generate notifications from data
      const newNotifications: Notification[] = [];

      // Unread emails notification
      const unreadEmails = emailsRes.emails.filter((e: Email) => e.unread);
      if (unreadEmails.length > 0) {
        newNotifications.push({
          id: 'unread-emails',
          title: `You have ${unreadEmails.length} unread email${unreadEmails.length > 1 ? 's' : ''}`,
          time: 'Just now',
          read: false,
          type: 'email',
        });
      }

      // Urgent emails notification
      const urgentEmails = emailsRes.emails.filter((e: Email) => e.category === 'urgent');
      if (urgentEmails.length > 0) {
        newNotifications.push({
          id: 'urgent-emails',
          title: `${urgentEmails.length} urgent email${urgentEmails.length > 1 ? 's' : ''} need attention`,
          time: 'Just now',
          read: false,
          type: 'email',
        });
      }

      // Upcoming events notification
      const upcomingEvents = eventsRes.events.slice(0, 3);
      if (upcomingEvents.length > 0) {
        newNotifications.push({
          id: 'upcoming-events',
          title: `${upcomingEvents.length} upcoming event${upcomingEvents.length > 1 ? 's' : ''} this week`,
          time: 'Just now',
          read: true,
          type: 'calendar',
        });
      }

      // Pending tasks notification
      const pendingTasks = tasksRes.tasks.filter((t: Task) => !t.completed);
      if (pendingTasks.length > 0) {
        newNotifications.push({
          id: 'pending-tasks',
          title: `${pendingTasks.length} task${pendingTasks.length > 1 ? 's' : ''} pending`,
          time: 'Just now',
          read: true,
          type: 'task',
        });
      }

      setNotifications(newNotifications);
    } catch (error) {
      console.error('Error loading data:', error);

      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        setNeedsReconnect(true);
        toast.error('Connection needs permission — please reconnect.');
      } else {
        toast.error('Failed to load some data');
      }
    }
    setIsLoading(false);
  };

  const handleGlobalSearch = async (query: string) => {
    if (!query.trim()) return;

    setPreviousTab(activeTab);
    setGlobalSearchQuery(query.trim());
    setActiveTab('search');

    toast.info(`Searching for "${query}"...`);
    setIsProcessing(true);
    setIsSearchActive(true);

    try {
      // Search in documents
      const { files } = await apiClient.searchDrive(query);
      setDocuments(files);

      // Filter emails by query
      const filteredEmails = allEmails.filter(
        (e) =>
          e.subject.toLowerCase().includes(query.toLowerCase()) ||
          e.snippet.toLowerCase().includes(query.toLowerCase()) ||
          e.from.toLowerCase().includes(query.toLowerCase())
      );
      setEmails(filteredEmails);

      // Filter tasks by query
      const filteredTasks = allTasks.filter(
        (t) =>
          t.title.toLowerCase().includes(query.toLowerCase()) ||
          (t.notes && t.notes.toLowerCase().includes(query.toLowerCase()))
      );
      setTasks(filteredTasks);

      const totalResults = files.length + filteredEmails.length + filteredTasks.length;
      if (totalResults > 0) {
        toast.success(`Found ${totalResults} result${totalResults > 1 ? 's' : ''}`);
      } else {
        toast.info('No results found');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
    }
    setIsProcessing(false);
  };

  const handleClearSearch = async () => {
    setIsSearchActive(false);
    setGlobalSearchQuery('');
    setActiveTab(previousTab);

    setEmails(allEmails);
    setTasks(allTasks);

    // Reload documents
    try {
      const { files } = await apiClient.searchDrive();
      setDocuments(files);
      setAllDocuments(files);
    } catch {
      setDocuments(allDocuments);
    }
    toast.success('Search cleared');
  };

  const handleLogin = async () => {
    try {
      const { url } = await apiClient.getAuthUrl();
      window.location.href = url;
    } catch (error) {
      console.error('Auth error:', error);
      toast.error('Failed to initiate login');
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('workspace_userId');
    apiClient.setUserId(null);
    setAuthenticated(false);
    setNeedsReconnect(false);
    setEmails([]);
    setEvents([]);
    setTasks([]);
    setDocuments([]);
  };

  const handleSelectEmail = (email: Email) => {
    setSelectedEmail(email);
    setAiReply('');
    setActionItems([]);
  };

  const handleGenerateReply = async (email: Email) => {
    setIsProcessing(true);
    try {
      const { reply } = await apiClient.generateReply({
        subject: email.subject,
        body: email.body || email.snippet,
        from: email.from,
      });
      setAiReply(reply);
      toast.success('Reply generated!');
    } catch (error) {
      console.error('Generate reply error:', error);
      if (error instanceof ApiError && error.status === 429) {
        toast.error('AI is rate-limited right now — try again in a minute.');
      } else if (error instanceof ApiError && error.status === 402) {
        toast.error('AI credits exhausted.');
      } else if (error instanceof ApiError && error.status === 401) {
        setNeedsReconnect(true);
        toast.error('Connection expired. Please reconnect.');
      } else {
        toast.error('Failed to generate reply');
      }
    }
    setIsProcessing(false);
  };

  const handleExtractActions = async (email: Email) => {
    try {
      const { actionItems } = await apiClient.extractActions({
        subject: email.subject,
        body: email.body || email.snippet,
      });
      setActionItems(actionItems);
    } catch (error) {
      console.error('Extract actions error:', error);
      if (error instanceof ApiError && error.status === 429) {
        // stay quiet (avoid toast spam) for background extraction
        return;
      }
       if (error instanceof ApiError && error.status === 401) {
         setNeedsReconnect(true);
         toast.error('Connection expired. Please reconnect.');
       }
    }
  };

  const handleSendReply = async (reply: string) => {
    if (!selectedEmail) return;
    setIsProcessing(true);
    try {
      await apiClient.sendEmail({
        to: selectedEmail.from,
        subject: `Re: ${selectedEmail.subject}`,
        body: reply,
        threadId: selectedEmail.threadId,
      });
      toast.success('Email sent successfully!');
      setAiReply('');
    } catch (error) {
      console.error('Send email error:', error);
      toast.error('Failed to send email');
    }
    setIsProcessing(false);
  };

  const handleFindSlots = async (duration: number) => {
    setIsProcessing(true);
    try {
      const { availableSlots } = await apiClient.findAvailableSlots(duration, 7);
      setAvailableSlots(availableSlots);
    } catch (error) {
      console.error('Find slots error:', error);
      if (error instanceof ApiError && error.status === 401) {
        setNeedsReconnect(true);
        toast.error('Connection expired. Please reconnect.');
      } else {
        toast.error('Failed to find available slots');
      }
    }
    setIsProcessing(false);
  };

  const handleSearchDocs = async (query: string) => {
    setIsProcessing(true);
    setIsSearchActive(true);
    try {
      const { files } = await apiClient.searchDrive(query);
      setDocuments(files);
    } catch (error) {
      console.error('Search docs error:', error);
      toast.error('Failed to search documents');
    }
    setIsProcessing(false);
  };

  // New: Handle PDF upload and create summary chat
  const handleNewSummaryChat = async (file: File) => {
    setIsCreatingSummaryChat(true);
    try {
      // Convert file to base64 using FileReader (handles large files)
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix (e.g., "data:application/pdf;base64,")
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      // Call summarize with PDF data
      const { summary } = await apiClient.summarizePDF({
        fileName: file.name,
        fileData: base64,
      });

      // Create a new summary chat
      const chat: SummaryChat = {
        id: crypto.randomUUID(),
        title: `Summary: ${file.name}`,
        documentId: `local-${Date.now()}`,
        documentName: file.name,
        summary,
        createdAt: new Date().toISOString(),
        messages: [],
      };
      setSummaryChats((prev) => [chat, ...prev]);
      setActiveSummaryChatId(chat.id);
      
      toast.success('Summary created!');
    } catch (error) {
      console.error('Create summary error:', error);
      if (error instanceof ApiError && error.status === 429) {
        toast.error('AI is rate-limited right now — try again in a minute.');
      } else if (error instanceof ApiError && error.status === 402) {
        toast.error('AI credits exhausted.');
      } else if (error instanceof ApiError && error.status === 413) {
        toast.error('File is too large. Maximum size is 20MB.');
      } else {
        toast.error('Failed to create summary');
      }
      throw error;
    } finally {
      setIsCreatingSummaryChat(false);
    }
  };

  const handleCreateEvent = async (event: { title: string; start: string; end: string; description?: string; location?: string }) => {
    setIsProcessing(true);
    try {
      await apiClient.createCalendarEvent(event);
      const { events: updatedEvents } = await apiClient.getCalendarEvents();
      setEvents(updatedEvents);
    } catch (error) {
      console.error('Create event error:', error);
       if (error instanceof ApiError && error.status === 401) {
         setNeedsReconnect(true);
         toast.error('Connection expired. Please reconnect.');
       } else {
        toast.error('Failed to create event');
      }
      throw error;
    }
    setIsProcessing(false);
  };

  const handleExtractTasksFromEmail = async (email: Email): Promise<string[]> => {
    const { actionItems } = await apiClient.extractActions({
      subject: email.subject,
      body: email.body || email.snippet,
    });
    return actionItems;
  };

  const handleCreateTask = async (task: { title: string; notes?: string; due?: string }) => {
    setIsProcessing(true);
    try {
      await apiClient.createTask(task);
      const { tasks: updatedTasks } = await apiClient.getTasks();
      setTasks(updatedTasks);
      setAllTasks(updatedTasks);
      toast.success('Task created!');
     } catch (error) {
       console.error('Create task error:', error);
       if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
         setNeedsReconnect(true);
         toast.error('Please reconnect Google to manage tasks.');
       } else if (error instanceof ApiError) {
         toast.error(error.message || 'Failed to create task');
       } else {
         toast.error('Failed to create task');
       }
     }
    setIsProcessing(false);
  };

  const handleCompleteTask = async (taskId: string, completed: boolean) => {
    try {
      await apiClient.completeTask(taskId, completed);
      const { tasks: updatedTasks } = await apiClient.getTasks();
      setTasks(updatedTasks);
      setAllTasks(updatedTasks);
     } catch (error) {
       console.error('Complete task error:', error);
       if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
         setNeedsReconnect(true);
         toast.error('Please reconnect Google to update tasks.');
       }
       throw error;
     }
  };

  const handleDeleteTask = async (taskId: string) => {
    setIsProcessing(true);
    try {
      await apiClient.deleteTask(taskId);
      const { tasks: updatedTasks } = await apiClient.getTasks();
      setTasks(updatedTasks);
      setAllTasks(updatedTasks);
     } catch (error) {
       console.error('Delete task error:', error);
       if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
         setNeedsReconnect(true);
         toast.error('Please reconnect Google to delete tasks.');
       } else if (error instanceof ApiError) {
         toast.error(error.message || 'Failed to delete task');
       } else {
         toast.error('Failed to delete task');
       }
       throw error;
     } finally {
      setIsProcessing(false);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    switch (notification.type) {
      case 'email':
        setActiveTab('email');
        break;
      case 'task':
        setActiveTab('tasks');
        break;
      case 'calendar':
        setActiveTab('calendar');
        break;
      default:
        break;
    }
  };

  const handleSummarySend = async (chatId: string, userMessage: string) => {
    const chat = summaryChats.find((c) => c.id === chatId);
    if (!chat) return;

    setIsSummarySending(true);
    // optimistic add user message
    setSummaryChats((prev) =>
      prev.map((c) =>
        c.id === chatId ? { ...c, messages: [...c.messages, { role: 'user', content: userMessage }] } : c
      )
    );

    try {
      const nextMessages = [...(chat.messages ?? []), { role: 'user' as const, content: userMessage }];
      const { reply } = await apiClient.summaryChat({ summary: chat.summary, messages: nextMessages });

      setSummaryChats((prev) =>
        prev.map((c) =>
          c.id === chatId ? { ...c, messages: [...c.messages, { role: 'assistant', content: reply }] } : c
        )
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) toast.error('AI is rate-limited right now — try again in a minute.');
      else if (error instanceof ApiError && error.status === 402) toast.error('AI credits exhausted.');
      else if (error instanceof ApiError && error.status === 401) {
        setNeedsReconnect(true);
        toast.error('Connection expired. Please reconnect.');
      } else toast.error('Failed to send');
    }

    setIsSummarySending(false);
  };

  if (!authenticated) {
    return <LoginScreen onLogin={handleLogin} isLoading={isLoading} />;
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-background">
      <GeminiIntro show={showIntro} onDone={() => setShowIntro(false)} />
      <Toaster position="top-right" />
      <Header 
        onSignOut={handleSignOut} 
        onMenuToggle={() => setSidebarOpen(true)}
        onSearch={handleGlobalSearch}
        onClearSearch={handleClearSearch}
        isSearchActive={isSearchActive}
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
        needsReconnect={needsReconnect}
        onReconnect={handleLogin}
        userId={apiClient.getUserId()}
      />
      
      <div className="flex">
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        
        <main className="flex-1 p-4 md:p-6 max-w-7xl">
          {activeTab === 'search' && isSearchActive && (
            <SearchResultsView
              query={globalSearchQuery}
              emails={emails}
              documents={documents}
              onClear={handleClearSearch}
              onOpenEmail={(email) => {
                handleSelectEmail(email);
                setActiveTab('email');
                // kick off extraction in background
                handleExtractActions(email);
              }}
              onOpenDocument={(doc) => {
                setActiveTab('documents');
                window.open(doc.link, '_blank');
              }}
            />
          )}

          {activeTab === 'summaries' && (
            <SummariesView
              chats={summaryChats}
              activeChatId={activeSummaryChatId}
              onSelectChat={(id) => setActiveSummaryChatId(id)}
              onDeleteChat={(id) => {
                setSummaryChats((prev) => prev.filter((c) => c.id !== id));
                if (activeSummaryChatId === id) setActiveSummaryChatId(null);
                toast.success('Chat deleted');
              }}
              onNewChat={handleNewSummaryChat}
              onSend={handleSummarySend}
              isSending={isSummarySending}
              isCreatingChat={isCreatingSummaryChat}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              emails={emails}
              events={events}
              tasks={tasks}
              onViewEmail={() => setActiveTab('email')}
              onViewCalendar={() => setActiveTab('calendar')}
              onViewTasks={() => setActiveTab('tasks')}
            />
          )}

          {activeTab === 'email' && (
            <EmailView
              emails={emails}
              selectedEmail={selectedEmail}
              onSelectEmail={handleSelectEmail}
              onGenerateReply={handleGenerateReply}
              onExtractActions={handleExtractActions}
              onSendReply={handleSendReply}
              aiReply={aiReply}
              actionItems={actionItems}
              isProcessing={isProcessing}
              onReplyChange={setAiReply}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarView
              events={events}
              availableSlots={availableSlots}
              onFindSlots={handleFindSlots}
              onCreateEvent={handleCreateEvent}
              isLoading={isProcessing}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentsView
              documents={documents}
              onSearch={handleSearchDocs}
              onClearSearch={handleClearSearch}
              isLoading={isProcessing}
              isSearchActive={isSearchActive}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksView
              tasks={tasks}
              emails={emails}
              events={events}
              onCreateTask={handleCreateTask}
              onExtractTasksFromEmail={handleExtractTasksFromEmail}
              onCompleteTask={handleCompleteTask}
              onDeleteTask={handleDeleteTask}
              isLoading={isProcessing}
              onRequestPermission={needsReconnect ? handleLogin : undefined}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
