import { useState } from "react";
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

const Clients = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "active" | "leads">("all");

  // Sample clients data
  const clients = [
    {
      id: "1",
      name: "Sarah Al-Zahra",
      email: "sarah.alzahra@email.com",
      phone: "+971 50 123 4567",
      status: "active",
      package: "Premium Training Package",
      sessionsRemaining: 8,
      nextSession: "Dec 28, 2024",
      outstandingBalance: "AED 0",
      joinDate: "Nov 15, 2024",
      avatar: null
    },
    {
      id: "2",
      name: "Omar Hassan",
      email: "omar.hassan@email.com",
      phone: "+971 55 987 6543",
      status: "active",
      package: "Basic Training Package",
      sessionsRemaining: 3,
      nextSession: "Dec 29, 2024",
      outstandingBalance: "AED 450",
      joinDate: "Oct 22, 2024",
      avatar: null
    },
    {
      id: "3",
      name: "Fatima Al-Rashid",
      email: "fatima.alrashid@email.com",
      phone: "+971 52 456 7890",
      status: "lead",
      package: null,
      sessionsRemaining: null,
      nextSession: null,
      outstandingBalance: "AED 0",
      joinDate: "Dec 20, 2024",
      avatar: null
    },
    {
      id: "4",
      name: "Ahmed Al-Mansouri",
      email: "ahmed.almansouri@email.com",
      phone: "+971 56 789 0123",
      status: "active",
      package: "Group Classes Membership",
      sessionsRemaining: 12,
      nextSession: "Dec 30, 2024",
      outstandingBalance: "AED 0",
      joinDate: "Sep 10, 2024",
      avatar: null
    }
  ];

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
          <Button className="bg-primary hover:bg-primary/90">
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
                      <CardTitle className="text-lg">{client.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Joined {client.joinDate}
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
                        <DropdownMenuItem>
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

                  {/* Package Info */}
                  {client.package && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium text-card-foreground">
                        {client.package}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {client.sessionsRemaining} sessions remaining
                      </p>
                    </div>
                  )}

                  {/* Next Session */}
                  {client.nextSession && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        Next Session:
                      </span>
                      <span className="font-medium">{client.nextSession}</span>
                    </div>
                  )}

                  {/* Outstanding Balance */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center text-muted-foreground">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Outstanding:
                    </span>
                    <span className={`font-medium ${
                      client.outstandingBalance === "AED 0" ? "text-success" : "text-warning"
                    }`}>
                      {client.outstandingBalance}
                    </span>
                  </div>
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
                  {client.outstandingBalance !== "AED 0" && (
                    <Button variant="outline" size="sm" className="flex-1">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Payment
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
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add New Client
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Clients;