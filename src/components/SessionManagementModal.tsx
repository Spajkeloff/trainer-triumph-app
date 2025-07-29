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
  Edit3
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
  const { toast } = useToast();

  const handleStatusUpdate = async (newStatus: string) => {
    if (!session) return;

    try {
      setLoading(true);

      // Update session status
      const { error: sessionError } = await supabase
        .from('sessions')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.id);

      if (sessionError) throw sessionError;

      // If marking as completed and session uses package, deduct session
      if (newStatus === 'completed' && session.client_package_id) {
        // Get current sessions remaining
        const { data: packageData } = await supabase
          .from('client_packages')
          .select('sessions_remaining')
          .eq('id', session.client_package_id)
          .single();

        if (packageData && packageData.sessions_remaining > 0) {
          const { error: packageError } = await supabase
            .from('client_packages')
            .update({ 
              sessions_remaining: packageData.sessions_remaining - 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', session.client_package_id);

          if (packageError) throw packageError;
        }
      }

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

        {/* Action Buttons */}
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
            onClick={() => handleStatusUpdate('no_show')}
            disabled={loading || session.status === 'no_show'}
          >
            <UserX className="h-4 w-4 mr-2" />
            No Show
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline"
            onClick={() => handleStatusUpdate('cancelled')}
            disabled={loading || session.status === 'cancelled'}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          
          <Button 
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SessionManagementModal;