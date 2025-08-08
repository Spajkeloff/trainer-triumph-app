import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { staffService, CreateStaffPayload } from '@/services/staffService';
import { useToast } from '@/components/ui/use-toast';

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStaffAdded: () => void;
}

const AddStaffModal = ({ isOpen, onClose, onStaffAdded }: AddStaffModalProps) => {
  const { toast } = useToast();

  // Account & login
  const [email, setEmail] = useState('');
  const [sendActivationEmail, setSendActivationEmail] = useState(true);
  const [customPassword, setCustomPassword] = useState('');
  const [loginAccess, setLoginAccess] = useState(true);

  // Profile
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [startDate, setStartDate] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Trainer
  const [isTrainer, setIsTrainer] = useState(false);
  const [payrollType, setPayrollType] = useState<'per_session' | 'percentage' | ''>('');
  const [sessionRate, setSessionRate] = useState<number | ''>('');
  const [packagePercentage, setPackagePercentage] = useState<number | ''>('');

  // Permissions
  const [perms, setPerms] = useState<Record<string, boolean>>({
    bookings_view_own: true,
    bookings_create_edit_own: false,
    bookings_reconcile_own: false,
    bookings_view_all: false,
    bookings_create_edit_all: false,
    bookings_reconcile_all: false,
    hide_booking_prices: false,
    prevent_edit_past_reconciled: true,
    clients_view: true,
    clients_show_financial_info: false,
    clients_hide_payment_integration: false,
    clients_hide_services: false,
    clients_assign_services: false,
    clients_only_show_assigned: true,
    prevent_changing_client_status: true,
    make_payment_access: false,
    only_data_for_assigned_clients: true,
    show_messages_sent_to_others: false,
  });

  const [saving, setSaving] = useState(false);

  const togglePerm = (key: string) => (checked: boolean | string) => {
    setPerms((p) => ({ ...p, [key]: Boolean(checked) }));
  };

  const reset = () => {
    setEmail('');
    setSendActivationEmail(true);
    setCustomPassword('');
    setLoginAccess(true);
    setFirstName('');
    setLastName('');
    setPhone('');
    setDateOfBirth('');
    setStartDate('');
    setAddress('');
    setNotes('');
    setIsTrainer(false);
    setPayrollType('');
    setSessionRate('');
    setPackagePercentage('');
    setPerms({
      bookings_view_own: true,
      bookings_create_edit_own: false,
      bookings_reconcile_own: false,
      bookings_view_all: false,
      bookings_create_edit_all: false,
      bookings_reconcile_all: false,
      hide_booking_prices: false,
      prevent_edit_past_reconciled: true,
      clients_view: true,
      clients_show_financial_info: false,
      clients_hide_payment_integration: false,
      clients_hide_services: false,
      clients_assign_services: false,
      clients_only_show_assigned: true,
      prevent_changing_client_status: true,
      make_payment_access: false,
      only_data_for_assigned_clients: true,
      show_messages_sent_to_others: false,
    });
  };

  const handleSave = async () => {
    try {
      if (!firstName || !lastName || !email) {
        toast({ title: 'Missing fields', description: 'First name, last name and email are required.' });
        return;
      }

      if (!sendActivationEmail && !customPassword) {
        toast({ title: 'Password required', description: 'Set a custom password or enable activation email.' });
        return;
      }

      if (isTrainer && !payrollType) {
        toast({ title: 'Payroll type required', description: 'Select payroll type for trainers.' });
        return;
      }

      setSaving(true);

      const payload: CreateStaffPayload = {
        email,
        sendActivationEmail,
        customPassword: sendActivationEmail ? undefined : customPassword,
        firstName,
        lastName,
        phone: phone || undefined,
        dateOfBirth: dateOfBirth || undefined,
        startDate: startDate || undefined,
        notes: notes || undefined,
        address: address || undefined,
        loginAccess,
        isTrainer,
        payrollType: isTrainer ? (payrollType as any) : undefined,
        sessionRate: isTrainer && payrollType === 'per_session' ? Number(sessionRate) || 0 : 0,
        packagePercentage: isTrainer && payrollType === 'percentage' ? Number(packagePercentage) || 0 : 0,
        permissions: perms,
      };

      await staffService.createStaff(payload);
      toast({ title: 'Staff created', description: `${firstName} ${lastName} was added successfully.` });
      reset();
      onStaffAdded();
      onClose();
    } catch (e: any) {
      toast({ title: 'Failed to create staff', description: e.message || 'Unexpected error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add Staff Member</DialogTitle>
          <DialogDescription>Set login, profile, trainer pay rates and granular permissions.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <Label>Email *</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox checked={sendActivationEmail} onCheckedChange={(v) => setSendActivationEmail(Boolean(v))} id="send-activation" />
              <Label htmlFor="send-activation">Send activation email</Label>
            </div>
            {!sendActivationEmail && (
              <div>
                <Label>Set custom password</Label>
                <Input type="password" value={customPassword} onChange={(e) => setCustomPassword(e.target.value)} />
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Checkbox checked={loginAccess} onCheckedChange={(v) => setLoginAccess(Boolean(v))} id="login-access" />
              <Label htmlFor="login-access">Login access</Label>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>First name *</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div>
                <Label>Last name *</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Birthday</Label>
                <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
              </div>
              <div>
                <Label>Start date</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Address</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Trainer & Pay rates */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox checked={isTrainer} onCheckedChange={(v) => setIsTrainer(Boolean(v))} id="is-trainer" />
            <Label htmlFor="is-trainer">Is a Trainer</Label>
          </div>
          {isTrainer && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Profile Pay Rates</Label>
                <Select value={payrollType} onValueChange={(v: any) => setPayrollType(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payroll type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_session">Per Session</SelectItem>
                    <SelectItem value="percentage">Percentage of Package</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {payrollType === 'per_session' && (
                <div>
                  <Label>Session rate</Label>
                  <Input type="number" value={sessionRate as any} onChange={(e) => setSessionRate(e.target.value ? Number(e.target.value) : '')} />
                </div>
              )}
              {payrollType === 'percentage' && (
                <div>
                  <Label>Package percentage (%)</Label>
                  <Input type="number" value={packagePercentage as any} onChange={(e) => setPackagePercentage(e.target.value ? Number(e.target.value) : '')} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Permissions */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="font-medium mb-2">Bookings</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2"><Checkbox checked={perms.bookings_view_own} onCheckedChange={togglePerm('bookings_view_own')} id="b1" /><Label htmlFor="b1">View their own bookings</Label></div>
              <div className="flex items-center space-x-2 ml-4"><Checkbox checked={perms.bookings_create_edit_own} onCheckedChange={togglePerm('bookings_create_edit_own')} id="b2" /><Label htmlFor="b2">+ create/edit own bookings</Label></div>
              <div className="flex items-center space-x-2 ml-4"><Checkbox checked={perms.bookings_reconcile_own} onCheckedChange={togglePerm('bookings_reconcile_own')} id="b3" /><Label htmlFor="b3">+ allow reconciling</Label></div>
              <div className="flex items-center space-x-2"><Checkbox checked={perms.bookings_view_all} onCheckedChange={togglePerm('bookings_view_all')} id="b4" /><Label htmlFor="b4">View everyone's bookings</Label></div>
              <div className="flex items-center space-x-2 ml-4"><Checkbox checked={perms.bookings_create_edit_all} onCheckedChange={togglePerm('bookings_create_edit_all')} id="b5" /><Label htmlFor="b5">+ create/edit bookings</Label></div>
              <div className="flex items-center space-x-2 ml-4"><Checkbox checked={perms.bookings_reconcile_all} onCheckedChange={togglePerm('bookings_reconcile_all')} id="b6" /><Label htmlFor="b6">+ allow reconciling</Label></div>
              <div className="flex items-center space-x-2"><Checkbox checked={perms.hide_booking_prices} onCheckedChange={togglePerm('hide_booking_prices')} id="b7" /><Label htmlFor="b7">Hide booking prices</Label></div>
              <div className="flex items-center space-x-2"><Checkbox checked={perms.prevent_edit_past_reconciled} onCheckedChange={togglePerm('prevent_edit_past_reconciled')} id="b8" /><Label htmlFor="b8">Prevent editing past reconciled bookings</Label></div>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Clients</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2"><Checkbox checked={perms.clients_view} onCheckedChange={togglePerm('clients_view')} id="c1" /><Label htmlFor="c1">Clients</Label></div>
              <div className="flex items-center space-x-2 ml-4"><Checkbox checked={perms.clients_show_financial_info} onCheckedChange={togglePerm('clients_show_financial_info')} id="c2" /><Label htmlFor="c2">+ show financial info</Label></div>
              <div className="flex items-center space-x-2 ml-4"><Checkbox checked={perms.clients_hide_payment_integration} onCheckedChange={togglePerm('clients_hide_payment_integration')} id="c3" /><Label htmlFor="c3">+ hide payment integration</Label></div>
              <div className="flex items-center space-x-2 ml-4"><Checkbox checked={perms.clients_hide_services} onCheckedChange={togglePerm('clients_hide_services')} id="c4" /><Label htmlFor="c4">+ hide services</Label></div>
              <div className="flex items-center space-x-2 ml-4"><Checkbox checked={perms.clients_assign_services} onCheckedChange={togglePerm('clients_assign_services')} id="c5" /><Label htmlFor="c5">+ assign services</Label></div>
              <div className="flex items-center space-x-2 ml-4"><Checkbox checked={perms.clients_only_show_assigned} onCheckedChange={togglePerm('clients_only_show_assigned')} id="c6" /><Label htmlFor="c6">+ only show 'assigned' clients</Label></div>
              <div className="flex items-center space-x-2 ml-4"><Checkbox checked={perms.prevent_changing_client_status} onCheckedChange={togglePerm('prevent_changing_client_status')} id="c7" /><Label htmlFor="c7">+ prevent changing client status</Label></div>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Other</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2"><Checkbox checked={perms.make_payment_access} onCheckedChange={togglePerm('make_payment_access')} id="o1" /><Label htmlFor="o1">Access to 'Make a payment'</Label></div>
              <div className="flex items-center space-x-2"><Checkbox checked={perms.only_data_for_assigned_clients} onCheckedChange={togglePerm('only_data_for_assigned_clients')} id="o2" /><Label htmlFor="o2">Only show data that relates to assigned clients</Label></div>
              <div className="flex items-center space-x-2"><Checkbox checked={perms.show_messages_sent_to_others} onCheckedChange={togglePerm('show_messages_sent_to_others')} id="o3" /><Label htmlFor="o3">Show messages sent to other trainers</Label></div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Create Staff'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddStaffModal;
