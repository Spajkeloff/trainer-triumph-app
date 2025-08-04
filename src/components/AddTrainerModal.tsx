import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { trainerService } from '@/services/trainerService';
import { useAuth } from '@/contexts/AuthContext';

interface AddTrainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrainerAdded: () => void;
}

const AddTrainerModal: React.FC<AddTrainerModalProps> = ({ isOpen, onClose, onTrainerAdded }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    payrollType: 'per_session' as 'per_session' | 'percentage',
    sessionRate: '',
    packagePercentage: '',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // 1. Create auth user for trainer
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true,
        user_metadata: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: 'trainer'
        }
      });

      if (authError) throw authError;

      // 2. Update the profile role to trainer
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          role: 'trainer',
          first_name: formData.firstName,
          last_name: formData.lastName 
        })
        .eq('user_id', authData.user.id);

      if (profileError) throw profileError;

      // 3. Create trainer record
      await trainerService.create({
        user_id: authData.user.id,
        payroll_type: formData.payrollType,
        session_rate: formData.payrollType === 'per_session' ? parseFloat(formData.sessionRate) || 0 : 0,
        package_percentage: formData.payrollType === 'percentage' ? parseFloat(formData.packagePercentage) || 0 : 0,
        created_by: user.id,
      });

      toast({
        title: "Trainer added successfully",
        description: `${formData.firstName} ${formData.lastName} has been added as a trainer.`,
      });

      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        payrollType: 'per_session',
        sessionRate: '',
        packagePercentage: '',
      });
      onTrainerAdded();
      onClose();
    } catch (error: any) {
      console.error('Error adding trainer:', error);
      toast({
        title: "Error adding trainer",
        description: error.message || "Failed to add trainer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Trainer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              required
              minLength={8}
            />
          </div>

          <div>
            <Label htmlFor="payrollType">Payroll Type</Label>
            <Select
              value={formData.payrollType}
              onValueChange={(value: 'per_session' | 'percentage') => 
                setFormData(prev => ({ ...prev, payrollType: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="per_session">Per Session</SelectItem>
                <SelectItem value="percentage">Percentage</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.payrollType === 'per_session' && (
            <div>
              <Label htmlFor="sessionRate">Rate per Session ($)</Label>
              <Input
                id="sessionRate"
                type="number"
                step="0.01"
                min="0"
                value={formData.sessionRate}
                onChange={(e) => setFormData(prev => ({ ...prev, sessionRate: e.target.value }))}
                placeholder="0.00"
              />
            </div>
          )}

          {formData.payrollType === 'percentage' && (
            <div>
              <Label htmlFor="packagePercentage">Package Percentage (%)</Label>
              <Input
                id="packagePercentage"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.packagePercentage}
                onChange={(e) => setFormData(prev => ({ ...prev, packagePercentage: e.target.value }))}
                placeholder="0.0"
              />
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Trainer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTrainerModal;