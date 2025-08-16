import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { clientAreaService } from '@/services/clientAreaService';
import { Link } from 'react-router-dom';
import CancelSessionModal from '@/components/CancelSessionModal';
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
  status: string;
  notes?: string;
  trainer_id: string;
}

const MySessions = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [clientPermissions, setClientPermissions] = useState({ can_book_sessions: false, can_cancel_sessions: false });
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [sessionToCancel, setSessionToCancel] = useState<Session | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchMySessions();
  }, [user]);

  const fetchMySessions = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get client ID from user ID
      const clientId = await clientAreaService.getClientIdFromUserId(user.id);
      if (!clientId) {
        setSessions([]);
        return;
      }

      // Fetch both sessions and permissions
      const [clientSessions, permissions] = await Promise.all([
        clientAreaService.getClientSessions(clientId),
        clientAreaService.getClientPermissions(clientId)
      ]);
      
      setSessions(clientSessions as Session[]);
      setClientPermissions(permissions);
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

  const handleCancelClick = (session: Session) => {
    setSessionToCancel(session);
    setCancelModalOpen(true);
  };

  const handleCancelConfirm = async (reason?: string) => {
    if (!sessionToCancel) return;

    try {
      setCancelLoading(true);
      const result = await clientAreaService.cancelSession(sessionToCancel.id, reason);
      
      toast({
        title: "Session cancelled",
        description: result.creditRefunded 
          ? "Your session credit has been refunded." 
          : "Late cancellation. No credit refunded.",
        variant: result.creditRefunded ? "default" : "destructive",
      });

      // Refresh sessions data
      fetchMySessions();
      setCancelModalOpen(false);
      setSessionToCancel(null);
    } catch (error) {
      console.error('Error cancelling session:', error);
      toast({
        title: "Error",
        description: "Failed to cancel session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCancelLoading(false);
    }
  };

  const shouldShowCancelButton = (session: Session) => {
    if (!clientPermissions.can_cancel_sessions) return false;
    if (session.status !== 'scheduled') return false;
    
    const sessionDateTime = new Date(`${session.date}T${session.start_time}`);
    const now = new Date();
    const hoursUntilSession = (sessionDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    return hoursUntilSession > 0; // Show if in future, but disable if less than 24 hours
  };

  const getCancelButtonText = (session: Session) => {
    const sessionDateTime = new Date(`${session.date}T${session.start_time}`);
    const now = new Date();
    const hoursUntilSession = (sessionDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilSession < 24) {
      return "Too late to cancel online. Please contact your trainer.";
    }
    return null;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Sessions</h1>
          <p className="text-muted-foreground">
            View and manage your training sessions
          </p>
        </div>
        {clientPermissions.can_book_sessions && (
          <Link to="/client/book-session">
            <Button>
              <CalendarIcon className="h-4 w-4 mr-2" />
              Book Another Session
            </Button>
          </Link>
        )}
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
                      {shouldShowCancelButton(session) && (
                        <>
                          {canCancelSession(session) ? (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-destructive"
                              onClick={() => handleCancelClick(session)}
                              disabled={cancelLoading}
                            >
                              Cancel Session
                            </Button>
                          ) : (
                            <div className="text-xs text-muted-foreground max-w-32 text-center">
                              {getCancelButtonText(session)}
                            </div>
                          )}
                        </>
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
              <p className="text-muted-foreground">
                Contact your trainer to schedule your next training session.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Session History */}
      {pastSessions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Previous Sessions</h2>
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

      {/* Cancel Session Modal */}
      <CancelSessionModal
        open={cancelModalOpen}
        onOpenChange={setCancelModalOpen}
        session={sessionToCancel}
        onConfirm={handleCancelConfirm}
        loading={cancelLoading}
      />
    </div>
  );
};

export default MySessions;