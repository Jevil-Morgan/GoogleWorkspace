const API_BASE = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export interface Email {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  snippet: string;
  /** Plain text (used for quick preview + AI features). */
  body: string;
  /** Full plain text when available. */
  bodyText?: string;
  /** Raw HTML body when available (rendered in the UI). */
  bodyHtml?: string | null;
  date: string;
  unread: boolean;
  hasAttachment: boolean;
  category: 'urgent' | 'action' | 'fyi' | 'later';
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  attendees: number;
  description?: string;
}

export interface Task {
  id: string;
  title: string;
  notes?: string;
  due?: string;
  completed: boolean;
}

export interface DriveFile {
  id: string;
  name: string;
  type: string;
  modified: string;
  size: string;
  link: string;
}

export interface TimeSlot {
  start: string;
  end: string;
}

class ApiClient {
  private userId: string | null = null;

  setUserId(userId: string | null) {
    this.userId = userId;
  }

  getUserId() {
    return this.userId;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      // Supabase Functions expect apikey/Authorization even when verify_jwt=false
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      ...(options.headers as Record<string, string>),
    };

    if (this.userId) {
      headers['x-user-id'] = this.userId;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const text = await response.text();
    const maybeJson = (() => {
      try {
        return text ? JSON.parse(text) : null;
      } catch {
        return null;
      }
    })();

    if (!response.ok) {
      const message =
        (maybeJson && typeof maybeJson === 'object' && 'error' in (maybeJson as any) && (maybeJson as any).error) ||
        response.statusText ||
        'Request failed';
      throw new ApiError(response.status, String(message), maybeJson ?? text);
    }

    return (maybeJson ?? ({} as any)) as T;
  }

  async getAuthUrl(): Promise<{ url: string }> {
    // Pass current origin so callback knows where to redirect
    return this.request('/google-auth/url', {
      method: 'POST',
      body: JSON.stringify({ origin: window.location.origin }),
    });
  }

  async getEmails(): Promise<{ emails: Email[] }> {
    return this.request('/google-emails');
  }

  async generateReply(email: { subject: string; body: string; from: string }): Promise<{ reply: string }> {
    return this.request('/google-emails/generate-reply', {
      method: 'POST',
      body: JSON.stringify(email),
    });
  }

  async extractActions(email: { subject: string; body: string }): Promise<{ actionItems: string[] }> {
    return this.request('/google-emails/extract-actions', {
      method: 'POST',
      body: JSON.stringify(email),
    });
  }

  async sendEmail(data: { to: string; subject: string; body: string; threadId?: string }): Promise<{ success: boolean }> {
    return this.request('/google-emails/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCalendarEvents(): Promise<{ events: CalendarEvent[] }> {
    return this.request('/google-calendar/events');
  }

  async findAvailableSlots(
    duration?: number,
    days?: number,
    opts?: { startHour?: number; endHour?: number }
  ): Promise<{ availableSlots: TimeSlot[] }> {
    const tzOffsetMinutes = new Date().getTimezoneOffset();
    return this.request('/google-calendar/find-slots', {
      method: 'POST',
      body: JSON.stringify({
        duration,
        days,
        startHour: opts?.startHour ?? 4,
        endHour: opts?.endHour ?? 21,
        tzOffsetMinutes,
      }),
    });
  }

  async createCalendarEvent(event: { title: string; start: string; end: string; description?: string; location?: string }): Promise<{ event: CalendarEvent }> {
    return this.request('/google-calendar/create-event', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  }

  async searchDrive(query?: string): Promise<{ files: DriveFile[] }> {
    const params = query ? `?query=${encodeURIComponent(query)}` : '';
    return this.request(`/google-drive${params}`);
  }

  async summarizeDocument(doc: { documentId: string; documentName: string; documentType: string }): Promise<{ summary: string }> {
    return this.request('/summarize-document', {
      method: 'POST',
      body: JSON.stringify(doc),
    });
  }

  async summarizePDF(data: { fileName: string; fileData: string }): Promise<{ summary: string }> {
    return this.request('/summarize-document', {
      method: 'POST',
      body: JSON.stringify({
        documentType: 'pdf',
        documentName: data.fileName,
        fileData: data.fileData,
      }),
    });
  }

  async summaryChat(body: {
    summary: string;
    messages: { role: 'user' | 'assistant'; content: string }[];
  }): Promise<{ reply: string }> {
    return this.request('/summary-chat', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async getTasks(): Promise<{ tasks: Task[] }> {
    return this.request('/google-tasks');
  }

  async createTask(task: { title: string; notes?: string; due?: string }): Promise<{ task: Task }> {
    return this.request('/google-tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async completeTask(taskId: string, completed: boolean): Promise<{ task: Task }> {
    return this.request('/google-tasks', {
      method: 'PATCH',
      body: JSON.stringify({ taskId, completed }),
    });
  }

  async deleteTask(taskId: string): Promise<{ success: boolean }> {
    const params = `?taskId=${encodeURIComponent(taskId)}`;
    return this.request(`/google-tasks${params}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();
