import React, { useEffect, useMemo, useState } from 'react';
import { CheckSquare, Plus, Calendar, Star, MoreHorizontal, Sparkles, Mail, Video, Bell, Zap, Info, Trash2, Check } from 'lucide-react';
import { GoogleCard, GoogleCardHeader, GoogleCardTitle, GoogleCardContent } from '../ui/GoogleCard';
import { GoogleButton } from '../ui/GoogleButton';
import { TasksIcon } from '../icons/GoogleIcons';
import { ApiError, type Task, type Email, type CalendarEvent } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TasksViewProps {
  tasks: Task[];
  emails: Email[];
  events: CalendarEvent[];
  onCreateTask: (task: { title: string; notes?: string; due?: string }) => Promise<void>;
  onExtractTasksFromEmail: (email: Email) => Promise<string[]>;
  onCompleteTask: (taskId: string, completed: boolean) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  isLoading: boolean;
  onRequestPermission?: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  emails,
  events,
  onCreateTask,
  onExtractTasksFromEmail,
  onCompleteTask,
  onDeleteTask,
  isLoading,
  onRequestPermission,
}) => {
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', notes: '', due: '' });
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedTasks, setExtractedTasks] = useState<string[]>([]);
  const [completingTask, setCompletingTask] = useState<string | null>(null);
  const [deletingTask, setDeletingTask] = useState<string | null>(null);
  const [showCheckmark, setShowCheckmark] = useState<string | null>(null);
  const [fadingOutTask, setFadingOutTask] = useState<string | null>(null);

  const [favorites, setFavorites] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem('workspace_taskFavorites');
      return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('workspace_taskFavorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (taskId: string) => {
    setFavorites((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const isTaskFavorited = useMemo(() => {
    return (taskId: string) => Boolean(favorites[taskId]);
  }, [favorites]);

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return;
    try {
      await onCreateTask(newTask);
      setNewTask({ title: '', notes: '', due: '' });
      setShowAddTask(false);
    } catch (error) {
      // Error handled in parent
    }
  };

  const handleCompleteTask = async (task: Task) => {
    if (task.completed) {
      // Just reopen
      setCompletingTask(task.id);
      try {
        await onCompleteTask(task.id, false);
        toast.success('Task reopened');
      } catch (error) {
        if (error instanceof ApiError) {
          toast.error(error.message || 'Failed to update task');
        } else {
          toast.error('Failed to update task');
        }
      }
      setCompletingTask(null);
      return;
    }

    // Mark as complete with animation
    setCompletingTask(task.id);
    setShowCheckmark(task.id);
    
    try {
      await onCompleteTask(task.id, true);
      
      // Show checkmark for 2 seconds, then fade out
      setTimeout(() => {
        setShowCheckmark(null);
        setFadingOutTask(task.id);
        
        // After fade animation, the task will be in completed list from parent state
        setTimeout(() => {
          setFadingOutTask(null);
        }, 300);
      }, 2000);
      
      toast.success('Task completed!');
    } catch (error) {
      setShowCheckmark(null);
      if (error instanceof ApiError) {
        toast.error(error.message || 'Failed to update task');
      } else {
        toast.error('Failed to update task');
      }
    }
    setCompletingTask(null);
  };

  const handleDeleteTask = async (task: Task) => {
    setDeletingTask(task.id);
    try {
      await onDeleteTask(task.id);
      toast.success('Task deleted');
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || 'Failed to delete task');
      } else {
        toast.error('Failed to delete task');
      }
    }
    setDeletingTask(null);
  };

  const handleExtractFromEmails = async () => {
    setIsExtracting(true);
    setExtractedTasks([]);
    
    try {
      const actionEmails = emails.filter(e => e.category === 'action' || e.category === 'urgent').slice(0, 3);
      
      if (actionEmails.length === 0) {
        toast.info('No action-required emails found');
        setIsExtracting(false);
        return;
      }

      const allTasks: string[] = [];
      for (const email of actionEmails) {
        try {
          const tasks = await onExtractTasksFromEmail(email);
          allTasks.push(...tasks);
        } catch (error) {
          // Continue with other emails
          console.error('Failed to extract from email:', error);
        }
      }

      setExtractedTasks(allTasks);
      if (allTasks.length > 0) {
        toast.success(`Found ${allTasks.length} potential tasks!`);
      } else {
        toast.info('No tasks extracted from emails');
      }
    } catch (error) {
      toast.error('Failed to extract tasks');
    }
    setIsExtracting(false);
  };

  const handleCreateExtractedTask = async (taskTitle: string) => {
    try {
      await onCreateTask({ title: taskTitle });
      setExtractedTasks(prev => prev.filter(t => t !== taskTitle));
      toast.success('Task created!');
    } catch (error) {
      // Error handled in parent
    }
  };

  const pendingTasks = tasks.filter(t => !t.completed && fadingOutTask !== t.id);
  const completedTasks = tasks.filter(t => t.completed);

  const urgentTasks = pendingTasks.filter(t => {
    if (!t.due) return false;
    const dueDate = new Date(t.due);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate <= today;
  });

  const upcomingMeetings = events.slice(0, 3);

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-tasks">
        {/* Task List */}
        <div className="lg:col-span-2">
          <GoogleCard>
            <GoogleCardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-google-blue/10 flex items-center justify-center">
                  <TasksIcon className="w-5 h-5" />
                </div>
                <GoogleCardTitle>My Tasks</GoogleCardTitle>
              </div>
              <div className="flex items-center gap-2">
                {onRequestPermission && (
                  <GoogleButton 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={onRequestPermission}
                  >
                    <Bell className="w-4 h-4" />
                    Sync
                  </GoogleButton>
                )}
                <GoogleButton 
                  variant="blue" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => setShowAddTask(true)}
                >
                  <Plus className="w-4 h-4" />
                  Add Task
                </GoogleButton>
              </div>
            </GoogleCardHeader>
            <GoogleCardContent>
              {/* Add Task Form */}
              {showAddTask && (
                <div className="mb-6 p-4 rounded-xl bg-secondary/50 border border-border animate-scale-in">
                  <input
                    type="text"
                    placeholder="Task title"
                    className="w-full p-3 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 mb-3"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  />
                  <textarea
                    placeholder="Notes (optional)"
                    className="w-full p-3 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none mb-3"
                    rows={2}
                    value={newTask.notes}
                    onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                  />
                  <div className="flex items-center gap-3">
                    <input
                      type="date"
                      className="flex-1 p-3 bg-card border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                      value={newTask.due}
                      onChange={(e) => setNewTask({ ...newTask, due: e.target.value })}
                    />
                    <GoogleButton variant="blue" onClick={handleCreateTask} disabled={isLoading}>
                      {isLoading ? 'Creating...' : 'Create'}
                    </GoogleButton>
                    <GoogleButton variant="outline" onClick={() => setShowAddTask(false)}>
                      Cancel
                    </GoogleButton>
                  </div>
                </div>
              )}

              {/* Pending Tasks */}
              <div className="space-y-3">
                {pendingTasks.map((task, idx) => (
                  <div
                    key={task.id}
                    className={cn(
                      "group flex items-start gap-4 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-all animate-task-item",
                      showCheckmark === task.id && "bg-google-green/20",
                      fadingOutTask === task.id && "opacity-0 transform translate-x-4"
                    )}
                    style={{ 
                      animationDelay: `${idx * 30}ms`,
                      transition: fadingOutTask === task.id ? 'all 0.3s ease-out' : undefined
                    }}
                  >
                    {/* Custom Checkbox with Animation */}
                    <button
                      onClick={() => handleCompleteTask(task)}
                      disabled={completingTask === task.id}
                      className={cn(
                        "mt-1 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0",
                        showCheckmark === task.id
                          ? "border-google-green bg-google-green"
                          : "border-muted-foreground/30 hover:border-google-blue hover:bg-google-blue/10"
                      )}
                    >
                      {showCheckmark === task.id && (
                        <Check className="w-4 h-4 text-white animate-scale-in" />
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-medium text-foreground transition-all",
                        showCheckmark === task.id && "line-through text-muted-foreground"
                      )}>
                        {task.title}
                      </p>
                      {task.notes && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.notes}</p>
                      )}
                      {task.due && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5" />
                          Due: {new Date(task.due).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <GoogleButton
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => toggleFavorite(task.id)}
                        aria-pressed={isTaskFavorited(task.id)}
                        aria-label={isTaskFavorited(task.id) ? 'Unfavorite task' : 'Favorite task'}
                      >
                        <Star
                          className={cn(
                            'w-4 h-4 transition-colors',
                            isTaskFavorited(task.id) ? 'text-primary fill-primary' : 'text-muted-foreground'
                          )}
                        />
                      </GoogleButton>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <GoogleButton
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Task actions"
                            disabled={deletingTask === task.id}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </GoogleButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[180px]">
                          <DropdownMenuItem onClick={() => toggleFavorite(task.id)}>
                            <Star className={cn('mr-2 h-4 w-4', isTaskFavorited(task.id) ? 'text-primary' : 'text-muted-foreground')} />
                            {isTaskFavorited(task.id) ? 'Unfavorite' : 'Favorite'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteTask(task)}
                            disabled={deletingTask === task.id}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {deletingTask === task.id ? 'Deleting...' : 'Delete'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>

              {/* Completed Section */}
              {completedTasks.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">
                    Completed ({completedTasks.length})
                  </h4>
                  <div className="space-y-2">
                    {completedTasks.map((task) => (
                      <div
                        key={task.id}
                        className="group flex items-center gap-4 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                      >
                        <button
                          onClick={() => handleCompleteTask(task)}
                          disabled={completingTask === task.id}
                          className="w-6 h-6 rounded-md border-2 border-google-green bg-google-green flex items-center justify-center flex-shrink-0"
                        >
                          <Check className="w-4 h-4 text-white" />
                        </button>
                        <p className="text-sm text-muted-foreground line-through flex-1">{task.title}</p>
                        <GoogleButton
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDeleteTask(task)}
                          disabled={deletingTask === task.id}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className={cn(
                            "w-4 h-4 text-destructive",
                            deletingTask === task.id && "animate-pulse"
                          )} />
                        </GoogleButton>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tasks.length === 0 && (
                <div className="text-center py-12">
                  <CheckSquare className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No tasks yet</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Click "Add Task" to get started</p>
                </div>
              )}
            </GoogleCardContent>
          </GoogleCard>
        </div>

        {/* AI Task Automation */}
        <div className="space-y-6">
          <GoogleCard className="animate-task-item" style={{ animationDelay: '100ms' }}>
            <GoogleCardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-google-blue via-purple-500 to-google-red flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
                <GoogleCardTitle>Task Automation</GoogleCardTitle>
              </div>
            </GoogleCardHeader>
            <GoogleCardContent>
              {/* Extract from Emails */}
              <div className="p-4 rounded-xl bg-google-blue/10 border border-google-blue/20 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-google-blue" />
                    <h4 className="font-medium text-foreground text-sm">Extract from Emails</h4>
                  </div>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>AI analyzes your urgent and action-required emails to automatically identify tasks and action items you need to complete.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  AI scans urgent/action emails to find hidden tasks
                </p>
                <GoogleButton 
                  variant="outline" 
                  size="sm" 
                  className="w-full gap-2"
                  onClick={handleExtractFromEmails}
                  disabled={isExtracting}
                >
                  <Zap className="w-4 h-4" />
                  {isExtracting ? 'Extracting...' : 'Extract Tasks'}
                </GoogleButton>
              </div>

              {/* Extracted Tasks */}
              {extractedTasks.length > 0 && (
                <div className="mb-4 p-4 rounded-xl bg-google-green/10 border border-google-green/20 animate-scale-in">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckSquare className="w-5 h-5 text-google-green" />
                    <span className="font-medium text-sm text-foreground">Extracted Tasks</span>
                  </div>
                  <div className="space-y-2">
                    {extractedTasks.map((task, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-background rounded-lg">
                        <p className="text-sm text-foreground flex-1 truncate">{task}</p>
                        <GoogleButton 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleCreateExtractedTask(task)}
                        >
                          <Plus className="w-4 h-4" />
                        </GoogleButton>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Meeting Prep Tasks */}
              <div className="p-4 rounded-xl bg-google-green/10 border border-google-green/20 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Video className="w-5 h-5 text-google-green" />
                    <h4 className="font-medium text-foreground text-sm">Meeting Prep</h4>
                  </div>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Shows your upcoming calendar events so you can quickly create preparation tasks. Click the + button to add a prep task for any meeting.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Create prep tasks for upcoming meetings
                </p>
                {upcomingMeetings.length > 0 ? (
                  <div className="space-y-2">
                    {upcomingMeetings.map((meeting, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-background rounded-lg">
                        <div className="truncate flex-1">
                          <p className="text-sm font-medium text-foreground truncate">{meeting.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(meeting.start).toLocaleDateString()}
                          </p>
                        </div>
                        <GoogleButton 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleCreateExtractedTask(`Prepare for: ${meeting.title}`)}
                        >
                          <Plus className="w-4 h-4" />
                        </GoogleButton>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No upcoming meetings</p>
                )}
              </div>

              {/* Urgent Tasks */}
              {urgentTasks.length > 0 && (
                <div className="p-4 rounded-xl bg-google-red/10 border border-google-red/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Bell className="w-5 h-5 text-google-red" />
                    <span className="font-medium text-sm text-foreground">Overdue</span>
                  </div>
                  <div className="space-y-2">
                    {urgentTasks.slice(0, 3).map((task, idx) => (
                      <div key={idx} className="p-2 bg-background rounded-lg">
                        <p className="text-sm text-foreground truncate">{task.title}</p>
                        <p className="text-xs text-google-red">
                          Due: {task.due && new Date(task.due).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </GoogleCardContent>
          </GoogleCard>
        </div>
      </div>
    </TooltipProvider>
  );
};
