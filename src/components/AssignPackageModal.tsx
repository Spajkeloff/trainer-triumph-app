import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Package {
  id: string;
  name: string;
  description?: string;
  sessions_included: number;
  duration_days: number;
  price: number;
}

interface AssignPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  onSuccess?: () => void;
}

const AssignPackageModal = ({ isOpen, onClose, clientId, onSuccess }: AssignPackageModalProps) => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingPackages, setFetchingPackages] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchPackages();
    }
  }, [isOpen]);

  const fetchPackages = async () => {
    try {
      setFetchingPackages(true);
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('name');

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
      setFetchingPackages(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPackageId) {
      toast({
        title: "Error",
        description: "Please select a package",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const selectedPackage = packages.find(p => p.id === selectedPackageId);
      if (!selectedPackage) throw new Error("Package not found");

      // Calculate expiry date
      const purchaseDate = new Date();
      const expiryDate = new Date(purchaseDate.getTime() + (selectedPackage.duration_days * 24 * 60 * 60 * 1000));

      // Insert client package
      const { error } = await supabase
        .from('client_packages')
        .insert({
          client_id: clientId,
          package_id: selectedPackageId,
          sessions_remaining: selectedPackage.sessions_included,
          purchase_date: purchaseDate.toISOString().split('T')[0],
          expiry_date: expiryDate.toISOString().split('T')[0],
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Package assigned successfully",
      });

      onSuccess?.();
      onClose();
      setSelectedPackageId("");
    } catch (error) {
      console.error('Error assigning package:', error);
      toast({
        title: "Error",
        description: "Failed to assign package",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedPackage = packages.find(p => p.id === selectedPackageId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-background border-border">
        <DialogHeader>
          <DialogTitle>Assign Package to Client</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="package">Select Package</Label>
            <Select value={selectedPackageId} onValueChange={setSelectedPackageId} disabled={fetchingPackages}>
              <SelectTrigger>
                <SelectValue placeholder={fetchingPackages ? "Loading packages..." : "Choose a package"} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {packages.map((pkg) => (
                  <SelectItem key={pkg.id} value={pkg.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{pkg.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {pkg.sessions_included} sessions • AED {pkg.price} • {pkg.duration_days} days
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPackage && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h4 className="font-medium">Package Details:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Sessions:</span>
                  <span className="ml-2 font-medium">{selectedPackage.sessions_included}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="ml-2 font-medium">{selectedPackage.duration_days} days</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Price:</span>
                  <span className="ml-2 font-medium">AED {selectedPackage.price}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Per Session:</span>
                  <span className="ml-2 font-medium">AED {Math.round(selectedPackage.price / selectedPackage.sessions_included)}</span>
                </div>
              </div>
              {selectedPackage.description && (
                <p className="text-sm text-muted-foreground mt-2">{selectedPackage.description}</p>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedPackageId}>
              {loading ? "Assigning..." : "Assign Package"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AssignPackageModal;