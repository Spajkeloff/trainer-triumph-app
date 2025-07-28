import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin
} from "lucide-react";

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "day" | "agenda">("month");

  // Sample sessions data
  const sessions = [
    {
      id: "1",
      title: "Personal Training - Sarah Al-Zahra",
      time: "09:00 AM - 10:00 AM",
      type: "personal",
      location: "Main Gym",
      date: "2024-12-28"
    },
    {
      id: "2",
      title: "HIIT Class",
      time: "10:30 AM - 11:15 AM",
      type: "group",
      location: "Studio A",
      date: "2024-12-28"
    },
    {
      id: "3",
      title: "Personal Training - Omar Hassan",
      time: "02:00 PM - 03:00 PM",
      type: "personal",
      location: "Weight Room",
      date: "2024-12-28"
    }
  ];

  const getSessionColor = (type: string) => {
    switch (type) {
      case "personal":
        return "bg-primary text-primary-foreground";
      case "group":
        return "bg-success text-success-foreground";
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
          <Button className="bg-primary hover:bg-primary/90">
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
                      className={`min-h-[120px] p-2 border border-border rounded-lg ${
                        isCurrentMonth ? "bg-card" : "bg-muted/30"
                      } ${isToday ? "ring-2 ring-primary" : ""}`}
                    >
                      <div className={`text-sm font-medium mb-2 ${
                        isCurrentMonth ? "text-card-foreground" : "text-muted-foreground"
                      }`}>
                        {day.getDate()}
                      </div>
                      
                      <div className="space-y-1">
                        {daySessions.map((session) => (
                          <div
                            key={session.id}
                            className={`text-xs p-1 rounded text-left cursor-pointer hover:opacity-80 ${getSessionColor(session.type)}`}
                          >
                            <div className="font-medium truncate">{session.title}</div>
                            <div className="opacity-90">{session.time}</div>
                          </div>
                        ))}
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
                  Today's Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className={`w-4 h-4 rounded-full ${getSessionColor(session.type).split(' ')[0]}`} />
                        <div>
                          <h3 className="font-medium text-card-foreground">{session.title}</h3>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            {session.time}
                            <MapPin className="h-3 w-3 ml-3 mr-1" />
                            {session.location}
                          </div>
                        </div>
                      </div>
                      <Badge variant={session.type === "personal" ? "default" : "secondary"}>
                        {session.type === "personal" ? "Personal" : "Group"}
                      </Badge>
                    </div>
                  ))}
                </div>
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
      </div>
    </div>
  );
};

export default Calendar;