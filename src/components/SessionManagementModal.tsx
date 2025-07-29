import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
}

const SessionManagementModal = ({ isOpen, onClose, session, onSuccess }: SessionManagementModalProps) => {
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    date: "",
    start_time: "",
    end_time: "",
    notes: ""
  });
  const { toast } = useToast();

  // Initialize edit data when session changes
  useEffect(() => {
    if (session) {
      setEditData({
        date: session.date,
        start_time: session.start_time,
        end_time: session.end_time,
        notes: session.notes || ""
      });
    }
  }, [session]);

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

  const handleEdit = async () => {
    if (!session) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('sessions')
        .update({
          date: editData.date,
          start_time: editData.start_time,
          end_time: editData.end_time,
          notes: editData.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Session updated successfully",
      });

      setEditMode(false);
      onSuccess();
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-success text-success-foreground">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "no_show":
        return <Badge variant="secondary">No Show</Badge>;
      default:
        return <Badge>Scheduled</Badge>;
    }
  };

  if (!session) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Session Management</span>
            {getStatusBadge(session.status)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Session Details */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{session.clients.first_name} {session.clients.last_name}</span>
            </div>
            
            {editMode ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-date">Date</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={editData.date}
                    onChange={(e) => setEditData(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="edit-start">Start Time</Label>
                    <Input
                      id="edit-start"
                      type="time"
                      value={editData.start_time}
                      onChange={(e) => setEditData(prev => ({ ...prev, start_time: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-end">End Time</Label>
                    <Input
                      id="edit-end"
                      type="time"
                      value={editData.end_time}
                      onChange={(e) => setEditData(prev => ({ ...prev, end_time: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea
                    id="edit-notes"
                    value={editData.notes}
                    onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(session.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{session.start_time} - {session.end_time}</span>
                </div>
                {session.location && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{session.location}</span>
                  </div>
                )}
                {session.notes && (
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm">{session.notes}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {editMode ? (
              <div className="flex space-x-2">
                <Button onClick={handleEdit} disabled={loading} className="flex-1">
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="outline" onClick={() => setEditMode(false)} disabled={loading}>
                  Cancel
                </Button>
              </div>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setEditMode(true)}
                  className="w-full"
                  disabled={loading}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Details
                </Button>

                {session.status === 'scheduled' && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => handleStatusUpdate('completed')}
                      disabled={loading}
                      className="bg-success hover:bg-success/90 text-success-foreground"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleStatusUpdate('no_show')}
                      disabled={loading}
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      No Show
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleStatusUpdate('cancelled')}
                    disabled={loading}
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
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SessionManagementModal;