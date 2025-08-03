import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { clientService, ClientWithDetails } from '@/services/clientService';
import { sessionService } from '@/services/sessionService';
import { packageService } from '@/services/packageService';
import { paymentService } from '@/services/paymentService';
import BookSessionModal from '@/components/BookSessionModal';
import AddPaymentModal from '@/components/AddPaymentModal';
import AssignPackageModal from '@/components/AssignPackageModal';
import { 
  ArrowLeft,
  Calendar,
  DollarSign,
  Package,
  FileText,
  MessageSquare,
  Upload,
  Activity,
  TrendingUp,
  Clock,
  User,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';

const ClientDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [client, setClient] = useState<ClientWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    upcomingSessions: 0,
    totalSpent: 0,
    balance: 0,
    activePackages: 0
  });
  
  const [showBookSessionModal, setShowBookSessionModal] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showAssignPackageModal, setShowAssignPackageModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadClientDetails();
    }
  }, [id]);

  const loadClientDetails = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const clientData = await clientService.getById(id);
      if (clientData) {
        setClient(clientData);
        calculateStats(clientData);
      } else {
        toast({
          title: "Error",
          description: "Client not found",
          variant: "destructive",
        });
        navigate('/admin/clients');
      }
    } catch (error) {
      console.error('Error loading client:', error);
      toast({
        title: "Error",
        description: "Failed to load client details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (clientData: ClientWithDetails) => {
    const totalSessions = clientData.sessions?.length || 0;
    const completedSessions = clientData.sessions?.filter(s => s.status === 'completed').length || 0;
    const upcomingSessions = clientData.sessions?.filter(s => s.status === 'scheduled' && new Date(s.date) >= new Date()).length || 0;
    const totalSpent = clientData.payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const activePackages = clientData.client_packages?.filter(p => p.status === 'active').length || 0;

    setStats({
      totalSessions,
      completedSessions,
      upcomingSessions,
      totalSpent,
      balance: 0, // This would need to be calculated from charges vs payments
      activePackages
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!client) {
    return <div className="flex justify-center items-center h-64">Client not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/clients')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={client.avatar_url} />
              <AvatarFallback>
                {client.first_name[0]}{client.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{client.first_name} {client.last_name}</h1>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                  {client.status}
                </Badge>
                <span>Member since {new Date(client.join_date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button onClick={() => setShowBookSessionModal(true)}>
            <Calendar className="h-4 w-4 mr-2" />
            Book Session
          </Button>
          <Button variant="outline" onClick={() => setShowAddPaymentModal(true)}>
            <DollarSign className="h-4 w-4 mr-2" />
            Add Payment
          </Button>
          <Button variant="outline" onClick={() => setShowAssignPackageModal(true)}>
            <Package className="h-4 w-4 mr-2" />
            Assign Package
          </Button>
        </div>
      </div>

      {/* Client Info Sidebar */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-3">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="text-center">
                <Avatar className="h-20 w-20 mx-auto mb-2">
                  <AvatarImage src={client.avatar_url} />
                  <AvatarFallback className="text-lg">
                    {client.first_name[0]}{client.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold">{client.first_name} {client.last_name}</h3>
                <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                  {client.status}
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{client.email}</span>
                </div>
                {client.phone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{client.address}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-1">Client since</p>
                <p className="text-sm">{new Date(client.join_date).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="col-span-9">
          <Tabs defaultValue="summary" className="space-y-4">
            <TabsList className="grid w-full grid-cols-10">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="training">Training</TabsTrigger>
              <TabsTrigger value="messaging">Messaging</TabsTrigger>
              <TabsTrigger value="finances">Finances</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="uploads">Uploads</TabsTrigger>
              <TabsTrigger value="assessments">Assessments</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-4">
              {/* Services Summary */}
              <Card>
                <CardHeader className="bg-green-50">
                  <CardTitle className="flex items-center text-green-800">
                    <Package className="h-5 w-5 mr-2" />
                    Services
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Packages</p>
                      <p className="text-lg font-semibold">{stats.activePackages}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Sessions Remaining</p>
                      <p className="text-lg font-semibold">
                        {client.client_packages?.reduce((sum, pkg) => sum + (pkg.sessions_remaining || 0), 0) || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payments Summary */}
              <Card>
                <CardHeader className="bg-purple-50">
                  <CardTitle className="flex items-center text-purple-800">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Payments
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Paid</p>
                      <p className="text-lg font-semibold">DH{stats.totalSpent.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Charged</p>
                      <p className="text-lg font-semibold">DH{stats.totalSpent.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Amount Due</p>
                      <p className="text-lg font-semibold">0</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Transactions</p>
                      <p className="text-lg font-semibold">{client.payments?.length || 0}</p>
                    </div>
                  </div>
                  <div className="mt-4 text-sm">
                    <p>Last payment: {client.payments?.[0]?.payment_date ? new Date(client.payments[0].payment_date).toLocaleDateString() : 'None'}</p>
                    <p>Next payment: -</p>
                  </div>
                </CardContent>
              </Card>

              {/* Bookings Summary */}
              <Card>
                <CardHeader className="bg-blue-50">
                  <CardTitle className="flex items-center text-blue-800">
                    <Calendar className="h-5 w-5 mr-2" />
                    Bookings
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Sessions</p>
                      <p className="text-lg font-semibold">{stats.totalSessions}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Classes</p>
                      <p className="text-lg font-semibold">0</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Bookings</p>
                      <p className="text-lg font-semibold">{stats.totalSessions}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Upcoming</p>
                      <p className="text-lg font-semibold">{stats.upcomingSessions}</p>
                    </div>
                  </div>
                  <div className="mt-4 text-sm">
                    <p>Last booking: {client.sessions?.[0]?.date ? new Date(client.sessions[0].date).toLocaleDateString() : 'None'}</p>
                    <p>Next booking: {client.sessions?.find(s => new Date(s.date) > new Date())?.date ? new Date(client.sessions.find(s => new Date(s.date) > new Date()).date).toLocaleDateString() : 'None'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Training Summary */}
              <Card>
                <CardHeader className="bg-orange-50">
                  <CardTitle className="flex items-center text-orange-800">
                    <Activity className="h-5 w-5 mr-2" />
                    Training
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Assigned Workouts</p>
                      <p className="text-lg font-semibold">0</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Assigned Nutrition Plans</p>
                      <p className="text-lg font-semibold">0</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Assessments Completed</p>
                      <p className="text-lg font-semibold">{client.assessments?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Assessment</p>
                      <p className="text-lg font-semibold">
                        {client.assessments?.[0]?.assessment_date ? new Date(client.assessments[0].assessment_date).toLocaleDateString() : '-'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="services">
              <Card>
                <CardHeader>
                  <CardTitle>Client Packages</CardTitle>
                </CardHeader>
                <CardContent>
                  {client.client_packages?.length > 0 ? (
                    <div className="space-y-4">
                      {client.client_packages.map((pkg: any) => (
                        <div key={pkg.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold">{pkg.packages?.name}</h4>
                              <p className="text-sm text-muted-foreground">{pkg.packages?.description}</p>
                              <p className="text-sm">Sessions remaining: {pkg.sessions_remaining}</p>
                            </div>
                            <Badge variant={pkg.status === 'active' ? 'default' : 'secondary'}>
                              {pkg.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No packages assigned</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bookings">
              <Card>
                <CardHeader>
                  <CardTitle>Session History</CardTitle>
                </CardHeader>
                <CardContent>
                  {client.sessions?.length > 0 ? (
                    <div className="space-y-4">
                      {client.sessions.map((session: any) => (
                        <div key={session.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold">{new Date(session.date).toLocaleDateString()}</p>
                              <p className="text-sm text-muted-foreground">
                                {session.start_time} - {session.end_time}
                              </p>
                              <p className="text-sm">{session.type} session</p>
                              {session.notes && <p className="text-sm text-muted-foreground mt-1">{session.notes}</p>}
                            </div>
                            <Badge variant={
                              session.status === 'completed' ? 'default' : 
                              session.status === 'scheduled' ? 'secondary' : 'destructive'
                            }>
                              {session.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No sessions booked</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="finances">
              <Card>
                <CardHeader>
                  <CardTitle>Payment History</CardTitle>
                </CardHeader>
                <CardContent>
                  {client.payments?.length > 0 ? (
                    <div className="space-y-4">
                      {client.payments.map((payment: any) => (
                        <div key={payment.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold">DH{payment.amount}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(payment.payment_date).toLocaleDateString()}
                              </p>
                              <p className="text-sm">{payment.description || 'Payment'}</p>
                            </div>
                            <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                              {payment.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No payment history</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes">
              <Card>
                <CardHeader>
                  <CardTitle>Client Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  {client.notes?.length > 0 ? (
                    <div className="space-y-4">
                      {client.notes.map((note: any) => (
                        <div key={note.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold">{note.title || 'Note'}</h4>
                              <p className="text-sm text-muted-foreground">
                                {new Date(note.created_at).toLocaleDateString()}
                              </p>
                              <p className="text-sm mt-2">{note.content}</p>
                            </div>
                            <Badge variant="outline">{note.note_type}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No notes available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="training">
              <Card>
                <CardHeader>
                  <CardTitle>Training & Assessments</CardTitle>
                </CardHeader>
                <CardContent>
                  {client.assessments?.length > 0 ? (
                    <div className="space-y-4">
                      {client.assessments.map((assessment: any) => (
                        <div key={assessment.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold">Assessment</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(assessment.assessment_date).toLocaleDateString()}
                              </p>
                              {assessment.weight && <p className="text-sm">Weight: {assessment.weight} kg</p>}
                              {assessment.body_fat_percentage && <p className="text-sm">Body Fat: {assessment.body_fat_percentage}%</p>}
                              {assessment.assessment_notes && <p className="text-sm mt-2">{assessment.assessment_notes}</p>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No assessments completed</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messaging">
              <Card>
                <CardHeader>
                  <CardTitle>Messages</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Messaging feature coming soon</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="uploads">
              <Card>
                <CardHeader>
                  <CardTitle>Documents & Files</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">No documents uploaded</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assessments">
              <Card>
                <CardHeader>
                  <CardTitle>Assessment History</CardTitle>
                </CardHeader>
                <CardContent>
                  {client.assessments?.length > 0 ? (
                    <div className="space-y-4">
                      {client.assessments.map((assessment: any) => (
                        <div key={assessment.id} className="border rounded-lg p-4">
                          <h4 className="font-semibold">Assessment - {new Date(assessment.assessment_date).toLocaleDateString()}</h4>
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            {assessment.weight && (
                              <div>
                                <p className="text-sm text-muted-foreground">Weight</p>
                                <p className="font-semibold">{assessment.weight} kg</p>
                              </div>
                            )}
                            {assessment.body_fat_percentage && (
                              <div>
                                <p className="text-sm text-muted-foreground">Body Fat</p>
                                <p className="font-semibold">{assessment.body_fat_percentage}%</p>
                              </div>
                            )}
                          </div>
                          {assessment.assessment_notes && (
                            <p className="text-sm text-muted-foreground mt-2">{assessment.assessment_notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No assessments available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chat">
              <Card>
                <CardHeader>
                  <CardTitle>Chat History</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Chat feature coming soon</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modals */}
      <BookSessionModal
        isOpen={showBookSessionModal}
        onClose={() => setShowBookSessionModal(false)}
        onSuccess={() => {
          setShowBookSessionModal(false);
          loadClientDetails();
        }}
        clientId={client.id}
      />
      
      <AddPaymentModal
        isOpen={showAddPaymentModal}
        onClose={() => {
          setShowAddPaymentModal(false);
          loadClientDetails();
        }}
        clientId={client.id}
      />
      
      <AssignPackageModal
        isOpen={showAssignPackageModal}
        onClose={() => {
          setShowAssignPackageModal(false);
          loadClientDetails();
        }}
        clientId={client.id}
      />
    </div>
  );
};

export default ClientDetails;