import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Calendar, Clock, DollarSign, Hash } from "lucide-react";

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

interface PackageDetailsModalProps {
  package: Package | null;
  isOpen: boolean;
  onClose: () => void;
}

const PackageDetailsModal = ({ package: pkg, isOpen, onClose }: PackageDetailsModalProps) => {
  if (!pkg) return null;

  const pricePerSession = (pkg.price / pkg.sessions_included).toFixed(0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{pkg.name}</span>
            <Badge className="bg-success text-success-foreground">Active</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Package Description */}
          {pkg.description && (
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-muted-foreground text-sm">{pkg.description}</p>
            </div>
          )}

          {/* Package Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
              <Hash className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Sessions</p>
                <p className="font-semibold">{pkg.sessions_included}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-semibold">{pkg.duration_days} days</p>
              </div>
            </div>
          </div>

          {/* Pricing Information */}
          <div className="space-y-3">
            <h4 className="font-medium">Pricing</h4>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Package Price:</span>
                <span className="font-semibold text-lg">AED {pkg.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Price per Session:</span>
                <span className="font-medium">AED {pricePerSession}</span>
              </div>
            </div>
          </div>

          {/* Package Dates */}
          <div className="space-y-3">
            <h4 className="font-medium">Package Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span>{new Date(pkg.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated:</span>
                <span>{new Date(pkg.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PackageDetailsModal;