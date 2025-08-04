import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { clientService, ClientWithDetails } from '@/services/clientService';
import { sessionService } from '@/services/sessionService';
import { packageService } from '@/services/packageService';
import { paymentService } from '@/services/paymentService';
import { financeService } from '@/services/financeService';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import BookSessionModal from '@/components/BookSessionModal';
import AddPaymentModal from '@/components/AddPaymentModal';
import AssignPackageModal from '@/components/AssignPackageModal';
import EditPackageModal from '@/components/EditPackageModal';
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
  MapPin,
  Edit,
  Plus,
  Trash2,
  Settings
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
    activePackages: 0,
    sessionsRemaining: 0,
    totalCharges: 0,
    lastPayment: null as string | null,
    nextSession: null as any
  });
  
  const [showBookSessionModal, setShowBookSessionModal] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showAssignPackageModal, setShowAssignPackageModal] = useState(false);
  const [showEditPackageModal, setShowEditPackageModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [editMode, setEditMode] = useState<{[key: string]: boolean}>({});
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadClientDetails();
    }
  }, [id]);

  const loadClientDetails = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // Load client details with all related data
      const [clientData, clientSessions, clientPayments, clientBalance] = await Promise.all([
        clientService.getById(id),
        sessionService.getAll().then(sessions => sessions.filter(s => s.client_id === id)),
        paymentService.getByClient(id),
        paymentService.getClientBalance(id)
      ]);
      
      if (clientData) {
        // Merge the additional data into the client object for easy access in components
        const enhancedClient = {
          ...clientData,
          sessions: clientSessions,
          payments: clientPayments
        };
        setClient(enhancedClient);
        calculateStats(clientData, clientSessions, clientPayments, clientBalance);
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

  const calculateStats = (clientData: ClientWithDetails, sessions: any[], payments: any[], balance: any) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const totalSessions = sessions?.length || 0;
    const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0;
    const upcomingSessions = sessions?.filter(s => s.status === 'scheduled' && s.date >= todayStr).length || 0;
    const totalSpent = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const activePackages = clientData.client_packages?.filter(p => p.status === 'active').length || 0;
    const sessionsRemaining = clientData.client_packages?.reduce((sum, pkg) => sum + (pkg.sessions_remaining || 0), 0) || 0;

    setStats({
      totalSessions,
      completedSessions,
      upcomingSessions,
      totalSpent,
      balance: balance?.balance || 0,
      activePackages,
      sessionsRemaining,
      totalCharges: balance?.total_charges || 0,
      lastPayment: payments?.[0]?.payment_date,
      nextSession: sessions?.find(s => s.status === 'scheduled' && new Date(s.date) >= today)
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!client) {
    return <div className="flex justify-center items-center h-64">Client not found</div>;
  }

  const toggleEditMode = (itemId: string) => {
    setEditMode(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const updatePayment = async (paymentId: string, field: string, value: any) => {
    try {
      // Implement payment update logic here
      await loadClientDetails();
      toast({
        title: "Success",
        description: "Payment updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update payment",
        variant: "destructive",
      });
    }
  };

  const updatePackage = async (packageId: string, field: string, value: any) => {
    try {
      // Implement package update logic here
      await loadClientDetails();
      toast({
        title: "Success",
        description: "Package updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update package",
        variant: "destructive",
      });
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    try {
      // Delete the payment from the database
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId);

      if (error) throw error;

      // Don't create transaction logs for payment deletions
      // This prevents unwanted transaction entries from appearing

      toast({
        title: "Success",
        description: "Payment deleted successfully",
      });
      
      await loadClientDetails();
      setDeletePaymentId(null);
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast({
        title: "Error", 
        description: "Failed to delete payment",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
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
            <CardContent className="p-6 space-y-4">
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
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
                <CardHeader className="bg-green-50 flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center text-green-800">
                    <Package className="h-5 w-5 mr-2" />
                    Services
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => setShowAssignPackageModal(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Assign Package
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Packages</p>
                      <p className="text-lg font-semibold">{stats.activePackages}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Sessions Remaining</p>
                      <p className="text-lg font-semibold">
                        {stats.sessionsRemaining}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payments Summary */}
              <Card>
                <CardHeader className="bg-purple-50 flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center text-purple-800">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Payments
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => setShowAddPaymentModal(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Payment
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Paid</p>
                      <p className="text-lg font-semibold">DH{stats.totalSpent.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Charged</p>
                      <p className="text-lg font-semibold">DH{stats.totalCharges.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Amount Due</p>
                      <p className="text-lg font-semibold">{stats.balance > 0 ? `DH${stats.balance.toFixed(2)}` : '0'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Transactions</p>
                      <p className="text-lg font-semibold">{client?.payments?.length || 0}</p>
                    </div>
                  </div>
                  <div className="mt-4 text-sm">
                    <p>Last payment: {stats.lastPayment ? new Date(stats.lastPayment).toLocaleDateString() : 'None'}</p>
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
                <CardContent className="p-6">
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
                    <p>Last booking: {client?.sessions?.length > 0 ? new Date(Math.max(...client.sessions.map(s => new Date(s.date).getTime()))).toLocaleDateString() : 'None'}</p>
                    <p>Next booking: {stats.nextSession ? `${new Date(stats.nextSession.date).toLocaleDateString()} at ${stats.nextSession.start_time}` : 'None'}</p>
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
                <CardContent className="p-6">
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
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Client Packages</CardTitle>
                  <Button onClick={() => setShowAssignPackageModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Assign New Package
                  </Button>
                </CardHeader>
                <CardContent className="p-6">
                  {client?.client_packages?.length > 0 ? (
                    <div className="space-y-4">
                      {client.client_packages.map((pkg: any) => (
                        <div key={pkg.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold">{pkg.packages?.name}</h4>
                              <p className="text-sm text-muted-foreground">{pkg.packages?.description}</p>
                              <div className="grid grid-cols-3 gap-4 mt-2">
                                <div>
                                  <p className="text-xs text-muted-foreground">Sessions Remaining</p>
                                  {editMode[`pkg-${pkg.id}`] ? (
                                    <Input
                                      type="number"
                                      value={pkg.sessions_remaining}
                                      onChange={(e) => updatePackage(pkg.id, 'sessions_remaining', e.target.value)}
                                      onBlur={() => toggleEditMode(`pkg-${pkg.id}`)}
                                      className="h-6 text-sm"
                                      autoFocus
                                    />
                                  ) : (
                                    <p 
                                      className="text-sm font-semibold cursor-pointer hover:bg-muted rounded px-1"
                                      onClick={() => toggleEditMode(`pkg-${pkg.id}`)}
                                    >
                                      {pkg.sessions_remaining}
                                    </p>
                                  )}
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Expiry Date</p>
                                  <p className="text-sm">{new Date(pkg.expiry_date).toLocaleDateString()}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Purchase Date</p>
                                  <p className="text-sm">{new Date(pkg.purchase_date).toLocaleDateString()}</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <Badge variant={pkg.status === 'active' ? 'default' : 'secondary'}>
                                {pkg.status}
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedPackage(pkg);
                                  setShowEditPackageModal(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No packages assigned</p>
                      <Button 
                        className="mt-4"
                        onClick={() => setShowAssignPackageModal(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Assign First Package
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bookings">
              <Card>
                <CardHeader>
                  <CardTitle>Session History</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {client?.sessions?.length > 0 ? (
                    <div className="space-y-4">
                      {client.sessions
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((session: any) => (
                        <div key={session.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold">{new Date(session.date).toLocaleDateString()}</p>
                              <p className="text-sm text-muted-foreground">
                                {session.start_time} - {session.end_time}
                              </p>
                              <p className="text-sm">{session.type} session</p>
                              {session.location && <p className="text-sm text-muted-foreground">Location: {session.location}</p>}
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
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Payment History</CardTitle>
                  <div className="flex space-x-2">
                    <Button onClick={() => setShowAddPaymentModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Payment
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {client?.payments?.length > 0 ? (
                    <div className="space-y-4">
                      {client.payments
                        .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
                        .map((payment: any) => (
                        <div key={payment.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                {editMode[`payment-amount-${payment.id}`] ? (
                                  <Input
                                    type="number"
                                    value={payment.amount}
                                    onChange={(e) => updatePayment(payment.id, 'amount', e.target.value)}
                                    onBlur={() => toggleEditMode(`payment-amount-${payment.id}`)}
                                    className="h-6 text-sm w-24"
                                    autoFocus
                                  />
                                ) : (
                                  <p 
                                    className="font-semibold cursor-pointer hover:bg-muted rounded px-1"
                                    onClick={() => toggleEditMode(`payment-amount-${payment.id}`)}
                                  >
                                    DH{payment.amount}
                                  </p>
                                )}
                                {editMode[`payment-status-${payment.id}`] ? (
                                  <Select
                                    value={payment.status}
                                    onValueChange={(value) => {
                                      updatePayment(payment.id, 'status', value);
                                      toggleEditMode(`payment-status-${payment.id}`);
                                    }}
                                  >
                                    <SelectTrigger className="h-6 text-xs w-24">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="completed">Completed</SelectItem>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="failed">Failed</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Badge 
                                    variant={payment.status === 'completed' ? 'default' : 'secondary'}
                                    className="cursor-pointer"
                                    onClick={() => toggleEditMode(`payment-status-${payment.id}`)}
                                  >
                                    {payment.status}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {new Date(payment.payment_date).toLocaleDateString()}
                              </p>
                              {editMode[`payment-desc-${payment.id}`] ? (
                                <Input
                                  value={payment.description || ''}
                                  onChange={(e) => updatePayment(payment.id, 'description', e.target.value)}
                                  onBlur={() => toggleEditMode(`payment-desc-${payment.id}`)}
                                  className="h-6 text-sm mt-1"
                                  autoFocus
                                />
                              ) : (
                                <p 
                                  className="text-sm cursor-pointer hover:bg-muted rounded px-1"
                                  onClick={() => toggleEditMode(`payment-desc-${payment.id}`)}
                                >
                                  {payment.description || 'Payment'}
                                </p>
                              )}
                              {editMode[`payment-method-${payment.id}`] ? (
                                <Select
                                  value={payment.payment_method}
                                  onValueChange={(value) => {
                                    updatePayment(payment.id, 'payment_method', value);
                                    toggleEditMode(`payment-method-${payment.id}`);
                                  }}
                                >
                                  <SelectTrigger className="h-6 text-xs w-32 mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="card">Card</SelectItem>
                                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                    <SelectItem value="check">Check</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <p 
                                  className="text-sm text-muted-foreground cursor-pointer hover:bg-muted rounded px-1"
                                  onClick={() => toggleEditMode(`payment-method-${payment.id}`)}
                                >
                                  Method: {payment.payment_method}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  setShowAddPaymentModal(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeletePaymentId(payment.id)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No payment history</p>
                      <Button 
                        className="mt-4"
                        onClick={() => setShowAddPaymentModal(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Payment
                      </Button>
                    </div>
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
        onClose={() => {
          setShowBookSessionModal(false);
        }}
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
          setSelectedPayment(null);
        }}
        clientId={client.id}
        onSuccess={() => {
          setShowAddPaymentModal(false);
          setSelectedPayment(null);
          loadClientDetails();
        }}
      />
      
      <AssignPackageModal
        isOpen={showAssignPackageModal}
        onClose={() => {
          setShowAssignPackageModal(false);
        }}
        onSuccess={() => {
          setShowAssignPackageModal(false);
          loadClientDetails();
        }}
        clientId={client.id}
      />

      {selectedPackage && (
        <EditPackageModal
          isOpen={showEditPackageModal}
          onClose={() => {
            setShowEditPackageModal(false);
            setSelectedPackage(null);
          }}
          clientPackage={selectedPackage}
        />
      )}

      {/* Delete Payment Confirmation */}
      <AlertDialog open={!!deletePaymentId} onOpenChange={() => setDeletePaymentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payment? This action will be logged and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePaymentId && handleDeletePayment(deletePaymentId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Payment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClientDetails;