import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { 
  Search,
  Plus,
  Filter,
  User,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import AddClientModal from "@/components/AddClientModal";

const Clients = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "active" | "leads">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data: clientsData, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setClients(clientsData || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Error",
        description: "Failed to load clients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const filteredClients = clients.filter(client => {
    const clientName = `${client.first_name} ${client.last_name}`;
    const matchesSearch = clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || client.status === filterType;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success text-success-foreground">Active</Badge>;
      case "lead":
        return <Badge variant="outline">Lead</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Clients</h1>
            <p className="text-muted-foreground">Manage your client relationships and training programs</p>
          </div>
          <Button 
            className="bg-primary hover:bg-primary/90"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Client
          </Button>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterType === "all" ? "default" : "outline"}
                  onClick={() => setFilterType("all")}
                  size="sm"
                >
                  All Clients ({clients.length})
                </Button>
                <Button
                  variant={filterType === "active" ? "default" : "outline"}
                  onClick={() => setFilterType("active")}
                  size="sm"
                >
                  Active ({clients.filter(c => c.status === "active").length})
                </Button>
                <Button
                  variant={filterType === "leads" ? "default" : "outline"}
                  onClick={() => setFilterType("leads")}
                  size="sm"
                >
                  Leads ({clients.filter(c => c.status === "lead").length})
                </Button>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <Card key={client.id} className="hover:shadow-elevated transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle 
                        className="text-lg hover:text-primary cursor-pointer transition-colors"
                        onClick={() => navigate(`/clients/${client.id}`)}
                      >
                        {client.first_name} {client.last_name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Joined {new Date(client.join_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(client.status)}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/clients/${client.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Client
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Client
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  {/* Contact Info */}
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Mail className="h-4 w-4 mr-2" />
                      {client.email}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Phone className="h-4 w-4 mr-2" />
                      {client.phone}
                    </div>
                  </div>

                  {/* Goals */}
                  {client.goals && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium text-card-foreground">Goals</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {client.goals}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Session
                  </Button>
                  {client.status === "lead" && (
                    <Button size="sm" className="flex-1">
                      Convert to Client
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredClients.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-card-foreground mb-2">
                No clients found
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterType !== "all" 
                  ? "Try adjusting your search or filters" 
                  : "Get started by adding your first client"}
              </p>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Client
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add Client Modal */}
        {showAddModal && (
          <AddClientModal 
            onClose={() => setShowAddModal(false)}
            onSuccess={() => {
              fetchClients();
              setShowAddModal(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Clients;