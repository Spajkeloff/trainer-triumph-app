import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Users, Plus } from "lucide-react";

interface BookSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedDate?: Date;
  selectedTime?: string;
}

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface ClientPackage {
  id: string;
  client_id: string;
  package_id: string;
  sessions_remaining: number;
  packages: {
    name: string;
    price: number;
  };
}

const BookSessionModal = ({ isOpen, onClose, onSuccess, selectedDate, selectedTime }: BookSessionModalProps) => {
  const [activeTab, setActiveTab] = useState("book-session");
  const [clients, setClients] = useState<Client[]>([]);
  const [clientPackages, setClientPackages] = useState<ClientPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    date: selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    start_time: selectedTime ? selectedTime.split(':')[0].padStart(2, '0') + ':00' : "09:00",
    end_time: "10:00",
    client_id: "",
    trainer_id: "", // Will be set to current user
    type: "personal",
    location: "Gym",
    notes: "",
    price: "",
    use_package: false,
    client_package_id: "",
    session_category: "Personal Training",
    payment_category: "Session",
    recurring: false,
    service_type: "private",
    repeat_type: "weekly",
    repeat_days: [] as string[],
    repeat_until: "3_months",
    repeat_frequency: 1
  });

  useEffect(() => {
    if (isOpen) {
      fetchClients();
      // Update form data when modal opens with selected date and time
      if (selectedDate || selectedTime) {
        setFormData(prev => ({
          ...prev,
          date: selectedDate ? selectedDate.toISOString().split('T')[0] : prev.date,
          start_time: selectedTime ? selectedTime.split(':')[0].padStart(2, '0') + ':00' : prev.start_time
        }));
      }
    }
  }, [isOpen, selectedDate, selectedTime]);

  useEffect(() => {
    if (formData.client_id) {
      fetchClientPackages(formData.client_id);
    }
  }, [formData.client_id]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email')
        .order('first_name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchClientPackages = async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from('client_packages')
        .select(`
          id,
          client_id,
          package_id,
          sessions_remaining,
          packages (name, price)
        `)
        .eq('client_id', clientId)
        .eq('status', 'active')
        .gt('sessions_remaining', 0);

      if (error) throw error;
      setClientPackages(data || []);
    } catch (error) {
      console.error('Error fetching client packages:', error);
    }
  };

  const filteredClients = clients.filter(client =>
    `${client.first_name} ${client.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get current user for trainer_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const sessionData = {
        date: formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        client_id: formData.client_id,
        trainer_id: user.id,
        type: formData.type,
        location: formData.location,
        notes: formData.notes,
        price: formData.use_package ? null : parseFloat(formData.price),
        client_package_id: formData.use_package ? formData.client_package_id : null,
        status: 'scheduled',
        duration: 60 // Default 60 minutes
      };

      let sessionsToCreate = [sessionData];

      // Generate recurring sessions if enabled
      if (formData.recurring) {
        sessionsToCreate = generateRecurringSessions(sessionData);
      }

      const { error: sessionError } = await supabase
        .from('sessions')
        .insert(sessionsToCreate);

      if (sessionError) throw sessionError;

      // If using package, deduct sessions based on number created
      if (formData.use_package && formData.client_package_id) {
        const sessionsCount = sessionsToCreate.length;
        // Get current sessions remaining and decrement
        const { data: packageData } = await supabase
          .from('client_packages')
          .select('sessions_remaining')
          .eq('id', formData.client_package_id)
          .single();

        const { error: packageError } = await supabase
          .from('client_packages')
          .update({ 
            sessions_remaining: Math.max(0, (packageData?.sessions_remaining || sessionsCount) - sessionsCount),
            updated_at: new Date().toISOString()
          })
          .eq('id', formData.client_package_id);

        if (packageError) throw packageError;
      }

      // Create payment record if not using package
      if (!formData.use_package && formData.price) {
        const totalAmount = parseFloat(formData.price) * sessionsToCreate.length;
        const { error: paymentError } = await supabase
          .from('payments')
          .insert([{
            client_id: formData.client_id,
            amount: totalAmount,
            payment_method: 'cash',
            status: 'pending',
            description: `${sessionsToCreate.length} session(s) on ${formData.date}${formData.recurring ? ' (recurring)' : ''}`
          }]);

        if (paymentError) throw paymentError;
      }

      toast({
        title: "Success",
        description: `${sessionsToCreate.length} session(s) booked successfully`,
      });

      onSuccess();
      onClose();
      resetForm();

    } catch (error) {
      console.error('Error booking session:', error);
      toast({
        title: "Error",
        description: "Failed to book session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      start_time: "09:00",
      end_time: "10:00",
      client_id: "",
      trainer_id: "",
      type: "personal",
      location: "Gym",
      notes: "",
      price: "",
      use_package: false,
      client_package_id: "",
      session_category: "Personal Training",
      payment_category: "Session",
      recurring: false,
      service_type: "private",
      repeat_type: "weekly",
      repeat_days: [] as string[],
      repeat_until: "3_months",
      repeat_frequency: 1
    });
    setSearchTerm("");
    setClientPackages([]);
  };

  const calculateEndTime = (startTime: string) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = hours + 1;
    return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (formData.start_time) {
      setFormData(prev => ({
        ...prev,
        end_time: calculateEndTime(prev.start_time)
      }));
    }
  }, [formData.start_time]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">
                {selectedDate ? selectedDate.toLocaleDateString() : "Book Session"}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {formData.start_time} - {formData.end_time} • 60 mins
              </p>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="book-session">Book Session</TabsTrigger>
            <TabsTrigger value="book-class">Book Class</TabsTrigger>
            <TabsTrigger value="availability">Set Availability</TabsTrigger>
          </TabsList>

          <TabsContent value="book-session" className="space-y-6 mt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Service Type */}
              <div>
                <Label htmlFor="service">Service</Label>
                <Select value={formData.service_type} onValueChange={(value) => setFormData(prev => ({ ...prev, service_type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private room</SelectItem>
                    <SelectItem value="shared">Shared room/resource</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clients */}
              <div>
                <Label>Clients</Label>
                <div className="space-y-3">
                  <div className="relative">
                    <Input
                      placeholder="Type to search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10"
                    />
                    <Users className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  {searchTerm && (
                    <div className="max-h-32 overflow-y-auto border rounded-md">
                      {filteredClients.map((client) => (
                        <div
                          key={client.id}
                          className={`p-2 cursor-pointer hover:bg-muted ${
                            formData.client_id === client.id ? 'bg-primary/10' : ''
                          }`}
                          onClick={() => {
                            setFormData(prev => ({ ...prev, client_id: client.id }));
                            setSearchTerm(`${client.first_name} ${client.last_name}`);
                          }}
                        >
                          <div className="text-sm font-medium">{client.first_name} {client.last_name}</div>
                          <div className="text-xs text-muted-foreground">{client.email}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {formData.client_id && (
                    <div className="flex items-center space-x-2">
                      <Badge>{clients.find(c => c.id === formData.client_id)?.first_name} {clients.find(c => c.id === formData.client_id)?.last_name}</Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, client_id: "" }));
                          setSearchTerm("");
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Write your description"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
                <div className="flex items-center mt-2">
                  <input type="checkbox" id="save-template" className="mr-2" />
                  <Label htmlFor="save-template" className="text-sm">Save as session template</Label>
                </div>
              </div>

              {/* Package or Price */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Switch
                    checked={formData.use_package}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, use_package: checked }))}
                  />
                  <Label>Use package or membership instead</Label>
                </div>

                {formData.use_package ? (
                  <div>
                    <Label>Select Package</Label>
                    <Select value={formData.client_package_id} onValueChange={(value) => setFormData(prev => ({ ...prev, client_package_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select package" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientPackages.map((pkg) => (
                          <SelectItem key={pkg.id} value={pkg.id}>
                            {pkg.packages.name} - {pkg.sessions_remaining} sessions left
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="price">Price</Label>
                    <div className="flex">
                      <span className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted text-muted-foreground">DH</span>
                      <Input
                        id="price"
                        type="number"
                        placeholder="0"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        className="rounded-l-none"
                        required={!formData.use_package}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Category */}
              <div>
                <Label>Payment category</Label>
                <Select value={formData.payment_category} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Session">Session</SelectItem>
                    <SelectItem value="Package">Package</SelectItem>
                    <SelectItem value="Membership">Membership</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Session Category */}
              <div>
                <Label>Session category</Label>
                <Select value={formData.session_category} onValueChange={(value) => setFormData(prev => ({ ...prev, session_category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Personal Training">🔴 Personal Training</SelectItem>
                    <SelectItem value="EMS Training">⚡ EMS Training</SelectItem>
                    <SelectItem value="Group PT">👥 Group PT</SelectItem>
                    <SelectItem value="Trial Session">🎯 Trial Session</SelectItem>
                    <SelectItem value="EMS Trial Session">⚡ EMS Trial Session</SelectItem>
                    <SelectItem value="Personal Training Trial Session">🔴 Personal Training Trial Session</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div>
                <Label>Location</Label>
                <Select value={formData.location} onValueChange={(value) => setFormData(prev => ({ ...prev, location: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Gym">Gym</SelectItem>
                    <SelectItem value="Studio A">Studio A</SelectItem>
                    <SelectItem value="Studio B">Studio B</SelectItem>
                    <SelectItem value="Outdoor">Outdoor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Recurring Session */}
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.recurring}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, recurring: checked }))}
                />
                <Label>Recurring session</Label>
              </div>

              {/* Recurring Options */}
              {formData.recurring && (
                <div className="space-y-4 border border-border rounded-lg p-4 bg-muted/30">
                  <h4 className="font-medium">Recurring Settings</h4>
                  
                  {/* Repeat Type */}
                  <div>
                    <Label>Repeat</Label>
                    <div className="flex gap-2 mt-2">
                      {["daily", "weekly", "fortnightly", "monthly", "yearly"].map((type) => (
                        <Button
                          key={type}
                          type="button"
                          variant={formData.repeat_type === type ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFormData(prev => ({ ...prev, repeat_type: type }))}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Days of the Week (for weekly/fortnightly) */}
                  {(formData.repeat_type === "weekly" || formData.repeat_type === "fortnightly") && (
                    <div>
                      <Label>Days of the week</Label>
                      <div className="flex gap-2 mt-2">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                          <Button
                            key={day}
                            type="button"
                            variant={formData.repeat_days.includes(day) ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              const updatedDays = formData.repeat_days.includes(day)
                                ? formData.repeat_days.filter(d => d !== day)
                                : [...formData.repeat_days, day];
                              setFormData(prev => ({ ...prev, repeat_days: updatedDays }));
                            }}
                          >
                            {day}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Repeat Until */}
                  <div>
                    <Label>Repeat until</Label>
                    <div className="flex gap-2 mt-2">
                      <Button
                        type="button"
                        variant={formData.repeat_until === "3_months" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, repeat_until: "3_months" }))}
                      >
                        3 months
                      </Button>
                      <Button
                        type="button"
                        variant={formData.repeat_until === "6_months" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, repeat_until: "6_months" }))}
                      >
                        6 months
                      </Button>
                      <Button
                        type="button"
                        variant={formData.repeat_until === "no_end" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, repeat_until: "no_end" }))}
                      >
                        No end date (endless)
                      </Button>
                    </div>
                  </div>

                  {/* Frequency */}
                  <div>
                    <Label>Frequency</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm">Every</span>
                      <Input
                        type="number"
                        min="1"
                        value={formData.repeat_frequency}
                        onChange={(e) => setFormData(prev => ({ ...prev, repeat_frequency: parseInt(e.target.value) || 1 }))}
                        className="w-20"
                      />
                      <span className="text-sm">week(s)</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-4">
                <Button type="button" variant="ghost" className="text-primary">
                  Set trainer rate overrides
                </Button>
                <Button type="submit" disabled={loading || !formData.client_id}>
                  {loading ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="book-class">
            <div className="text-center py-8 text-muted-foreground">
              Class booking coming soon
            </div>
          </TabsContent>

          <TabsContent value="availability">
            <div className="text-center py-8 text-muted-foreground">
              Availability settings coming soon
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default BookSessionModal;