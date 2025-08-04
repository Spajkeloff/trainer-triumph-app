import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { clientService } from '@/services/clientService';
import { trainerService } from '@/services/trainerService';

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface AssignClientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainerId: string;
  trainerName: string;
  onClientsAssigned: () => void;
}

const AssignClientsModal: React.FC<AssignClientsModalProps> = ({
  isOpen,
  onClose,
  trainerId,
  trainerName,
  onClientsAssigned,
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [assignedClientIds, setAssignedClientIds] = useState<Set<string>>(new Set());
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, trainerId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all clients
      const allClients = await clientService.getAll();
      setClients(allClients);

      // Fetch currently assigned clients
      const trainerClients = await trainerService.getTrainerClients(trainerId);
      const assignedIds = new Set(trainerClients.map(tc => tc.client_id));
      setAssignedClientIds(assignedIds);
      setSelectedClientIds(new Set(assignedIds));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load clients data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClientToggle = (clientId: string, checked: boolean) => {
    const newSelected = new Set(selectedClientIds);
    if (checked) {
      newSelected.add(clientId);
    } else {
      newSelected.delete(clientId);
    }
    setSelectedClientIds(newSelected);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Determine which clients to assign and unassign
      const toAssign = Array.from(selectedClientIds).filter(id => !assignedClientIds.has(id));
      const toUnassign = Array.from(assignedClientIds).filter(id => !selectedClientIds.has(id));

      // Assign new clients
      for (const clientId of toAssign) {
        await trainerService.assignClient(trainerId, clientId);
      }

      // Unassign removed clients
      for (const clientId of toUnassign) {
        await trainerService.unassignClient(trainerId, clientId);
      }

      toast({
        title: "Client assignments updated",
        description: `Successfully updated client assignments for ${trainerName}.`,
      });

      onClientsAssigned();
      onClose();
    } catch (error: any) {
      console.error('Error updating client assignments:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update client assignments.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Clients to {trainerName}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[600px] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Assign Clients to {trainerName}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-3 py-4">
          {clients.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No clients available</p>
          ) : (
            clients.map((client) => (
              <div key={client.id} className="flex items-center space-x-3 p-3 rounded-lg border">
                <Checkbox
                  id={client.id}
                  checked={selectedClientIds.has(client.id)}
                  onCheckedChange={(checked) => handleClientToggle(client.id, checked as boolean)}
                />
                <label htmlFor={client.id} className="flex-1 cursor-pointer">
                  <div className="font-medium">{client.first_name} {client.last_name}</div>
                  <div className="text-sm text-muted-foreground">{client.email}</div>
                </label>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Assignments'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignClientsModal;