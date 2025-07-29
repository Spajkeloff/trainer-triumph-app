import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ClientPackage {
  id: string;
  sessions_remaining: number;
  expiry_date: string;
  status: string;
  packages: {
    name: string;
    sessions_included: number;
  };
}

interface EditPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientPackage: ClientPackage | null;
  onSuccess?: () => void;
}

const EditPackageModal = ({ isOpen, onClose, clientPackage, onSuccess }: EditPackageModalProps) => {
  const [sessionsRemaining, setSessionsRemaining] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [status, setStatus] = useState("active");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && clientPackage) {
      setSessionsRemaining(clientPackage.sessions_remaining.toString());
      setExpiryDate(clientPackage.expiry_date);
      setStatus(clientPackage.status);
      setNotes("");
    }
  }, [isOpen, clientPackage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientPackage || !sessionsRemaining || !expiryDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('client_packages')
        .update({
          sessions_remaining: parseInt(sessionsRemaining),
          expiry_date: expiryDate,
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientPackage.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Package updated successfully",
      });

      onClose();
      onSuccess?.();
    } catch (error) {
      console.error('Error updating package:', error);
      toast({
        title: "Error",
        description: "Failed to update package",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!clientPackage) return;

    if (!confirm("Are you sure you want to delete this package? This action cannot be undone.")) {
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('client_packages')
        .delete()
        .eq('id', clientPackage.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Package deleted successfully",
      });

      onClose();
      onSuccess?.();
    } catch (error) {
      console.error('Error deleting package:', error);
      toast({
        title: "Error",
        description: "Failed to delete package",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!clientPackage) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-background border-border">
        <DialogHeader>
          <DialogTitle>Edit Package: {clientPackage.packages.name}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Package Information</h4>
            <p className="text-sm text-muted-foreground">
              Original Sessions: {clientPackage.packages.sessions_included}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sessions">Sessions Remaining</Label>
              <Input
                id="sessions"
                type="number"
                value={sessionsRemaining}
                onChange={(e) => setSessionsRemaining(e.target.value)}
                min="0"
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

          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-input bg-background rounded-md"
            >
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div>
            <Label htmlFor="notes">Update Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for changes..."
            />
          </div>

          <div className="flex justify-between">
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDelete}
              disabled={loading}
            >
              Delete Package
            </Button>
            <div className="space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Package"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditPackageModal;