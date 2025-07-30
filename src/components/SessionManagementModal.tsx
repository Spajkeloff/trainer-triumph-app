import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User,
  CheckCircle,
  XCircle,
  UserX,
  Trash2,
  Edit3,
  RotateCcw
} from "lucide-react";

interface Session {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: string;
  location?: string;
  notes?: string;
  status: string;
  client_id: string;
  client_package_id?: string;
  clients: {
    first_name: string;
    last_name: string;
  };
}

interface SessionManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session | null;
  onSuccess: () => void;
  onEdit?: (session: Session) => void;
}

const SessionManagementModal = ({ isOpen, onClose, session, onSuccess, onEdit }: SessionManagementModalProps) => {
  const [loading, setLoading] = useState(false);
  const [showReconcileOptions, setShowReconcileOptions] = useState<boolean | 'cancelled' | 'rescheduled'>(false);
  const { toast } = useToast();

  const handleStatusUpdate = async (newStatus: string) => {
    if (!session) return;

    try {
      setLoading(true);

      // Update session status only - no package deduction here
      // All package deduction logic is handled in handleReconcile
      const { error: sessionError } = await supabase
        .from('sessions')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.id);

      if (sessionError) throw sessionError;

      toast({
        title: "Success",
        description: `Session marked as ${newStatus}`,
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating session:', error);
      toast({
        title: "Error",
        description: "Failed to update session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!session || !confirm("Are you sure you want to delete this session?")) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', session.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Session deleted successfully",
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Error",
        description: "Failed to delete session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (session && onEdit) {
      onEdit(session);
      onClose();
    }
  };

  if (!session) return null;

  // Check if session is ready for reconciliation (past scheduled time)
  const isReadyForReconciliation = () => {
    const now = new Date();
    const sessionDate = new Date(session.date);
    const [hours, minutes] = session.end_time.split(':');
    sessionDate.setHours(parseInt(hours), parseInt(minutes));
    
    return now > sessionDate && session.status === 'scheduled';
  };

  const handleReconcile = async (action: 'completed' | 'cancelled' | 'rescheduled', shouldCount: boolean = true) => {
    if (!session) return;

    try {
      setLoading(true);

      // Check if this is a trial session
      const isTrialSession = session.type?.includes('Trial') || session.type?.includes('trial');

      // Update session status
      const { error: sessionError } = await supabase
        .from('sessions')
        .update({ 
          status: action === 'rescheduled' ? 'cancelled' : action,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.id);

      if (sessionError) throw sessionError;

      // Handle trial session billing
      if (isTrialSession && action === 'completed') {
        // Import finance service at the top
        const { financeService } = await import('@/services/financeService');
        
        // Create a charge transaction for trial session (250 AED)
        await financeService.createTransaction({
          client_id: session.client_id,
          transaction_type: 'charge',
          amount: 250, // Positive amount for charge
          category: 'session',
          description: `${session.type} - ${new Date(session.date).toLocaleDateString()}`,
          reference_type: 'session',
          reference_id: session.id,
          status: 'completed',
          transaction_date: new Date().toISOString().split('T')[0]
        });
      }

      // Handle package session logic - only if should count and not a trial session
      if (!isTrialSession && shouldCount) {
        // Only deduct sessions if user explicitly chose to count them
        // Sessions are already deducted when created via BookSessionModal
        // This is for sessions that were paid individually (not from package) but now need to count against package
        
        // Only deduct if session is NOT already linked to a package
        // If it's already linked, it was already deducted when created
        if (!session.client_package_id) {
          let packageToUpdate = null;
          
          // Try to find matching package for this session type
          if (session.type === 'PT Session') {
            // Find active personal training package
            const { data: ptPackages } = await supabase
              .from('client_packages')
              .select(`
                *,
                packages!inner(name, sessions_included)
              `)
              .eq('client_id', session.client_id)
              .eq('status', 'active')
              .gt('sessions_remaining', 0)
              .ilike('packages.name', '%personal%training%');
            
            packageToUpdate = ptPackages?.[0];
          } else if (session.type === 'EMS Session') {
            // Find active EMS package
            const { data: emsPackages } = await supabase
              .from('client_packages')
              .select(`
                *,
                packages!inner(name, sessions_included)
              `)
              .eq('client_id', session.client_id)
              .eq('status', 'active')
              .gt('sessions_remaining', 0)
              .ilike('packages.name', '%ems%');
            
            packageToUpdate = emsPackages?.[0];
          }

          // If we found a package to update, deduct the session and link it
          if (packageToUpdate) {
            const { error: packageError } = await supabase
              .from('client_packages')
              .update({ 
                sessions_remaining: packageToUpdate.sessions_remaining - 1,
                updated_at: new Date().toISOString()
              })
              .eq('id', packageToUpdate.id);

            if (packageError) throw packageError;

            // Link session to package
            await supabase
              .from('sessions')
              .update({ client_package_id: packageToUpdate.id })
              .eq('id', session.id);
          }
        }
      }

      const successMessage = isTrialSession && action === 'completed' 
        ? `Trial session completed and 250 AED charge added to client account`
        : `Session ${action === 'rescheduled' ? 'rescheduled' : action}${shouldCount ? ' and deducted from package' : ''}`;

      toast({
        title: "Success",
        description: successMessage,
      });

      // If trial session was completed, offer payment option
      if (isTrialSession && action === 'completed') {
        if (confirm("Trial session charge added to client account. Would you like to record the payment now?")) {
          const { financeService } = await import('@/services/financeService');
          
          try {
            await financeService.createTransaction({
              client_id: session.client_id,
              transaction_type: 'payment',
              amount: 250,
              category: 'session',
              description: `Payment for ${session.type} - ${new Date(session.date).toLocaleDateString()}`,
              reference_type: 'session',
              reference_id: session.id,
              status: 'completed',
              transaction_date: new Date().toISOString().split('T')[0],
              payment_method: 'cash'
            });
            
            toast({
              title: "Payment Recorded",
              description: "Trial session payment has been recorded successfully",
            });
          } catch (paymentError) {
            console.error('Error recording payment:', paymentError);
            toast({
              title: "Warning",
              description: "Charge added but payment recording failed. Please add payment manually in Finance tab.",
              variant: "default",
            });
          }
        }
      }

      onSuccess();
      onClose();
      setShowReconcileOptions(false);
    } catch (error) {
      console.error('Error reconciling session:', error);
      toast({
        title: "Error",
        description: "Failed to reconcile session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      month: 'numeric', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success text-success-foreground">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'no_show':
        return <Badge variant="outline" className="text-warning border-warning">No Show</Badge>;
      default:
        return <Badge variant="default">Scheduled</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-background border-border">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Session Management</DialogTitle>
          {getStatusBadge(session.status)}
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Client */}
          <div className="flex items-center space-x-3">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{session.clients.first_name} {session.clients.last_name}</span>
          </div>

          {/* Date */}
          <div className="flex items-center space-x-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{formatDate(session.date)}</span>
          </div>

          {/* Time */}
          <div className="flex items-center space-x-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{formatTime(session.start_time)} - {formatTime(session.end_time)}</span>
          </div>

          {/* Location */}
          <div className="flex items-center space-x-3">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{session.location}</span>
          </div>
        </div>

        {/* Edit Details Button */}
        <Button 
          variant="outline" 
          className="w-full mb-4" 
          onClick={handleEdit}
        >
          <Edit3 className="h-4 w-4 mr-2" />
          Edit Details
        </Button>

        {/* Reconcile Button - Only show if session is ready for reconciliation */}
        {isReadyForReconciliation() && !showReconcileOptions && (
          <Button 
            className="w-full mb-4 bg-primary hover:bg-primary/90"
            onClick={() => setShowReconcileOptions(true)}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reconcile Session
          </Button>
        )}

        {/* Reconciliation Options */}
        {showReconcileOptions && (
          <div className="space-y-4 mb-4">
            <div className="text-sm font-medium text-center mb-3">
              How did this session conclude?
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <Button 
                onClick={() => handleReconcile('completed')}
                disabled={loading}
                className="bg-success hover:bg-success/90"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Session Completed
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => setShowReconcileOptions('cancelled')}
                disabled={loading}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Session Cancelled / No Show
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => setShowReconcileOptions('rescheduled')}
                disabled={loading}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Session Rescheduled
              </Button>
            </div>

            <Button 
              variant="ghost"
              onClick={() => setShowReconcileOptions(false)}
              className="w-full"
            >
              Back
            </Button>
          </div>
        )}

        {/* Package Count Options */}
        {(showReconcileOptions === 'cancelled' || showReconcileOptions === 'rescheduled') && (
          <div className="space-y-4 mb-4">
            <div className="text-sm font-medium text-center mb-3">
              Should this {showReconcileOptions} session be deducted from the client's package?
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <Button 
                onClick={() => {
                  handleReconcile(showReconcileOptions, true);
                  setShowReconcileOptions(false);
                }}
                disabled={loading}
                className="bg-destructive hover:bg-destructive/90"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Yes - Deduct from Package
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => {
                  handleReconcile(showReconcileOptions, false);
                  setShowReconcileOptions(false);
                }}
                disabled={loading}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                No - Don't Deduct from Package
              </Button>
            </div>

            <Button 
              variant="ghost"
              onClick={() => setShowReconcileOptions(true)}
              className="w-full"
            >
              Back
            </Button>
          </div>
        )}

        {/* Standard Action Buttons - Only show if not in reconcile mode */}
        {!showReconcileOptions && !isReadyForReconciliation() && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Button 
                onClick={() => handleStatusUpdate('completed')}
                disabled={loading || session.status === 'completed'}
                className="bg-success hover:bg-success/90"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => {
                  const shouldCount = confirm("Should this rescheduled session count towards the package? Click OK to count it, Cancel to not count it.");
                  handleReconcile('rescheduled', shouldCount);
                }}
                disabled={loading}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reschedule
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline"
                onClick={() => {
                  const shouldCount = confirm("Should this cancelled session count towards the package? Click OK to count it, Cancel to not count it.");
                  handleReconcile('cancelled', shouldCount);
                }}
                disabled={loading}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              
              <Button 
                variant="outline"
                onClick={handleEdit}
                disabled={loading}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Details
              </Button>
            </div>
          </>
        )}
        {/* Delete Button - Always show at bottom */}
        <Button 
          variant="destructive"
          onClick={handleDelete}
          disabled={loading}
          className="w-full"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Session
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default SessionManagementModal;