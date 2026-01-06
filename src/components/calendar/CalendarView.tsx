import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Users, Plus, ChevronLeft, ChevronRight, Sparkles, X } from 'lucide-react';
import { GoogleCard, GoogleCardHeader, GoogleCardTitle, GoogleCardContent } from '../ui/GoogleCard';
import { GoogleButton } from '../ui/GoogleButton';
import type { CalendarEvent, TimeSlot } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface CalendarViewProps {
  events: CalendarEvent[];
  availableSlots: TimeSlot[];
  onFindSlots: (duration: number) => Promise<void>;
  onCreateEvent: (event: { title: string; start: string; end: string; description?: string; location?: string }) => Promise<void>;
  isLoading: boolean;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  availableSlots,
  onFindSlots,
  onCreateEvent,
  isLoading,
}) => {
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    description: '',
    location: '',
  });
  const [isCreating, setIsCreating] = useState(false);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const hasEventOnDay = (day: number) => {
    return events.some(event => {
      const eventDate = new Date(event.start);
      return eventDate.getDate() === day && 
             eventDate.getMonth() === currentDate.getMonth() &&
             eventDate.getFullYear() === currentDate.getFullYear();
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() &&
           currentDate.getFullYear() === today.getFullYear();
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title.trim() || !newEvent.date || !newEvent.startTime || !newEvent.endTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    try {
      const start = new Date(`${newEvent.date}T${newEvent.startTime}`).toISOString();
      const end = new Date(`${newEvent.date}T${newEvent.endTime}`).toISOString();
      
      await onCreateEvent({
        title: newEvent.title,
        start,
        end,
        description: newEvent.description,
        location: newEvent.location,
      });
      
      toast.success('Event created successfully!');
      setShowCreateModal(false);
      setNewEvent({ title: '', date: '', startTime: '', endTime: '', description: '', location: '' });
      setSelectedSlot(null);
    } catch (error) {
      toast.error('Failed to create event');
    }
    setIsCreating(false);
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    const startDate = new Date(slot.start);
    const endDate = new Date(slot.end);
    
    setNewEvent({
      ...newEvent,
      date: startDate.toISOString().split('T')[0],
      startTime: startDate.toTimeString().slice(0, 5),
      endTime: endDate.toTimeString().slice(0, 5),
    });
    setShowCreateModal(true);
  };

  const openNewEventModal = () => {
    setSelectedSlot(null);
    const now = new Date();
    const nextHour = new Date(now.setHours(now.getHours() + 1, 0, 0, 0));
    const endHour = new Date(nextHour.getTime() + 60 * 60 * 1000);
    
    setNewEvent({
      title: '',
      date: nextHour.toISOString().split('T')[0],
      startTime: nextHour.toTimeString().slice(0, 5),
      endTime: endHour.toTimeString().slice(0, 5),
      description: '',
      location: '',
    });
    setShowCreateModal(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      {/* Calendar Widget */}
      <div className="lg:col-span-2">
        <GoogleCard>
          <GoogleCardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-google-blue/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-google-blue" />
              </div>
              <GoogleCardTitle>
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </GoogleCardTitle>
            </div>
            <div className="flex items-center gap-2">
              <GoogleButton
                variant="ghost"
                size="icon-sm"
                onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
              >
                <ChevronLeft className="w-5 h-5" />
              </GoogleButton>
              <GoogleButton
                variant="ghost"
                size="icon-sm"
                onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
              >
                <ChevronRight className="w-5 h-5" />
              </GoogleButton>
            </div>
          </GoogleCardHeader>
          <GoogleCardContent>
            {/* Days of Week */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {daysOfWeek.map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {getMonthDays().map((day, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-colors",
                    day === null && "invisible",
                    day !== null && "hover:bg-secondary cursor-pointer",
                    isToday(day!) && "bg-google-blue text-primary-foreground font-semibold",
                    hasEventOnDay(day!) && !isToday(day!) && "font-medium"
                  )}
                >
                  {day}
                  {hasEventOnDay(day!) && !isToday(day!) && (
                    <div className="w-1.5 h-1.5 rounded-full bg-google-blue mt-0.5" />
                  )}
                </div>
              ))}
            </div>
          </GoogleCardContent>
        </GoogleCard>

        {/* Events List */}
        <GoogleCard className="mt-6">
          <GoogleCardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-google-green/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-google-green" />
              </div>
              <GoogleCardTitle>Upcoming Events</GoogleCardTitle>
            </div>
            <GoogleButton 
              variant="blue" 
              size="sm" 
              className="gap-2"
              onClick={openNewEventModal}
            >
              <Plus className="w-4 h-4" />
              New Event
            </GoogleButton>
          </GoogleCardHeader>
          <GoogleCardContent>
            <div className="space-y-3">
              {events.map((event, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors group"
                >
                  <div className="w-14 h-14 rounded-xl bg-google-blue/10 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-xs text-google-blue font-medium">
                      {new Date(event.start).toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                    <span className="text-xl font-bold text-google-blue">
                      {new Date(event.start).getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate group-hover:text-google-blue transition-colors">
                      {event.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {new Date(event.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </span>
                      )}
                      {event.attendees > 0 && (
                        <span className="flex items-center gap-1.5">
                          <Users className="w-4 h-4" />
                          {event.attendees} attendees
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No upcoming events</p>
                </div>
              )}
            </div>
          </GoogleCardContent>
        </GoogleCard>
      </div>

      {/* Smart Scheduling */}
      <div>
        <GoogleCard>
          <GoogleCardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-google-blue via-purple-500 to-google-red flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <GoogleCardTitle>Smart Scheduling</GoogleCardTitle>
            </div>
          </GoogleCardHeader>
          <GoogleCardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Find optimal meeting times based on your calendar availability.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">Duration</label>
              <div className="grid grid-cols-3 gap-2">
                {[30, 60, 90].map(duration => (
                  <GoogleButton
                    key={duration}
                    variant={selectedDuration === duration ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedDuration(duration)}
                  >
                    {duration}m
                  </GoogleButton>
                ))}
              </div>
            </div>

            <GoogleButton
              variant="blue"
              className="w-full mb-6"
              onClick={() => onFindSlots(selectedDuration)}
              disabled={isLoading}
            >
              {isLoading ? 'Finding...' : 'Find Available Slots'}
            </GoogleButton>

            {availableSlots.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground mb-3">Available Times</h4>
                <p className="text-xs text-muted-foreground mb-3">Click a slot to schedule an event</p>
                {availableSlots.slice(0, 6).map((slot, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSlotSelect(slot)}
                    className="p-3 rounded-xl bg-google-green/10 border border-google-green/20 hover:bg-google-green/20 cursor-pointer transition-colors"
                  >
                    <p className="text-sm font-medium text-foreground">
                      {new Date(slot.start).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(slot.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - 
                      {new Date(slot.end).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </GoogleCardContent>
        </GoogleCard>
      </div>

      {/* Create Event Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-google-blue/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-google-blue" />
              </div>
              {selectedSlot ? 'Schedule Event' : 'Create New Event'}
            </DialogTitle>
            <DialogDescription>
              {selectedSlot 
                ? 'Create an event in the selected time slot'
                : 'Fill in the details for your new event'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Event Title <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                placeholder="Meeting with team"
                className="w-full p-3 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Date <span className="text-destructive">*</span>
                </label>
                <input
                  type="date"
                  className="w-full p-3 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Start <span className="text-destructive">*</span>
                </label>
                <input
                  type="time"
                  className="w-full p-3 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={newEvent.startTime}
                  onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  End <span className="text-destructive">*</span>
                </label>
                <input
                  type="time"
                  className="w-full p-3 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={newEvent.endTime}
                  onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Location</label>
              <input
                type="text"
                placeholder="Conference Room A"
                className="w-full p-3 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Description</label>
              <textarea
                placeholder="Add meeting notes or agenda..."
                className="w-full p-3 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                rows={3}
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <GoogleButton variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </GoogleButton>
            <GoogleButton 
              variant="blue" 
              onClick={handleCreateEvent}
              disabled={isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Event'}
            </GoogleButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
