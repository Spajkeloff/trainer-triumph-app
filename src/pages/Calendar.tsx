import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import BookSessionModal from "@/components/BookSessionModal";
import SessionManagementModal from "@/components/SessionManagementModal";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin
} from "lucide-react";

interface Session {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: string;
  location: string;
  notes?: string;
  status: string;
  client_id: string;
  client_package_id?: string;
  clients: {
    first_name: string;
    last_name: string;
  };
}

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "day" | "agenda">("month");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookModal, setShowBookModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [editSession, setEditSession] = useState<Session | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSessions();
  }, [currentDate]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('sessions')
        .select(`
          id,
          date,
          start_time,
          end_time,
          type,
          location,
          notes,
          status,
          client_id,
          client_package_id,
          clients (first_name, last_name)
        `)
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load sessions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSessionClick = (session: Session) => {
    setSelectedSession(session);
    setShowSessionModal(true);
  };

  const handleTimeSlotClick = (date: Date, time?: string) => {
    setSelectedDate(date);
    setSelectedTime(time || "");
    setEditSession(null); // Clear edit mode
    setShowBookModal(true);
  };

  const handleEditSession = (session: Session) => {
    setEditSession(session);
    setSelectedDate(new Date(session.date + 'T00:00:00'));
    setSelectedTime(session.start_time.substring(0, 5));
    setShowBookModal(true);
  };

  const getSessionColor = (type: string, status: string) => {
    // Completed sessions are always green
    if (status === 'completed') {
      return "bg-success text-success-foreground";
    }
    
    // Cancelled and rescheduled sessions are yellow
    if (status === 'cancelled' || status === 'rescheduled') {
      return "bg-warning text-warning-foreground";
    }
    
    if (status === 'no_show') {
      return "bg-destructive text-destructive-foreground";
    }

    // Default colors for scheduled sessions
    switch (type) {
      case "personal":
        return "bg-primary text-primary-foreground";
      case "group":
        return "bg-secondary text-secondary-foreground";
      case "blocked":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-primary text-primary-foreground";
    }
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString("en-AE", { month: "long", year: "numeric" });
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const navigateDay = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const getWeekDateRange = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return {
      start: startOfWeek,
      end: endOfWeek,
      text: `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    };
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Calendar</h1>
            <p className="text-muted-foreground">Manage your training schedule and sessions</p>
          </div>
          <Button 
            className="bg-primary hover:bg-primary/90"
            onClick={() => setShowBookModal(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Session
          </Button>
        </div>

        {/* Calendar Controls */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth("prev")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-xl font-semibold">{formatMonth(currentDate)}</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth("next")}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex space-x-2">
                {["month", "week", "day", "agenda"].map((viewType) => (
                  <Button
                    key={viewType}
                    variant={view === viewType ? "default" : "outline"}
                    size="sm"
                    onClick={() => setView(viewType as any)}
                  >
                    {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Calendar Grid */}
        {view === "month" && (
          <Card>
            <CardContent className="p-6">
              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                  const isToday = day.toDateString() === new Date().toDateString();
                  const dayKey = day.toISOString().split('T')[0];
                  const daySessions = sessions.filter(session => session.date === dayKey);

                  return (
                    <div
                      key={index}
                      className={`min-h-[120px] p-2 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                        isCurrentMonth ? "bg-card" : "bg-muted/30"
                      } ${isToday ? "ring-2 ring-primary" : ""}`}
                      onClick={() => handleTimeSlotClick(day)}
                    >
                      <div className={`text-sm font-medium mb-2 ${
                        isCurrentMonth ? "text-card-foreground" : "text-muted-foreground"
                      }`}>
                        {day.getDate()}
                      </div>
                      
                      <div className="space-y-1">
                        {daySessions.map((session) => {
                          const startTime = new Date(`2000-01-01T${session.start_time}`);
                          const endTime = new Date(`2000-01-01T${session.end_time}`);
                          const timeStr = `${startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - ${endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
                          
                          return (
                            <div
                              key={session.id}
                              className={`text-xs p-1 rounded text-left cursor-pointer hover:opacity-80 ${getSessionColor(session.type, session.status)}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSessionClick(session);
                              }}
                            >
                              <div className="font-medium truncate">
                                {session.type === 'personal' ? 'Personal Training' : session.type} - {session.clients.first_name} {session.clients.last_name}
                              </div>
                              <div className="opacity-90">{timeStr}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Week View */}
        {view === "week" && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateWeek("prev")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-lg font-semibold">{getWeekDateRange(currentDate).text}</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateWeek("next")}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-8 gap-1">
                <div className="p-2"></div>
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, dayIndex) => {
                  const dayDate = new Date(currentDate);
                  dayDate.setDate(dayDate.getDate() - dayDate.getDay() + dayIndex);
                  
                  return (
                    <div key={day} className="p-2 text-center">
                      <div className="text-sm font-medium text-muted-foreground">{day}</div>
                      <div className="text-lg font-semibold mt-1">{dayDate.getDate()}</div>
                    </div>
                  );
                })}
                
                {/* Time slots */}
                {Array.from({ length: 16 }, (_, i) => {
                  const hour = i + 6; // 6 AM to 10 PM
                  const timeStr = `${hour}:00`;
                  
                  return (
                    <div key={hour} className="contents">
                      <div className="p-2 text-sm text-muted-foreground text-right">
                        {timeStr}
                      </div>
                      {Array.from({ length: 7 }, (_, dayIndex) => {
                        const dayDate = new Date(currentDate);
                        dayDate.setDate(dayDate.getDate() - dayDate.getDay() + dayIndex);
                        const dayKey = dayDate.toISOString().split('T')[0];
                        
                        const hourSessions = sessions.filter(session => {
                          if (session.date !== dayKey) return false;
                          const sessionStart = new Date(`2000-01-01T${session.start_time}`);
                          return sessionStart.getHours() === hour;
                        });
                        
                        return (
                          <div 
                            key={dayIndex} 
                            className="p-1 min-h-[60px] border border-border cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleTimeSlotClick(dayDate, timeStr)}
                          >
                            {hourSessions.map((session) => (
                            <div
                                key={session.id}
                                className={`text-xs p-1 rounded mb-1 cursor-pointer ${getSessionColor(session.type, session.status)}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSessionClick(session);
                                }}
                              >
                                {session.clients.first_name} {session.clients.last_name}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Day View */}
        {view === "day" && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateDay("prev")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle>
                  {currentDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateDay("next")}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2">
                {Array.from({ length: 16 }, (_, i) => {
                  const hour = i + 6; // 6 AM to 10 PM
                  const timeStr = `${hour}:00`;
                  const dayKey = currentDate.toISOString().split('T')[0];
                  
                  const hourSessions = sessions.filter(session => {
                    if (session.date !== dayKey) return false;
                    const sessionStart = new Date(`2000-01-01T${session.start_time}`);
                    return sessionStart.getHours() === hour;
                  });
                  
                  return (
                    <div key={hour} className="flex items-start border-b border-border pb-2">
                      <div className="w-20 text-sm text-muted-foreground pt-2">
                        {timeStr}
                      </div>
                      <div 
                        className="flex-1 min-h-[60px] p-2 cursor-pointer hover:bg-muted/30 rounded transition-colors"
                        onClick={() => handleTimeSlotClick(currentDate, timeStr)}
                      >
                        {hourSessions.map((session) => {
                          const startTime = new Date(`2000-01-01T${session.start_time}`);
                          const endTime = new Date(`2000-01-01T${session.end_time}`);
                          const timeStr = `${startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - ${endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
                          
                          return (
                            <div
                              key={session.id}
                              className={`p-3 rounded-lg cursor-pointer ${getSessionColor(session.type, session.status)} mb-2`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSessionClick(session);
                              }}
                            >
                              <div className="font-medium">
                                {session.type === 'personal' ? 'Personal Training' : session.type}
                              </div>
                              <div className="text-sm opacity-90">
                                {session.clients.first_name} {session.clients.last_name}
                              </div>
                              <div className="text-sm opacity-75">
                                {timeStr} • {session.location}
                              </div>
                            </div>
                          );
                        })}
                        {hourSessions.length === 0 && (
                          <div className="text-sm text-muted-foreground italic">
                            Click to book a session
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Agenda View */}
        {view === "agenda" && (
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  Upcoming Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sessions.length > 0 ? (
                  <div className="space-y-4">
                    {sessions
                      .filter(session => new Date(session.date) >= new Date())
                      .slice(0, 10)
                      .map((session) => {
                        const startTime = new Date(`2000-01-01T${session.start_time}`);
                        const endTime = new Date(`2000-01-01T${session.end_time}`);
                        const timeStr = `${startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - ${endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
                        
                        return (
                          <div key={session.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => handleSessionClick(session)}>
                            <div className="flex items-center space-x-4">
                              <div className={`w-4 h-4 rounded-full ${getSessionColor(session.type, session.status).split(' ')[0]}`} />
                              <div>
                                <h3 className="font-medium text-card-foreground">
                                  {session.type === 'personal' ? 'Personal Training' : session.type} - {session.clients.first_name} {session.clients.last_name}
                                </h3>
                                <div className="flex items-center text-sm text-muted-foreground mt-1">
                                  <CalendarIcon className="h-3 w-3 mr-1" />
                                  {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  <Clock className="h-3 w-3 ml-3 mr-1" />
                                  {timeStr}
                                  <MapPin className="h-3 w-3 ml-3 mr-1" />
                                  {session.location}
                                </div>
                              </div>
                            </div>
                            <Badge variant={session.type === "personal" ? "default" : "secondary"}>
                              {session.type === "personal" ? "Personal" : "Group"}
                            </Badge>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-card-foreground mb-2">No sessions found</h3>
                    <p className="text-muted-foreground mb-4">Book your first session to get started</p>
                    <Button onClick={() => setShowBookModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Book Session
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Legend */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground">Session Types:</span>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded bg-primary" />
                <span className="text-sm">Personal Training</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded bg-success" />
                <span className="text-sm">Group Classes</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded bg-muted" />
                <span className="text-sm">Blocked Time</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Book Session Modal */}
        <BookSessionModal
          isOpen={showBookModal}
          onClose={() => {
            setShowBookModal(false);
            setSelectedDate(undefined);
            setSelectedTime("");
            setEditSession(null); // Clear edit session when closing
          }}
          onSuccess={() => {
            fetchSessions();
            setEditSession(null); // Clear edit session on success
            // Navigate to the month of the selected date if it's different
            if (selectedDate && selectedDate.getMonth() !== currentDate.getMonth()) {
              setCurrentDate(selectedDate);
            }
          }}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          editSession={editSession} // Pass the edit session to the modal
        />

        {/* Session Management Modal */}
        <SessionManagementModal
          isOpen={showSessionModal}
          onClose={() => setShowSessionModal(false)}
          session={selectedSession}
          onSuccess={fetchSessions}
          onEdit={handleEditSession}
        />
      </div>
    </div>
  );
};

export default Calendar;