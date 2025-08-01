import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin,
  User,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface Session {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: string;
  location?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  trainer_id: string;
}

const MySessions = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchMySessions();
  }, [user]);

  const fetchMySessions = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      // This would fetch sessions for the current client only
      // For now, using mock data
      const mockSessions: Session[] = [
        {
          id: '1',
          date: '2024-01-15',
          start_time: '15:00',
          end_time: '16:00',
          type: 'Personal Training',
          location: 'Studio A',
          status: 'scheduled',
          notes: 'Focus on upper body strength',
          trainer_id: 'trainer1'
        },
        {
          id: '2',
          date: '2024-01-12',
          start_time: '10:00',
          end_time: '11:00',
          type: 'Cardio Session',
          location: 'Main Gym',
          status: 'completed',
          trainer_id: 'trainer1'
        }
      ];
      
      setSessions(mockSessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load your sessions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-primary text-primary-foreground';
      case 'completed':
        return 'bg-success text-success-foreground';
      case 'cancelled':
        return 'bg-destructive text-destructive-foreground';
      case 'no-show':
        return 'bg-warning text-warning-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <CalendarIcon className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      case 'no-show':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <CalendarIcon className="h-4 w-4" />;
    }
  };

  const canCancelSession = (session: Session) => {
    const sessionDateTime = new Date(`${session.date}T${session.start_time}`);
    const now = new Date();
    const hoursUntilSession = (sessionDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return session.status === 'scheduled' && hoursUntilSession > 24;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const upcomingSessions = sessions.filter(s => s.status === 'scheduled');
  const pastSessions = sessions.filter(s => s.status !== 'scheduled');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Sessions</h1>
          <p className="text-muted-foreground">
            View and manage your training sessions.
          </p>
        </div>
        <Button>
          <CalendarIcon className="h-4 w-4 mr-2" />
          Book New Session
        </Button>
      </div>

      {/* Upcoming Sessions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Upcoming Sessions</h2>
        {upcomingSessions.length > 0 ? (
          <div className="space-y-4">
            {upcomingSessions.map((session) => (
              <Card key={session.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold">{session.type}</h3>
                        <Badge className={getStatusColor(session.status)}>
                          {getStatusIcon(session.status)}
                          <span className="ml-1 capitalize">{session.status}</span>
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          {new Date(session.date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          {session.start_time} - {session.end_time}
                        </div>
                        {session.location && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2" />
                            {session.location}
                          </div>
                        )}
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          Trainer: Sarah Johnson
                        </div>
                      </div>
                      
                      {session.notes && (
                        <div className="mt-3 p-3 bg-muted rounded-lg">
                          <p className="text-sm">{session.notes}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      {canCancelSession(session) && (
                        <Button variant="outline" size="sm" className="text-destructive">
                          Cancel Session
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No upcoming sessions</h3>
              <p className="text-muted-foreground mb-4">Book your next training session to get started.</p>
              <Button>
                <CalendarIcon className="h-4 w-4 mr-2" />
                Book Session
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Past Sessions */}
      {pastSessions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Session History</h2>
          <div className="space-y-4">
            {pastSessions.map((session) => (
              <Card key={session.id} className="opacity-75">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold">{session.type}</h3>
                        <Badge className={getStatusColor(session.status)}>
                          {getStatusIcon(session.status)}
                          <span className="ml-1 capitalize">{session.status}</span>
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          {new Date(session.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          {session.start_time} - {session.end_time}
                        </div>
                        {session.location && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2" />
                            {session.location}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button variant="ghost" size="sm">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MySessions;