import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Package, CreditCard, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { clientAreaService, ClientPackageInfo, ClientSession } from '@/services/clientAreaService';
import { useToast } from '@/hooks/use-toast';

const ClientDashboard = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sessionsRemaining, setSessionsRemaining] = useState(0);
  const [nextSession, setNextSession] = useState<ClientSession | null>(null);
  const [accountBalance, setAccountBalance] = useState(0);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [clientPermissions, setClientPermissions] = useState({ can_book_sessions: false, can_cancel_sessions: false });

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const clientId = await clientAreaService.getClientIdFromUserId(user.id);
      if (!clientId) {
        setLoading(false);
        return;
      }

      // Fetch all data in parallel
      const [packages, nextSessionData, balance, permissions] = await Promise.all([
        clientAreaService.getClientPackages(clientId),
        clientAreaService.getNextSession(clientId),
        clientAreaService.getClientBalance(clientId),
        clientAreaService.getClientPermissions(clientId)
      ]);

      // Calculate total sessions remaining
      const totalSessions = packages.reduce((sum, pkg) => sum + pkg.sessions_remaining, 0);
      setSessionsRemaining(totalSessions);
      
      setNextSession(nextSessionData);
      setAccountBalance(balance);
      setClientPermissions(permissions);

      // Calculate profile completion
      const profileFields = [
        profile?.first_name,
        profile?.last_name,
        profile?.phone,
        profile?.address,
        profile?.date_of_birth,
        profile?.emergency_contact
      ];
      const completedFields = profileFields.filter(field => field && field.trim()).length;
      setProfileCompletion(Math.round((completedFields / profileFields.length) * 100));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-8"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome Back{profile?.first_name ? `, ${profile.first_name}` : ''}!
        </h1>
        <p className="text-muted-foreground">
          Here's an overview of your training progress and upcoming sessions.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Sessions Remaining
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessionsRemaining}</div>
            <p className="text-xs text-muted-foreground">
              From your active packages
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Next Session
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {nextSession ? 
                new Date(nextSession.date).toLocaleDateString() === new Date().toLocaleDateString() ? 'Today' : 
                new Date(nextSession.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : 'None'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {nextSession ? `${nextSession.start_time} - ${nextSession.type}` : 'No upcoming sessions'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Account Balance
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Math.abs(accountBalance).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {accountBalance === 0 ? 'All payments up to date' : 
               accountBalance > 0 ? 'Outstanding balance' : 'Credit balance'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Profile Complete
            </CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profileCompletion}%</div>
            <p className="text-xs text-muted-foreground">
              {profileCompletion === 100 ? 'Profile complete' : 'Complete your profile'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {clientPermissions.can_book_sessions && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Manage your training sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <Link to="/client/book-session">
                <Button className="flex-1">
                  <Calendar className="h-4 w-4 mr-2" />
                  Book New Session
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Sessions</CardTitle>
          <CardDescription>
            Your scheduled training sessions for the next week.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {nextSession ? (
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">{nextSession.type}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(nextSession.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric' 
                    })} at {nextSession.start_time}
                  </p>
                  {nextSession.location && (
                    <p className="text-sm text-muted-foreground">at {nextSession.location}</p>
                  )}
                </div>
                <Button size="sm" variant="outline">
                  View Details
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No upcoming sessions</h3>
                <p className="text-muted-foreground">Contact your trainer to schedule your next session.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientDashboard;