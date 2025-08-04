import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
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
    name: "",
    description: "",
    category: "",
    price: "",
    paymentCategory: "",
    numberOfSessions: "",
    numberOfClasses: "",
    duration: "",
    customExpiryDate: "",
    useCustomExpiry: false,
    allowOnlinePurchasing: false,
    discountPromoCodes: false,
    triggerEmail: false,
  });

  // Reset and populate form when modal opens or editingPackage changes
  useEffect(() => {
    if (open) {
      if (editingPackage) {
        // Populate form with editing package data
        setFormData({
          name: editingPackage.name || "",
          description: editingPackage.description || "",
          category: editingPackage.category || "",
          price: editingPackage.price?.toString() || "",
          paymentCategory: editingPackage.paymentCategory || "",
          numberOfSessions: editingPackage.sessions_included?.toString() || "",
          numberOfClasses: editingPackage.numberOfClasses || "",
          duration: getDurationFromDays(editingPackage.duration_days),
          customExpiryDate: "",
          useCustomExpiry: false,
          allowOnlinePurchasing: false,
          discountPromoCodes: false,
          triggerEmail: false,
        });
      } else {
        // Reset form for new package
        setFormData({
          name: "",
          description: "",
          category: "",
          price: "",
          paymentCategory: "",
          numberOfSessions: "",
          numberOfClasses: "",
          duration: "",
          customExpiryDate: "",
          useCustomExpiry: false,
          allowOnlinePurchasing: false,
          discountPromoCodes: false,
          triggerEmail: false,
        });
      }
    }
  }, [open, editingPackage]);

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

    if (formData.useCustomExpiry && !formData.customExpiryDate) {
      toast({
        title: "Error",
        description: "Custom expiration date is required when this option is enabled",
        variant: "destructive",
      });
      return;
    }

    try {
      const packageData = {
        name: formData.name,
        description: formData.description,
        sessions_included: parseInt(formData.numberOfSessions) || 0,
        // Use custom expiry date if enabled, otherwise use duration-based calculation
        duration_days: formData.useCustomExpiry 
          ? Math.ceil((new Date(formData.customExpiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          : getDurationInDays(formData.duration),
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

  const getDurationFromDays = (days: number): string => {
    switch (days) {
      case 30: return "1-month";
      case 60: return "2-months";
      case 90: return "3-months";
      case 180: return "6-months";
      case 365: return "12-months";
      default: return "3-months"; // Default to 3 months
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
            <Label htmlFor="duration" className={cn(
              "text-sm font-medium",
              formData.useCustomExpiry && "text-muted-foreground"
            )}>
              Package duration (optional)
              {formData.useCustomExpiry && (
                <span className="ml-2 text-xs text-muted-foreground">
                  (Disabled - using custom expiration date)
                </span>
              )}
            </Label>
            <Select 
              value={formData.useCustomExpiry ? "" : formData.duration} 
              onValueChange={(value) => !formData.useCustomExpiry && handleInputChange("duration", value)}
              disabled={formData.useCustomExpiry}
            >
              <SelectTrigger className={cn(
                formData.useCustomExpiry && "opacity-50 cursor-not-allowed bg-muted"
              )}>
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

          {/* Custom Expiration Date Option */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="useCustomExpiry"
                checked={formData.useCustomExpiry}
                onCheckedChange={(checked) => handleInputChange("useCustomExpiry", checked)}
              />
              <Label htmlFor="useCustomExpiry" className="text-sm font-medium">
                Set custom expiration date (overrides default duration)
              </Label>
            </div>

            {formData.useCustomExpiry && (
              <div className="space-y-2">
                <Label htmlFor="customExpiryDate" className="text-sm font-medium">
                  Custom Expiration Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.customExpiryDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.customExpiryDate
                        ? format(new Date(formData.customExpiryDate), "PPP")
                        : "Pick expiration date"
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.customExpiryDate ? new Date(formData.customExpiryDate) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          handleInputChange("customExpiryDate", date.toISOString().split('T')[0]);
                        }
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                {formData.useCustomExpiry && !formData.customExpiryDate && (
                  <p className="text-sm text-muted-foreground">
                    Custom expiration date is required when this option is enabled
                  </p>
                )}
              </div>
            )}

            {!formData.useCustomExpiry && formData.duration && (
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                <p>Default expiration: {getDurationInDays(formData.duration)} days from purchase date</p>
              </div>
            )}
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