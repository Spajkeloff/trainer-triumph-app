import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { 
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Eye
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import CreatePackageModal from "../components/CreatePackageModal";

const Services = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);

  // Sample data
  const packages = [
    {
      id: "1",
      name: "Premium Training Package",
      description: "Comprehensive personal training with nutrition guidance",
      sessions: 20,
      duration: "60 minutes",
      price: "AED 2,800",
      pricePerSession: "AED 140",
      validity: "3 months",
      status: "active",
      clientsActive: 12
    },
    {
      id: "2",
      name: "Basic Training Package",
      description: "Essential personal training sessions",
      sessions: 10,
      duration: "45 minutes",
      price: "AED 1,200",
      pricePerSession: "AED 120",
      validity: "2 months",
      status: "active",
      clientsActive: 8
    },
    {
      id: "3",
      name: "Fitness Assessment Package",
      description: "Complete fitness evaluation and program design",
      sessions: 3,
      duration: "90 minutes",
      price: "AED 650",
      pricePerSession: "AED 217",
      validity: "1 month",
      status: "active",
      clientsActive: 3
    }
  ];


  const getStatusBadge = (status: string) => {
    return status === "active" ? 
      <Badge className="bg-success text-success-foreground">Active</Badge> : 
      <Badge variant="secondary">Inactive</Badge>;
  };

  const handleEditPackage = (pkg: any) => {
    setEditingPackage(pkg);
    setShowCreateModal(true);
  };

  const handleDeletePackage = (pkgId: string) => {
    if (confirm('Are you sure you want to delete this package?')) {
      // Handle package deletion
      console.log('Deleting package:', pkgId);
    }
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setEditingPackage(null);
  };

  const handleModalSuccess = () => {
    // Refresh packages list
    handleModalClose();
  };

  const renderPackages = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {packages.map((pkg) => (
        <Card key={pkg.id} className="hover:shadow-elevated transition-all duration-300">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{pkg.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{pkg.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(pkg.status)}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEditPackage(pkg)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Package
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => handleDeletePackage(pkg.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Package
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Sessions</p>
                  <p className="font-medium">{pkg.sessions}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-medium">{pkg.duration}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Validity</p>
                  <p className="font-medium">{pkg.validity}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Active Clients</p>
                  <p className="font-medium">{pkg.clientsActive}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-lg font-bold text-primary">{pkg.price}</p>
                    <p className="text-sm text-muted-foreground">{pkg.pricePerSession} per session</p>
                  </div>
                  <Button size="sm" onClick={() => handleEditPackage(pkg)}>
                    Edit Package
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );


  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
         <div>
           <h1 className="text-3xl font-bold text-foreground mb-2">Training Packages</h1>
           <p className="text-muted-foreground">Manage your training packages and programs</p>
         </div>
         <Button 
           className="bg-primary hover:bg-primary/90"
           onClick={() => setShowCreateModal(true)}
         >
           <Plus className="h-4 w-4 mr-2" />
           Create New Package
         </Button>
        </div>

        {/* Content */}
        <div>
          {renderPackages()}
        </div>

        {/* Create Package Modal */}
        <CreatePackageModal 
          open={showCreateModal}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          editingPackage={editingPackage}
        />
      </div>
    </div>
  );
};

export default Services;