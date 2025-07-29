import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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
  onPaymentRequired?: (packageData: any) => void;
}

const AssignPackageModal = ({ isOpen, onClose, clientId, onSuccess, onPaymentRequired }: AssignPackageModalProps) => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "unpaid">("unpaid");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [loading, setLoading] = useState(false);
  const [fetchingPackages, setFetchingPackages] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchPackages();
      // Reset form
      setSelectedPackageId("");
      setCustomPrice("");
      setExpiryDate("");
      setNotes("");
      setPaymentStatus("unpaid");
      setPaymentMethod("cash");
    }
  }, [isOpen]);

  useEffect(() => {
    // Auto-set price and expiry when package is selected
    if (selectedPackageId) {
      const selectedPackage = packages.find(p => p.id === selectedPackageId);
      if (selectedPackage) {
        setCustomPrice(selectedPackage.price.toString());
        
        // Calculate expiry date
        const today = new Date();
        const expiry = new Date(today.getTime() + (selectedPackage.duration_days * 24 * 60 * 60 * 1000));
        setExpiryDate(expiry.toISOString().split('T')[0]);
      }
    }
  }, [selectedPackageId, packages]);

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
    
    if (!selectedPackageId || !customPrice || !expiryDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const selectedPackage = packages.find(p => p.id === selectedPackageId);
      if (!selectedPackage) throw new Error("Package not found");

      const price = parseFloat(customPrice);

      // Get current user for user_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // 1. Insert client package
      const { data: clientPackageData, error: packageError } = await supabase
        .from('client_packages')
        .insert({
          client_id: clientId,
          package_id: selectedPackageId,
          sessions_remaining: selectedPackage.sessions_included,
          purchase_date: new Date().toISOString().split('T')[0],
          expiry_date: expiryDate,
          status: 'active'
        })
        .select()
        .single();

      if (packageError) throw packageError;

      // 2. Create charge transaction
      const { error: chargeError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          client_id: clientId,
          transaction_type: 'charge',
          category: 'Package Purchase',
          amount: price,
          description: `${selectedPackage.name} Package Assignment${notes ? ` - ${notes}` : ''}`,
          payment_method: 'package_assignment',
          status: 'completed',
          transaction_date: new Date().toISOString().split('T')[0],
          reference_id: clientPackageData.id,
          reference_type: 'package'
        });

      if (chargeError) throw chargeError;

      // 3. Also create legacy payment record for compatibility (negative amount for charge)
      const { error: legacyChargeError } = await supabase
        .from('payments')
        .insert({
          client_id: clientId,
          amount: -price, // Negative for charge
          payment_method: 'package_assignment',
          status: 'pending',
          description: `${selectedPackage.name} Package Assignment${notes ? ` - ${notes}` : ''}`,
          payment_date: new Date().toISOString().split('T')[0],
          client_package_id: clientPackageData.id
        });

      if (legacyChargeError) throw legacyChargeError;

      // 4. If payment is marked as paid, create payment transaction
      if (paymentStatus === 'paid') {
        // Create payment transaction
        const { error: paymentTxError } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            client_id: clientId,
            transaction_type: 'payment',
            category: 'Package Payment',
            amount: price,
            description: `Payment for ${selectedPackage.name} Package`,
            payment_method: paymentMethod,
            status: 'completed',
            transaction_date: new Date().toISOString().split('T')[0],
            reference_id: clientPackageData.id,
            reference_type: 'package'
          });

        if (paymentTxError) throw paymentTxError;

        // Create legacy payment record
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            client_id: clientId,
            amount: price, // Positive for payment
            payment_method: paymentMethod,
            status: 'completed',
            description: `Payment for ${selectedPackage.name} Package`,
            payment_date: new Date().toISOString().split('T')[0],
            client_package_id: clientPackageData.id
          });

        if (paymentError) throw paymentError;
        
        toast({
          title: "Success",
          description: "Package assigned and payment recorded",
        });
      } else {
        toast({
          title: "Success",
          description: `Package assigned successfully. Outstanding balance: AED ${price}`,
        });
      }

      // Close this modal and show payment option
      onClose();
      
      // If payment is required, show payment modal
      if (paymentStatus === 'unpaid' && onPaymentRequired) {
        onPaymentRequired({
          clientId,
          packageId: selectedPackageId,
          packageName: selectedPackage.name,
          amount: price,
          clientPackageId: clientPackageData.id
        });
      }

      onSuccess?.();
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
          {/* Package Selection */}
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

          {/* Price and Expiry */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price (AED)</Label>
              <Input
                id="price"
                type="number"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                placeholder="0"
                required
              />
            </div>
            <div>
              <Label htmlFor="expiry">Expiry Date</Label>
              <Input
                id="expiry"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Payment Status */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={paymentStatus === 'paid'}
                onCheckedChange={(checked) => setPaymentStatus(checked ? 'paid' : 'unpaid')}
              />
              <Label>Mark as paid</Label>
            </div>

            {paymentStatus === 'paid' && (
              <div>
                <Label htmlFor="payment-method">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="online">Online Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes or comments..."
            />
          </div>

          {selectedPackage && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h4 className="font-medium">Package Summary:</h4>
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
                  <span className="text-muted-foreground">Custom Price:</span>
                  <span className="ml-2 font-medium">AED {customPrice || 0}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Payment Status:</span>
                  <span className="ml-2 font-medium capitalize">{paymentStatus}</span>
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
            <Button type="submit" disabled={loading || !selectedPackageId || !customPrice || !expiryDate}>
              {loading ? "Assigning..." : "Assign Package"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AssignPackageModal;