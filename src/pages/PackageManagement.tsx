import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Package,
  Clock,
  DollarSign,
  Users
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AddPackageModal from "@/components/AddPackageModal";

interface Package {
  id: string;
  name: string;
  description?: string;
  sessions_included: number;
  duration_days: number;
  price: number;
  created_at: string;
  updated_at: string;
}

const PackageManagement = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPackages(data || []);
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

  const handleDeletePackage = async (packageId: string) => {
    if (!confirm('Are you sure you want to delete this package?')) return;

    try {
      const { error } = await supabase
        .from('packages')
        .delete()
        .eq('id', packageId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Package deleted successfully",
      });

      fetchPackages();
    } catch (error) {
      console.error('Error deleting package:', error);
      toast({
        title: "Error",
        description: "Failed to delete package",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Package Management</h1>
            <p className="text-muted-foreground">Create and manage training packages for your clients</p>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Add New Package
          </Button>
        </div>

        {/* Packages Grid */}
        {packages.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <Card key={pkg.id} className="hover:shadow-elevated transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center">
                        <Package className="h-5 w-5 mr-2 text-primary" />
                        {pkg.name}
                      </CardTitle>
                      {pkg.description && (
                        <p className="text-sm text-muted-foreground mt-1">{pkg.description}</p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border-border">
                        <DropdownMenuItem>
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
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Package Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-center mb-1">
                          <Users className="h-4 w-4 text-primary mr-1" />
                          <span className="text-sm font-medium">Sessions</span>
                        </div>
                        <p className="text-lg font-bold">{pkg.sessions_included}</p>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-center mb-1">
                          <Clock className="h-4 w-4 text-primary mr-1" />
                          <span className="text-sm font-medium">Duration</span>
                        </div>
                        <p className="text-lg font-bold">{pkg.duration_days}d</p>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-primary">AED {pkg.price}</p>
                          <p className="text-sm text-muted-foreground">
                            AED {Math.round(pkg.price / pkg.sessions_included)} per session
                          </p>
                        </div>
                        <Badge className="bg-success text-success-foreground">
                          Active
                        </Badge>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button className="w-full" variant="outline">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Assign to Client
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No packages created yet</h2>
            <p className="text-muted-foreground mb-6">
              Create your first training package to start offering services to clients
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Package
            </Button>
          </div>
        )}
      </div>

      {/* Add Package Modal */}
      <AddPackageModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchPackages}
      />
    </div>
  );
};

export default PackageManagement;