import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { packageService } from "@/services/packageService";

interface CreatePackageModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingPackage?: any;
}

const CreatePackageModal = ({ open, onClose, onSuccess, editingPackage }: CreatePackageModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: editingPackage?.name || "",
    description: editingPackage?.description || "",
    category: editingPackage?.category || "",
    price: editingPackage?.price || "",
    paymentCategory: editingPackage?.paymentCategory || "",
    numberOfSessions: editingPackage?.sessions || "",
    numberOfClasses: editingPackage?.numberOfClasses || "",
    duration: editingPackage?.duration || "",
    allowOnlinePurchasing: false,
    discountPromoCodes: false,
    triggerEmail: false,
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Package name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const packageData = {
        name: formData.name,
        description: formData.description,
        sessions_included: parseInt(formData.numberOfSessions) || 0,
        duration_days: getDurationInDays(formData.duration),
        price: parseFloat(formData.price) || 0,
      };

      if (editingPackage) {
        await packageService.update(editingPackage.id, packageData);
        toast({
          title: "Success",
          description: "Package updated successfully",
        });
      } else {
        await packageService.create(packageData);
        toast({
          title: "Success", 
          description: "Package created successfully",
        });
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error saving package:', error);
      toast({
        title: "Error",
        description: "Failed to save package",
        variant: "destructive",
      });
    }
  };

  const getDurationInDays = (duration: string): number => {
    switch (duration) {
      case "1-month": return 30;
      case "2-months": return 60;
      case "3-months": return 90;
      case "6-months": return 180;
      case "12-months": return 365;
      default: return 90; // Default to 3 months
    }
  };

  const isEditing = !!editingPackage;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isEditing ? "Edit Package" : "New Package"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Package Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Package name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter package name"
              required
            />
          </div>

          {/* Package Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Package description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter package description"
              rows={3}
            />
          </div>

          {/* Package Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">
              Package category
            </Label>
            <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal-training">Personal Training</SelectItem>
                <SelectItem value="ems-training">EMS Training</SelectItem>
                <SelectItem value="group-training">Group Training</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price" className="text-sm font-medium">
              Price
            </Label>
            <div className="flex items-center space-x-2">
              <div className="bg-muted px-3 py-2 rounded-md text-sm text-muted-foreground">
                AED
              </div>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Payment Category */}
          <div className="space-y-2">
            <Label htmlFor="paymentCategory" className="text-sm font-medium">
              Payment category
            </Label>
            <Select value={formData.paymentCategory} onValueChange={(value) => handleInputChange("paymentCategory", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full-payment">Full Payment</SelectItem>
                <SelectItem value="installments">Installments</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="per-session">Per Session</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Number of Sessions */}
          <div className="space-y-2">
            <Label htmlFor="numberOfSessions" className="text-sm font-medium">
              Number of sessions
            </Label>
            <Input
              id="numberOfSessions"
              type="number"
              value={formData.numberOfSessions}
              onChange={(e) => handleInputChange("numberOfSessions", e.target.value)}
              placeholder="Enter number of sessions"
              min="1"
            />
          </div>


          {/* Package Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration" className="text-sm font-medium">
              Package duration (optional)
            </Label>
            <Select value={formData.duration} onValueChange={(value) => handleInputChange("duration", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-month">1 Month</SelectItem>
                <SelectItem value="2-months">2 Months</SelectItem>
                <SelectItem value="3-months">3 Months</SelectItem>
                <SelectItem value="6-months">6 Months</SelectItem>
                <SelectItem value="12-months">12 Months</SelectItem>
                <SelectItem value="unlimited">Unlimited</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Online Features - Disabled as requested */}
          <div className="space-y-4 opacity-50 pointer-events-none">
            <div className="flex items-center justify-between">
              <Label htmlFor="allowOnlinePurchasing" className="text-sm font-medium text-muted-foreground">
                Allow online purchasing (Disabled)
              </Label>
              <Switch
                id="allowOnlinePurchasing"
                checked={false}
                disabled
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="discountPromoCodes" className="text-sm font-medium text-muted-foreground">
                Discount/promo codes (Disabled)
              </Label>
              <Switch
                id="discountPromoCodes"
                checked={false}
                disabled
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="triggerEmail" className="text-sm font-medium text-muted-foreground">
                Trigger email (Disabled)
              </Label>
              <Switch
                id="triggerEmail"
                checked={false}
                disabled
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              {isEditing ? "Update Package" : "Create Package"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePackageModal;