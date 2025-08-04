import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Settings, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { trainerService, Trainer } from '@/services/trainerService';
import AddTrainerModal from '@/components/AddTrainerModal';
import AssignClientsModal from '@/components/AssignClientsModal';

const TrainerManagement: React.FC = () => {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    try {
      const data = await trainerService.getAll();
      setTrainers(data);
    } catch (error) {
      console.error('Error fetching trainers:', error);
      toast({
        title: "Error",
        description: "Failed to load trainers.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrainer = async (trainer: Trainer) => {
    if (window.confirm(`Are you sure you want to delete trainer ${trainer.profiles?.first_name} ${trainer.profiles?.last_name}?`)) {
      try {
        await trainerService.delete(trainer.id);
        toast({
          title: "Trainer deleted",
          description: "Trainer has been successfully deleted.",
        });
        fetchTrainers();
      } catch (error: any) {
        console.error('Error deleting trainer:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to delete trainer.",
          variant: "destructive",
        });
      }
    }
  };

  const handleAssignClients = (trainer: Trainer) => {
    setSelectedTrainer(trainer);
    setShowAssignModal(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Trainer Management</h1>
          <p className="text-muted-foreground">Manage your trainers, assign clients, and set payroll</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Trainer
        </Button>
      </div>

      {trainers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No trainers yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by adding your first trainer to the system.
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Trainer
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {trainers.map((trainer) => (
            <Card key={trainer.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {trainer.profiles?.first_name} {trainer.profiles?.last_name}
                  </CardTitle>
                  <Badge variant="secondary" className="capitalize">
                    {trainer.payroll_type.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                    {trainer.payroll_type === 'per_session' ? (
                      <span>${trainer.session_rate} per session</span>
                    ) : (
                      <span>{trainer.package_percentage}% of packages</span>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAssignClients(trainer)}
                    className="flex-1"
                  >
                    <Users className="h-4 w-4 mr-1" />
                    Assign Clients
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteTrainer(trainer)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddTrainerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onTrainerAdded={fetchTrainers}
      />

      {selectedTrainer && (
        <AssignClientsModal
          isOpen={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedTrainer(null);
          }}
          trainerId={selectedTrainer.id}
          trainerName={`${selectedTrainer.profiles?.first_name} ${selectedTrainer.profiles?.last_name}`}
          onClientsAssigned={fetchTrainers}
        />
      )}
    </div>
  );
};

export default TrainerManagement;