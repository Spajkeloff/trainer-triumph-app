import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
  Plus
} from "lucide-react";
import AssignPackageModal from "@/components/AssignPackageModal";
import AddPaymentModal from "@/components/AddPaymentModal";

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  emergency_contact?: string;
  goals?: string;
  medical_notes?: string;
  status: string;
  join_date: string;
}

interface ClientPackage {
  id: string;
  sessions_remaining: number;
  expiry_date: string;
  status: string;
  packages: {
    name: string;
    sessions_included: number;
    price: number;
  };
}

interface Session {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
}

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  description?: string;
  status: string;
  payment_method: string;
}

const ClientProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [client, setClient] = useState<Client | null>(null);
  const [packages, setPackages] = useState<ClientPackage[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignPackage, setShowAssignPackage] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);

  useEffect(() => {
    if (id) {
      fetchClientData();
    }
  }, [id]);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      
      // Fetch client details
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (clientError) throw clientError;
      setClient(clientData);

      // Fetch client packages
      const { data: packagesData, error: packagesError } = await supabase
        .from('client_packages')
        .select(`
          *,
          packages (
            name,
            sessions_included,
            price
          )
        `)
        .eq('client_id', id);

      if (packagesError) throw packagesError;
      setPackages(packagesData || []);

      // Fetch sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .eq('client_id', id)
        .order('date', { ascending: false })
        .limit(10);

      if (sessionsError) throw sessionsError;
      setSessions(sessionsData || []);

      // Fetch payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('client_id', id)
        .order('payment_date', { ascending: false })
        .limit(10);

      if (paymentsError) throw paymentsError;
      setPayments(paymentsData || []);

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
      lead: { variant: "outline" as const, className: "" },
      expired: { variant: "destructive" as const, className: "" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    return <Badge variant={config.variant} className={config.className}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-muted rounded"></div>
                <div className="h-64 bg-muted rounded"></div>
              </div>
              <div className="space-y-6">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{client.email}</span>
                    </div>
                    {client.phone && (
                      <div className="flex items-center space-x-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    {client.address && (
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{client.address}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    {client.emergency_contact && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Emergency Contact</p>
                        <p>{client.emergency_contact}</p>
                      </div>
                    )}
                    {client.goals && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Goals</p>
                        <p className="text-sm">{client.goals}</p>
                      </div>
                    )}
                    {client.medical_notes && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Medical Notes</p>
                        <p className="text-sm text-destructive">{client.medical_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Packages */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Active Packages
                  </CardTitle>
                  <Button onClick={() => setShowAssignPackage(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Assign Package
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {packages.length > 0 ? (
                  <div className="space-y-4">
                    {packages.map((pkg) => (
                      <div key={pkg.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{pkg.packages.name}</h3>
                          {getStatusBadge(pkg.status)}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Sessions Remaining</p>
                            <p className="font-medium">{pkg.sessions_remaining}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Expires</p>
                            <p className="font-medium">{new Date(pkg.expiry_date).toLocaleDateString()}</p>
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
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setShowAssignPackage(true)}
                    >
                      Assign First Package
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Sessions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Recent Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sessions.length > 0 ? (
                  <div className="space-y-4">
                    {sessions.map((session) => (
                      <div key={session.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {new Date(session.date).toLocaleDateString()}
                            </span>
                            <span className="text-muted-foreground">
                              {session.start_time} - {session.end_time}
                            </span>
                          </div>
                          {getStatusBadge(session.status)}
                        </div>
                        {session.notes && (
                          <p className="text-sm text-muted-foreground">{session.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No sessions recorded</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment History */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Payment History
                  </CardTitle>
                  <Button size="sm" onClick={() => setShowAddPayment(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Payment
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {payments.length > 0 ? (
                  <div className="space-y-4">
                    {payments.map((payment) => (
                      <div key={payment.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">AED {payment.amount}</span>
                          {getStatusBadge(payment.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">{payment.payment_method}</p>
                        {payment.description && (
                          <p className="text-sm">{payment.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No payments recorded</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={() => setShowAddPayment(true)}
                    >
                      Add First Payment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Sessions</span>
                    <span className="font-medium">{sessions.length}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Active Packages</span>
                    <span className="font-medium">{packages.filter(p => p.status === 'active').length}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Payments</span>
                    <span className="font-medium">
                      AED {payments.reduce((sum, p) => sum + Number(p.amount), 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AssignPackageModal
        isOpen={showAssignPackage}
        onClose={() => setShowAssignPackage(false)}
        clientId={id!}
        onSuccess={fetchClientData}
      />

      <AddPaymentModal
        isOpen={showAddPayment}
        onClose={() => setShowAddPayment(false)}
        clientId={id!}
        onSuccess={fetchClientData}
      />
    </div>
  );
};

export default ClientProfile;