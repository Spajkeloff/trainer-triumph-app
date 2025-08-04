import { useState, useEffect } from "react";
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
import PackageDetailsModal from "../components/PackageDetailsModal";
import { packageService, Package } from "../services/packageService";
import { useToast } from "@/hooks/use-toast";

const Services = () => {
  const { toast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [viewingPackage, setViewingPackage] = useState<Package | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const packagesData = await packageService.getAll();
      setPackages(packagesData);
    } catch (error) {
      console.error('Error fetching packages:', error);
      toast({
        title: "Error",
        description: "Failed to load packages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };



  const handleViewPackage = (pkg: Package) => {
    setViewingPackage(pkg);
    setShowDetailsModal(true);
  };

  const handleEditPackage = (pkg: Package) => {
    setEditingPackage(pkg);
    setShowCreateModal(true);
  };

  const handleDeletePackage = async (pkgId: string) => {
    if (!confirm('Are you sure you want to delete this package?')) {
      return;
    }

    try {
      await packageService.delete(pkgId);
      toast({
        title: "Success",
        description: "Package deleted successfully",
      });
      fetchPackages(); // Refresh the list
    } catch (error) {
      console.error('Error deleting package:', error);
      toast({
        title: "Error",
        description: "Failed to delete package",
        variant: "destructive",
      });
    }
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setEditingPackage(null);
  };

  const handleModalSuccess = () => {
    fetchPackages(); // Refresh the list
    handleModalClose();
  };

  const renderPackages = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (packages.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-muted-foreground mb-4">
              <Plus className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No packages found</h3>
              <p className="text-sm">Create your first training package to get started</p>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Package
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
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
                <Badge className="bg-success text-success-foreground">Active</Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleViewPackage(pkg)}>
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
                  <p className="font-medium">{pkg.sessions_included}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-medium">{pkg.duration_days} days</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium">Active</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">{new Date(pkg.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-lg font-bold text-primary">AED {pkg.price.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">
                      AED {(pkg.price / pkg.sessions_included).toFixed(0)} per session
                    </p>
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
  };


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

        {/* Package Details Modal */}
        <PackageDetailsModal 
          package={viewingPackage}
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
        />
      </div>
    </div>
  );
};

export default Services;