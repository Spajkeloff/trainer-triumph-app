import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { clientService, ClientWithDetails } from "@/services/clientService";
import { paymentService } from "@/services/paymentService";
import { financeService } from "@/services/financeService";
import { 
  ArrowLeft,
  Edit,
  Package,
  Calendar,
  DollarSign,
  Clock,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  Plus,
  User,
  Activity,
  MessageSquare,
  FileText,
  Upload,
  Users,
  Dumbbell,
  Heart,
  Target,
  Scale,
  BookOpen,
  StickyNote,
  Trash2
} from "lucide-react";
import AssignPackageModal from "@/components/AssignPackageModal";
import AddPaymentModal from "@/components/AddPaymentModal";
import EditPackageModal from "@/components/EditPackageModal";
import BookSessionModal from "@/components/BookSessionModal";

const ClientProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [client, setClient] = useState<ClientWithDetails | null>(null);
  const [clientBalance, setClientBalance] = useState<any>(null);
  const [clientTransactions, setClientTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("summary");
  const [showAssignPackage, setShowAssignPackage] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showEditPackage, setShowEditPackage] = useState(false);
  const [showBookSession, setShowBookSession] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [paymentData, setPaymentData] = useState<any>(null);

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      await financeService.deleteTransaction(transactionId);
      
      toast({
        title: "Success",
        description: "Transaction deleted successfully",
        variant: "default",
      });
      
      // Refresh client data to update the transaction list
      await fetchClientData();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive",
      });
    }
  };

  const handleConvertToClient = async (clientId: string) => {
    try {
      await clientService.update(clientId, { status: 'active' });
      toast({
        title: "Success",
        description: "Lead converted to client successfully",
      });
      fetchClientData();
    } catch (error) {
      console.error('Error converting client:', error);
      toast({
        title: "Error",
        description: "Failed to convert lead to client",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (id) {
      fetchClientData();
    }
  }, [id]);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      
      const clientData = await clientService.getById(id!);
      
      // Calculate balance using new finance service
      const [clientBalances, allTransactions] = await Promise.all([
        financeService.getClientBalances(),
        financeService.getAllTransactions()
      ]);
      
      const balance = clientBalances.find(b => b.client_id === id);
      const transactions = allTransactions.filter(t => t.client_id === id);
      
      const balanceData = balance ? {
        totalCharges: balance.total_charges,
        totalPaid: balance.total_payments,
        balance: balance.balance,
        pendingPayments: balance.balance > 0 ? balance.balance : 0
      } : {
        totalCharges: 0,
        totalPaid: 0,
        balance: 0,
        pendingPayments: 0
      };

      setClient(clientData);
      setClientBalance(balanceData);
      setClientTransactions(transactions);

    } catch (error) {
      console.error('Error fetching client data:', error);
      toast({
        title: "Error",
        description: "Failed to load client data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: "default" as const, className: "bg-success text-success-foreground" },
      inactive: { variant: "secondary" as const, className: "" },
      lead: { variant: "outline" as const, className: "border-warning text-warning" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    return <Badge variant={config.variant} className={config.className}>{status.toUpperCase()}</Badge>;
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="space-y-6">
                <div className="h-64 bg-muted rounded"></div>
                <div className="h-64 bg-muted rounded"></div>
              </div>
              <div className="lg:col-span-3 space-y-6">
                <div className="h-64 bg-muted rounded"></div>
                <div className="h-64 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto text-center">
          <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Client Not Found</h1>
          <p className="text-muted-foreground mb-6">The client you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/clients')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/clients')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Clients
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {client.first_name} {client.last_name}
              </h1>
              <p className="text-muted-foreground">Client since {new Date(client.join_date).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(client.status)}
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit Client
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Client Information */}
          <div className="space-y-6">
            {/* Client Avatar & Basic Info */}
            <Card>
              <CardContent className="p-6 text-center">
                <Avatar className="h-24 w-24 mx-auto mb-4">
                  <AvatarImage src={client.avatar_url} alt={`${client.first_name} ${client.last_name}`} />
                  <AvatarFallback className="text-lg">
                    {client.first_name[0]}{client.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-semibold">{client.first_name} {client.last_name}</h3>
                <div className="mt-2">{getStatusBadge(client.status)}</div>
                {client.date_of_birth && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Age: {calculateAge(client.date_of_birth)} years
                  </p>
                )}
                
                {/* Action Buttons */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowBookSession(true)}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Session
                  </Button>
                  {client.status === "lead" && (
                    <Button size="sm" className="flex-1" onClick={() => handleConvertToClient(client.id)}>
                      Convert to Client
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{client.email}</span>
                </div>
                {client.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{client.phone}</span>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{client.address}</span>
                  </div>
                )}
                {client.date_of_birth && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Born: {new Date(client.date_of_birth).toLocaleDateString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            {(client.emergency_contact_name || client.emergency_contact_phone) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Emergency Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {client.emergency_contact_name && (
                    <p className="text-sm"><strong>Name:</strong> {client.emergency_contact_name}</p>
                  )}
                  {client.emergency_contact_phone && (
                    <p className="text-sm"><strong>Phone:</strong> {client.emergency_contact_phone}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Packages</span>
                  <span className="font-medium">{client.client_packages?.filter(p => p.status === 'active').length || 0}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Sessions</span>
                  <span className="font-medium">{client.sessions?.length || 0}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Outstanding Balance</span>
                  <span className="font-medium text-warning">
                    AED {clientBalance?.balance || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-6 lg:grid-cols-11">
                <TabsTrigger value="summary" className="text-xs">Summary</TabsTrigger>
                <TabsTrigger value="services" className="text-xs">Services</TabsTrigger>
                <TabsTrigger value="bookings" className="text-xs">Bookings</TabsTrigger>
                <TabsTrigger value="training" className="text-xs">Training</TabsTrigger>
                <TabsTrigger value="messaging" className="text-xs">Messages</TabsTrigger>
                <TabsTrigger value="finances" className="text-xs">Finances</TabsTrigger>
                <TabsTrigger value="form" className="text-xs">Form</TabsTrigger>
                <TabsTrigger value="family" className="text-xs">Family</TabsTrigger>
                <TabsTrigger value="notes" className="text-xs">Notes</TabsTrigger>
                <TabsTrigger value="uploads" className="text-xs">Uploads</TabsTrigger>
                <TabsTrigger value="chat" className="text-xs">Chat</TabsTrigger>
              </TabsList>

              {/* Summary Tab */}
              <TabsContent value="summary" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Services Card */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="flex items-center">
                        <Package className="h-5 w-5 mr-2" />
                        Services
                      </CardTitle>
                      <Button size="sm" onClick={() => setShowAssignPackage(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Assign
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {client.client_packages && client.client_packages.length > 0 ? (
                        <div className="space-y-3">
                          {client.client_packages.slice(0, 3).map((pkg) => (
                            <div key={pkg.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                              <div>
                                <p className="font-medium text-sm">{pkg.packages?.name || 'Unknown Package'}</p>
                                <p className="text-xs text-muted-foreground">{pkg.sessions_remaining} sessions left</p>
                                <p className="text-xs text-muted-foreground">Expires: {new Date(pkg.expiry_date).toLocaleDateString()}</p>
                              </div>
                              <Badge variant={pkg.status === 'active' ? 'default' : 'secondary'} className={pkg.status === 'active' ? 'bg-success text-success-foreground' : ''}>
                                {pkg.status.toUpperCase()}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">No active packages</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Bookings Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Calendar className="h-5 w-5 mr-2" />
                        Recent Bookings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {client.sessions && client.sessions.length > 0 ? (
                        <div className="space-y-3">
                          {client.sessions.slice(0, 3).map((session) => (
                            <div key={session.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                              <div>
                                <p className="font-medium text-sm">{new Date(session.date).toLocaleDateString()}</p>
                                <p className="text-xs text-muted-foreground">{session.start_time} - {session.end_time}</p>
                              </div>
                              {getStatusBadge(session.status)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">No recent sessions</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Payments Card */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="flex items-center">
                        <DollarSign className="h-5 w-5 mr-2" />
                        Payments
                      </CardTitle>
                      <Button size="sm" onClick={() => setShowAddPayment(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Total Paid:</span>
                          <span className="text-sm font-medium">AED {clientBalance?.totalPaid || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Total Charges:</span>
                          <span className="text-sm font-medium">AED {clientBalance?.totalCharges || 0}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Balance:</span>
                          <span className={`text-sm font-bold ${clientBalance?.balance > 0 ? 'text-destructive' : 'text-success'}`}>
                            AED {clientBalance?.balance || 0}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Training Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Dumbbell className="h-5 w-5 mr-2" />
                        Training Progress
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {client.assessments && client.assessments.length > 0 ? (
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Latest Assessment:</span>
                            <span className="text-sm font-medium">
                              {new Date(client.assessments[0].assessment_date).toLocaleDateString()}
                            </span>
                          </div>
                          {client.assessments[0].weight && (
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Weight:</span>
                              <span className="text-sm font-medium">{client.assessments[0].weight} kg</span>
                            </div>
                          )}
                          {client.assessments[0].fitness_level && (
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Fitness Level:</span>
                              <Badge variant="outline">{client.assessments[0].fitness_level}</Badge>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">No assessments recorded</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Goals and Medical Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Goals */}
                  {(client.fitness_goals || client.goals) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Target className="h-5 w-5 mr-2" />
                          Fitness Goals
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{client.fitness_goals || client.goals}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Medical Information */}
                  {(client.medical_conditions || client.injuries || client.medications) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Heart className="h-5 w-5 mr-2" />
                          Medical Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {client.medical_conditions && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Conditions:</p>
                            <p className="text-sm">{client.medical_conditions}</p>
                          </div>
                        )}
                        {client.injuries && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Injuries:</p>
                            <p className="text-sm">{client.injuries}</p>
                          </div>
                        )}
                        {client.medications && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Medications:</p>
                            <p className="text-sm">{client.medications}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* Services Tab */}
              <TabsContent value="services" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Services & Packages</h2>
                  <Button onClick={() => setShowAssignPackage(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Assign Package
                  </Button>
                </div>
                
                {client.client_packages && client.client_packages.length > 0 ? (
                  <div className="grid gap-4">
                    {client.client_packages.map((pkg) => (
                      <Card key={pkg.id}>
                        <CardHeader className="pb-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">{pkg.packages?.name || 'Unknown Package'}</CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                                Expires on {new Date(pkg.expiry_date).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant={pkg.status === 'active' ? 'default' : 'secondary'} className={pkg.status === 'active' ? 'bg-success text-success-foreground' : ''}>
                              {pkg.status.toUpperCase()}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <p className="text-sm font-medium">Sessions Remaining</p>
                              <p className="text-2xl font-bold text-primary">{pkg.sessions_remaining}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Total Sessions</p>
                              <p className="text-lg font-semibold">{pkg.packages?.sessions_included || 0}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Expiry Date</p>
                              <p className="text-lg font-semibold">{new Date(pkg.expiry_date).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Package Price</p>
                              <p className="text-lg font-semibold">AED {pkg.packages?.price || 0}</p>
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => {
                                setSelectedPackage(pkg);
                                setShowEditPackage(true);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Package
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No packages assigned</h3>
                      <p className="text-muted-foreground mb-4">
                        Assign training packages to get started with this client.
                      </p>
                      <Button onClick={() => setShowAssignPackage(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Assign First Package
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="bookings" className="space-y-6">
                <div className="space-y-4">
                  {/* Upcoming Sessions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Clock className="h-5 w-5 mr-2" />
                        Upcoming
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {client.sessions && client.sessions.length > 0 ? (
                        <div className="space-y-3">
                          {client.sessions
                            .filter(session => {
                              const sessionDate = new Date(session.date);
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              // Only show scheduled upcoming sessions, not cancelled or deleted ones
                              return sessionDate >= today && session.status === 'scheduled';
                            })
                            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                            .map((session) => (
                              <div key={session.id} className="flex justify-between items-center p-4 bg-muted rounded-lg">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-4">
                                    <div>
                                      <p className="font-medium text-sm">
                                        {new Date(session.date).toLocaleDateString('en-US', { 
                                          weekday: 'short', 
                                          month: 'short', 
                                          day: 'numeric' 
                                        })}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {session.start_time} - {session.end_time}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">{session.type}</p>
                                      {session.location && (
                                        <p className="text-xs text-muted-foreground">{session.location}</p>
                                      )}
                                    </div>
                                    {session.price && (
                                      <div>
                                        <p className="text-sm font-medium">AED {session.price}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <Badge variant={session.status === 'scheduled' ? 'default' : 'secondary'}>
                                  {session.status.toUpperCase()}
                                </Badge>
                              </div>
                            ))}
                          {client.sessions.filter(session => {
                            const sessionDate = new Date(session.date);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            // Only show scheduled upcoming sessions, not cancelled or deleted ones
                            return sessionDate >= today && session.status === 'scheduled';
                          }).length === 0 && (
                            <div className="text-center py-8">
                              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                              <p className="text-muted-foreground">No upcoming bookings</p>
                              <Button 
                                size="sm" 
                                className="mt-2"
                                onClick={() => navigate('/calendar')}
                              >
                                + New booking
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No upcoming bookings</p>
                          <Button 
                            size="sm" 
                            className="mt-2"
                            onClick={() => navigate('/calendar')}
                          >
                            + New booking
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Past Sessions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Activity className="h-5 w-5 mr-2" />
                        Past Sessions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {client.sessions && client.sessions.length > 0 ? (
                        <div className="space-y-3">
                          {client.sessions
                            .filter(session => {
                              const sessionDate = new Date(session.date);
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              // Show past sessions that were completed, or cancelled sessions that were reconciled
                              // Don't show sessions that were just deleted/cancelled without reconciliation
                              return (sessionDate < today && session.status !== 'scheduled') || 
                                     (session.status === 'completed' || session.status === 'cancelled');
                            })
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .slice(0, 10)
                            .map((session) => (
                              <div key={session.id} className="flex justify-between items-center p-4 bg-muted rounded-lg">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-4">
                                    <div>
                                      <p className="font-medium text-sm">
                                        {new Date(session.date).toLocaleDateString('en-US', { 
                                          weekday: 'short', 
                                          month: 'short', 
                                          day: 'numeric' 
                                        })}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {session.start_time} - {session.end_time}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">{session.type}</p>
                                      {session.location && (
                                        <p className="text-xs text-muted-foreground">{session.location}</p>
                                      )}
                                    </div>
                                    {session.price && (
                                      <div>
                                        <p className="text-sm font-medium">AED {session.price}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {session.type?.includes('Trial') ? 
                                            (clientTransactions?.some(t => 
                                              t.reference_type === 'session' && 
                                              t.reference_id === session.id && 
                                              t.transaction_type === 'payment'
                                            ) ? 'Paid' : 'Payment Overdue') 
                                            : (session.status === 'completed' ? 'Paid' : 'Charged')
                                          }
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge 
                                    variant={
                                      session.status === 'completed' ? 'default' : 
                                      session.status === 'cancelled' ? 'destructive' : 
                                      'secondary'
                                    }
                                    className={
                                      session.status === 'completed' ? 'bg-success text-success-foreground' : ''
                                    }
                                  >
                                    {session.status.toUpperCase()}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          {client.sessions.filter(session => {
                            const sessionDate = new Date(session.date);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            // Show past sessions that were completed, or cancelled sessions that were reconciled
                            // Don't show sessions that were just deleted/cancelled without reconciliation
                            return (sessionDate < today && session.status !== 'scheduled') || 
                                   (session.status === 'completed' || session.status === 'cancelled');
                          }).length === 0 && (
                            <div className="text-center py-8">
                              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                              <p className="text-muted-foreground">No past sessions</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No past sessions</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="training" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Training & Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Training tab content coming soon...</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="messaging" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Messages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Messaging tab content coming soon...</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="finances" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Financial History</h2>
                  <Button onClick={() => setShowAddPayment(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Payment
                  </Button>
                </div>
                
                {/* Financial Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Charges</p>
                          <p className="text-2xl font-bold">AED {clientBalance?.totalCharges || 0}</p>
                        </div>
                        <div className="h-8 w-8 bg-destructive/10 rounded-full flex items-center justify-center">
                          <DollarSign className="h-4 w-4 text-destructive" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
                          <p className="text-2xl font-bold">AED {clientBalance?.totalPaid || 0}</p>
                        </div>
                        <div className="h-8 w-8 bg-success/10 rounded-full flex items-center justify-center">
                          <DollarSign className="h-4 w-4 text-success" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Pending Payments</p>
                          <p className="text-2xl font-bold">AED {clientBalance?.pendingPayments || 0}</p>
                        </div>
                        <div className="h-8 w-8 bg-warning/10 rounded-full flex items-center justify-center">
                          <Clock className="h-4 w-4 text-warning" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Balance</p>
                          <p className={`text-2xl font-bold ${clientBalance?.balance > 0 ? 'text-destructive' : 'text-success'}`}>
                            AED {clientBalance?.balance || 0}
                          </p>
                        </div>
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${clientBalance?.balance > 0 ? 'bg-destructive/10' : 'bg-success/10'}`}>
                          <DollarSign className={`h-4 w-4 ${clientBalance?.balance > 0 ? 'text-destructive' : 'text-success'}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Transaction History */}
                <Card>
                  <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                  </CardHeader>
                  <CardContent>
                     {clientTransactions && clientTransactions.length > 0 ? (
                       <div className="space-y-3">
                         {clientTransactions.map((transaction) => (
                            <div key={transaction.id} className="flex justify-between items-center p-4 border rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium">{transaction.description || 'Transaction'}</p>
                                  <div className="flex items-center space-x-4">
                                    <span className={`font-bold ${transaction.transaction_type === 'payment' ? 'text-success' : 'text-destructive'}`}>
                                      {transaction.transaction_type === 'payment' ? '+' : ''}AED {Math.abs(transaction.amount)}
                                    </span>
                                    <Badge variant={transaction.status === 'completed' ? 'default' : 'outline'} className={transaction.status === 'completed' ? 'bg-success text-success-foreground' : ''}>
                                      {transaction.status.toUpperCase()}
                                    </Badge>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteTransaction(transaction.id)}
                                      className="text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(transaction.transaction_date).toLocaleDateString()} • {transaction.payment_method?.replace('_', ' ').toUpperCase() || transaction.category?.toUpperCase()}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {transaction.transaction_type === 'payment' ? 'Payment Received' : 'Package Charge'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                       </div>
                      ) : (
                       <div className="text-center py-12">
                         <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                         <h3 className="text-lg font-medium mb-2">No transactions yet</h3>
                         <p className="text-muted-foreground mb-4">Transactions will appear here once recorded.</p>
                         <Button onClick={() => setShowAddPayment(true)}>
                           <Plus className="h-4 w-4 mr-2" />
                           Record First Payment
                         </Button>
                       </div>
                      )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="form" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Client Assessment Form</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Assessment form content coming soon...</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="family" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Family Accounts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Family accounts content coming soon...</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notes" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Notes content coming soon...</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="uploads" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Documents & Uploads</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Uploads content coming soon...</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="chat" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Live Chat</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Chat content coming soon...</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AssignPackageModal
        isOpen={showAssignPackage}
        onClose={() => setShowAssignPackage(false)}
        clientId={id!}
        onSuccess={fetchClientData}
        onPaymentRequired={(data) => {
          setPaymentData(data);
          setShowAddPayment(true);
        }}
      />

      <AddPaymentModal
        isOpen={showAddPayment}
        onClose={() => {
          setShowAddPayment(false);
          setPaymentData(null);
        }}
        clientId={id!}
        onSuccess={fetchClientData}
        prefilledAmount={paymentData?.amount}
        prefilledDescription={paymentData ? `Payment for ${paymentData.packageName}` : undefined}
      />

      <EditPackageModal
        isOpen={showEditPackage}
        onClose={() => {
          setShowEditPackage(false);
          setSelectedPackage(null);
        }}
        clientPackage={selectedPackage}
        onSuccess={fetchClientData}
      />

      <BookSessionModal
        isOpen={showBookSession}
        onClose={() => setShowBookSession(false)}
        onSuccess={fetchClientData}
      />
    </div>
  );
};

export default ClientProfile;
