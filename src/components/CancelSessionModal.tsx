import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Calendar, Clock, User } from 'lucide-react';

interface Session {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: string;
  trainer_id: string;
}

interface CancelSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session | null;
  onConfirm: (reason?: string) => void;
  loading?: boolean;
}

const CANCELLATION_REASONS = [
  { value: 'feeling_unwell', label: 'Feeling unwell' },
  { value: 'work_conflict', label: 'Work conflict' },
  { value: 'personal_emergency', label: 'Personal emergency' },
  { value: 'travel', label: 'Travel' },
  { value: 'other', label: 'Other' }
];

const CancelSessionModal: React.FC<CancelSessionModalProps> = ({
  open,
  onOpenChange,
  session,
  onConfirm,
  loading = false
}) => {
  const [reason, setReason] = useState<string>('');

  const handleConfirm = () => {
    onConfirm(reason || undefined);
    setReason(''); // Reset after confirmation
  };

  const handleCancel = () => {
    onOpenChange(false);
    setReason(''); // Reset on cancel
  };

  if (!session) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Cancel Session?
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel this training session?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Session Details */}
          <div className="bg-muted rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{session.type}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {new Date(session.date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {session.start_time} - {session.end_time}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              Trainer: Sarah Johnson
            </div>
          </div>

          {/* Warning */}
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
            <p className="text-sm text-warning-foreground">
              Sessions cancelled at least 24 hours in advance will be credited back to your package.
            </p>
          </div>

          {/* Cancellation Reason */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Reason for cancellation (optional)
            </label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {CANCELLATION_REASONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Keep Session
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Cancelling...' : 'Cancel Session'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CancelSessionModal;