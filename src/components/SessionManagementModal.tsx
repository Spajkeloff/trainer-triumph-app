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
  onPaymentRequired?: (clientId: string) => void;
}

const SessionManagementModal = ({ isOpen, onClose, session, onSuccess, onEdit, onPaymentRequired }: SessionManagementModalProps) => {
  const [loading, setLoading] = useState(false);
  const [showReconcileOptions, setShowReconcileOptions] = useState<boolean | 'cancelled' | 'rescheduled'>(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState<{
    action: 'cancelled' | 'rescheduled';
    show: boolean;
  }>({ action: 'cancelled', show: false });
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
    if (!session) return;

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

      console.log('Reconcile Debug:', {
        action,
        shouldCount,
        sessionType: session.type,
        clientPackageId: session.client_package_id
      });

      // Check if this is a trial session
      const isTrialSession = session.type?.toLowerCase().includes('trial');
      console.log('Is trial session:', isTrialSession, 'Session type:', session.type);

      // Update session status
      const { error: sessionError } = await supabase
        .from('sessions')
        .update({ 
          status: action === 'rescheduled' ? 'cancelled' : action,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.id);

      if (sessionError) throw sessionError;

      // Handle trial session billing - only create charge once
      if (isTrialSession && action === 'completed') {
        // Check if charge already exists for this session
        const { data: existingCharge } = await supabase
          .from('transactions')
          .select('id')
          .eq('client_id', session.client_id)
          .eq('transaction_type', 'charge')
          .eq('transaction_date', session.date)
          .eq('description', `${session.type} on ${session.date}`)
          .maybeSingle();

        // Only create charge if it doesn't exist
        if (!existingCharge) {
          const { data: user } = await supabase.auth.getUser();
          if (user.user) {
            const { error: chargeError } = await supabase
              .from('transactions')
              .insert({
                user_id: user.user.id,
                client_id: session.client_id,
                transaction_type: 'charge',
                category: 'Session',
                amount: 250,
                description: `${session.type} on ${session.date}`,
                transaction_date: session.date,
                status: 'completed'
              });

            if (chargeError) {
              console.error('Error creating charge:', chargeError);
            }
          }
        }
      }

      // Handle package session logic - ONLY for the specific session being reconciled
      console.log('Processing session reconciliation for session ID:', session.id);
      console.log('Session details:', {
        isTrialSession,
        shouldCount,
        hasClientPackageId: !!session.client_package_id,
        action,
        sessionType: session.type
      });

      if (!isTrialSession) {
        if (session.client_package_id) {
          // Session linked to package - handle deduction/restoration
          console.log('Session linked to package:', session.client_package_id);
          
          if (action === 'completed' && shouldCount) {
            // Deduct session from package when completing
            console.log('Deducting 1 session from package for completion');
            
            const { data: currentPackage } = await supabase
              .from('client_packages')
              .select('sessions_remaining')
              .eq('id', session.client_package_id)
              .maybeSingle();

            if (currentPackage && currentPackage.sessions_remaining > 0) {
              const { error: packageError } = await supabase
                .from('client_packages')
                .update({ 
                  sessions_remaining: currentPackage.sessions_remaining - 1,
                  updated_at: new Date().toISOString()
                })
                .eq('id', session.client_package_id);

              if (packageError) throw packageError;
              console.log('Successfully deducted 1 session from package');
            }
          } else if ((action === 'cancelled' || action === 'rescheduled') && shouldCount) {
            // Deduct session from package when cancelled/rescheduled and should count
            console.log('Deducting 1 session from package for cancelled/rescheduled session');
            
            const { data: currentPackage } = await supabase
              .from('client_packages')
              .select('sessions_remaining')
              .eq('id', session.client_package_id)
              .maybeSingle();

            if (currentPackage && currentPackage.sessions_remaining > 0) {
              const { error: packageError } = await supabase
                .from('client_packages')
                .update({ 
                  sessions_remaining: currentPackage.sessions_remaining - 1,
                  updated_at: new Date().toISOString()
                })
                .eq('id', session.client_package_id);

              if (packageError) throw packageError;
              console.log('Successfully deducted 1 session from package');
            }
          } else {
            console.log('No package action needed - leaving count unchanged');
          }
        } 
        // Session NOT linked to package - can be retroactively deducted ONCE
        else if (shouldCount && action === 'completed') {
          console.log('Session not linked to package - checking for retroactive deduction for session:', session.id);
          
          // Find matching package for THIS specific session type
          let packageToDeduct = null;
          
          if (session.type === 'PT Session') {
            const { data: ptPackages } = await supabase
              .from('client_packages')
              .select('id, sessions_remaining')
              .eq('client_id', session.client_id)
              .eq('status', 'active')
              .gt('sessions_remaining', 0)
              .limit(1);
            
            packageToDeduct = ptPackages?.[0];
          } else if (session.type === 'EMS Session') {
            const { data: emsPackages } = await supabase
              .from('client_packages')
              .select('id, sessions_remaining')
              .eq('client_id', session.client_id)
              .eq('status', 'active')
              .gt('sessions_remaining', 0)
              .limit(1);
            
            packageToDeduct = emsPackages?.[0];
          }

          if (packageToDeduct && packageToDeduct.sessions_remaining > 0) {
            console.log('Deducting 1 session from package:', packageToDeduct.id, 'for session:', session.id);
            
            // Atomically deduct 1 session and link THIS specific session
            const { error: packageError } = await supabase
              .from('client_packages')
              .update({ 
                sessions_remaining: packageToDeduct.sessions_remaining - 1,
                updated_at: new Date().toISOString()
              })
              .eq('id', packageToDeduct.id);

            if (packageError) throw packageError;

            // Link THIS specific session to package to prevent future deductions
            const { error: linkError } = await supabase
              .from('sessions')
              .update({ client_package_id: packageToDeduct.id })
              .eq('id', session.id);
              
            if (linkError) throw linkError;
            
            console.log('Successfully deducted 1 session and linked session', session.id, 'to package', packageToDeduct.id);
          } else {
            console.log('No suitable package found or package has no sessions remaining');
          }
        } else {
          console.log('No package action needed for this session reconciliation');
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
        // Auto-trigger payment modal for trial sessions
        if (onPaymentRequired) {
          onPaymentRequired(session.client_id);
        }
        onSuccess();
        onClose();
        return;
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
    <>
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
                onClick={() => handleReconcile('completed', true)}
                disabled={loading || session.status === 'completed'}
                className="bg-success hover:bg-success/90"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => setShowConfirmationModal({ action: 'rescheduled', show: true })}
                disabled={loading}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reschedule
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline"
                onClick={() => setShowConfirmationModal({ action: 'cancelled', show: true })}
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

      {/* Confirmation Modal */}
      <Dialog open={showConfirmationModal.show} onOpenChange={(open) => 
        setShowConfirmationModal({ ...showConfirmationModal, show: open })
      }>
        <DialogContent className="sm:max-w-md bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-center">
              {showConfirmationModal.action === 'cancelled' ? 'Cancel Session' : 'Reschedule Session'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="text-center text-muted-foreground">
              {showConfirmationModal.action === 'cancelled' 
                ? 'Cancelled events will still be displayed in the Calendar but crossed out. You can still \'uncancel\' if needed.'
                : 'This session will be marked as rescheduled and you can book a new session for the client.'
              }
            </div>
            
            <div className="border-t pt-4">
              <div className="text-sm font-medium text-center mb-4">
                Do you want to count this session towards the client's package?
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <Button 
                  onClick={() => {
                    handleReconcile(showConfirmationModal.action, true);
                    setShowConfirmationModal({ action: 'cancelled', show: false });
                  }}
                  disabled={loading}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Yes - Count Session
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => {
                    handleReconcile(showConfirmationModal.action, false);
                    setShowConfirmationModal({ action: 'cancelled', show: false });
                  }}
                  disabled={loading}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  No - Don't Count Session
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <Button 
              variant="ghost"
              onClick={() => setShowConfirmationModal({ action: 'cancelled', show: false })}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SessionManagementModal;