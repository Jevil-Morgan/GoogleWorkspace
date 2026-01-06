import React from 'react';
import { AlertCircle, Calendar, CheckSquare, TrendingUp, ChevronRight, Clock, Star } from 'lucide-react';
import { GoogleCard, GoogleCardHeader, GoogleCardTitle, GoogleCardContent } from '../ui/GoogleCard';
import type { Email, CalendarEvent, Task } from '@/lib/api';

interface DashboardViewProps {
  emails: Email[];
  events: CalendarEvent[];
  tasks: Task[];
  onViewEmail: () => void;
  onViewCalendar: () => void;
  onViewTasks: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  emails,
  events,
  tasks,
  onViewEmail,
  onViewCalendar,
  onViewTasks,
}) => {
  const urgentCount = emails.filter(e => e.category === 'urgent').length;
  const todayEvents = events.filter(e => {
    const eventDate = new Date(e.start).toDateString();
    return eventDate === new Date().toDateString();
  }).length;
  const pendingTasks = tasks.filter(t => !t.completed).length;

  const stats = [
    {
      label: 'Urgent Emails',
      value: urgentCount,
      subtitle: 'Requires attention',
      icon: <AlertCircle className="w-6 h-6" />,
      gradient: 'from-google-red to-pink-500',
    },
    {
      label: "Today's Events",
      value: todayEvents,
      subtitle: 'Scheduled meetings',
      icon: <Calendar className="w-6 h-6" />,
      gradient: 'from-google-blue to-cyan-500',
    },
    {
      label: 'Pending Tasks',
      value: pendingTasks,
      subtitle: 'Action items',
      icon: <CheckSquare className="w-6 h-6" />,
      gradient: 'from-google-yellow to-orange-500',
    },
    {
      label: 'AI Insights',
      value: '87%',
      subtitle: 'Productivity score',
      icon: <TrendingUp className="w-6 h-6" />,
      gradient: 'from-google-green to-emerald-500',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${stat.gradient} p-6 text-primary-foreground shadow-google hover:shadow-google-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer animate-slide-up`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary-foreground/10 rounded-full -mr-8 -mt-8" />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center mb-3">
                {stat.icon}
              </div>
              <p className="text-sm font-medium opacity-90">{stat.label}</p>
              <p className="text-3xl font-bold mt-1">{stat.value}</p>
              <p className="text-xs opacity-75 mt-1">{stat.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <GoogleCard hover onClick={onViewCalendar}>
          <GoogleCardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-google-blue/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-google-blue" />
              </div>
              <GoogleCardTitle>Upcoming Events</GoogleCardTitle>
            </div>
            <button className="text-sm text-primary hover:underline font-medium flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </GoogleCardHeader>
          <GoogleCardContent>
            <div className="space-y-3">
              {events.slice(0, 4).map((event, idx) => (
                <div
                  key={idx}
                  className="group flex items-start gap-4 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-google-blue/10 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-xs text-google-blue font-medium">
                      {new Date(event.start).toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                    <span className="text-lg font-bold text-google-blue">
                      {new Date(event.start).getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate group-hover:text-google-blue transition-colors">
                      {event.title}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {new Date(event.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </p>
                    {event.location && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">{event.location}</p>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-google-blue transition-colors flex-shrink-0" />
                </div>
              ))}
              {events.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No upcoming events</p>
              )}
            </div>
          </GoogleCardContent>
        </GoogleCard>

        {/* Priority Tasks */}
        <GoogleCard hover onClick={onViewTasks}>
          <GoogleCardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-google-yellow/10 flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-google-yellow" />
              </div>
              <GoogleCardTitle>Priority Tasks</GoogleCardTitle>
            </div>
            <button className="text-sm text-primary hover:underline font-medium flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </GoogleCardHeader>
          <GoogleCardContent>
            <div className="space-y-3">
              {tasks.filter(t => !t.completed).slice(0, 4).map((task, idx) => (
                <div
                  key={idx}
                  className="group flex items-start gap-3 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <input
                    type="checkbox"
                    className="mt-1 w-5 h-5 rounded-md border-2 border-muted-foreground/30 text-google-blue focus:ring-google-blue cursor-pointer"
                    checked={task.completed}
                    readOnly
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{task.title}</p>
                    {task.due && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Due: {new Date(task.due).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Star className="w-4 h-4 text-google-yellow flex-shrink-0" />
                </div>
              ))}
              {tasks.filter(t => !t.completed).length === 0 && (
                <p className="text-center text-muted-foreground py-8">No pending tasks</p>
              )}
            </div>
          </GoogleCardContent>
        </GoogleCard>
      </div>

      {/* Recent Emails Summary */}
      <GoogleCard hover onClick={onViewEmail}>
        <GoogleCardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-google-red/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-google-red" />
            </div>
            <GoogleCardTitle>Email Summary</GoogleCardTitle>
          </div>
          <button className="text-sm text-primary hover:underline font-medium flex items-center gap-1">
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </GoogleCardHeader>
        <GoogleCardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Urgent', count: emails.filter(e => e.category === 'urgent').length, color: 'bg-google-red' },
              { label: 'Action Required', count: emails.filter(e => e.category === 'action').length, color: 'bg-google-yellow' },
              { label: 'FYI', count: emails.filter(e => e.category === 'fyi').length, color: 'bg-google-blue' },
              { label: 'Later', count: emails.filter(e => e.category === 'later').length, color: 'bg-muted-foreground' },
            ].map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-secondary/50 text-center">
                <div className={`w-3 h-3 ${item.color} rounded-full mx-auto mb-2`} />
                <p className="text-2xl font-bold text-foreground">{item.count}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </GoogleCardContent>
      </GoogleCard>
    </div>
  );
};
