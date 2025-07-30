import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Textarea } from "../components/ui/textarea";
import { 
  Building2,
  Users,
  Clock,
  Bell,
  CreditCard,
  FileText,
  Save,
  Globe,
  ExternalLink,
  Copy
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import { clientAreaService, type ClientAreaSettings } from "../services/clientAreaService";
import { useToast } from "../hooks/use-toast";

const Settings = () => {
  const [activeTab, setActiveTab] = useState<"business" | "staff" | "hours" | "notifications" | "payments" | "tax" | "clientarea">("business");
  const [clientAreaSettings, setClientAreaSettings] = useState<ClientAreaSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load client area settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const settings = await clientAreaService.getSettings();
        if (settings) {
          setClientAreaSettings(settings);
        } else {
          // Use default settings if none exist
          const defaultSettings = await clientAreaService.getDefaultSettings();
          setClientAreaSettings(defaultSettings);
        }
      } catch (error) {
        console.error('Error loading client area settings:', error);
        toast({
          title: "Error",
          description: "Failed to load client area settings",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === "clientarea") {
      loadSettings();
    }
  }, [activeTab, toast]);

  const handleSaveClientAreaSettings = async () => {
    if (!clientAreaSettings) return;

    try {
      setLoading(true);
      await clientAreaService.createOrUpdateSettings(clientAreaSettings);
      toast({
        title: "Success",
        description: "Client area settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving client area settings:', error);
      toast({
        title: "Error",
        description: "Failed to save client area settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateClientAreaSetting = (key: keyof ClientAreaSettings, value: any) => {
    if (!clientAreaSettings) return;
    setClientAreaSettings({
      ...clientAreaSettings,
      [key]: value,
    });
  };

  const renderBusinessInfo = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Building2 className="h-5 w-5 mr-2" />
          Business Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name</Label>
            <Input id="businessName" defaultValue="TrainWithUs Fitness Studio" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ownerName">Owner Name</Label>
            <Input id="ownerName" defaultValue="Ahmed Al-Rashid" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Business Email</Label>
            <Input id="email" type="email" defaultValue="info@trainwithus.ae" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" defaultValue="+971 4 123 4567" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trn">TRN (Tax Registration Number)</Label>
            <Input id="trn" defaultValue="100123456789012" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="license">Trade License Number</Label>
            <Input id="license" defaultValue="CN-1234567" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Business Address</Label>
          <Textarea 
            id="address" 
            defaultValue="Dubai Marina, Tower A, Floor 5, Dubai, UAE"
            rows={3}
          />
        </div>
        <Button>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </CardContent>
    </Card>
  );

  const renderStaffManagement = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Staff Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Current Staff</h3>
          <Button>Add New Staff</Button>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div>
              <h4 className="font-medium">Ahmed Al-Rashid</h4>
              <p className="text-sm text-muted-foreground">Owner & Head Trainer</p>
              <p className="text-sm text-muted-foreground">ahmed@trainwithus.ae</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-success">Active</span>
              <Button variant="outline" size="sm">Edit</Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div>
              <h4 className="font-medium">Sarah Al-Zahra</h4>
              <p className="text-sm text-muted-foreground">Yoga Instructor</p>
              <p className="text-sm text-muted-foreground">sarah@trainwithus.ae</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-success">Active</span>
              <Button variant="outline" size="sm">Edit</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderWorkingHours = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Working Hours
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {[
            { day: "Monday", open: "06:00", close: "22:00", enabled: true },
            { day: "Tuesday", open: "06:00", close: "22:00", enabled: true },
            { day: "Wednesday", open: "06:00", close: "22:00", enabled: true },
            { day: "Thursday", open: "06:00", close: "22:00", enabled: true },
            { day: "Friday", open: "06:00", close: "20:00", enabled: true },
            { day: "Saturday", open: "08:00", close: "18:00", enabled: true },
            { day: "Sunday", open: "08:00", close: "18:00", enabled: false },
          ].map((schedule) => (
            <div key={schedule.day} className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-center space-x-4">
                <Switch checked={schedule.enabled} />
                <span className="font-medium w-20">{schedule.day}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Input 
                  type="time" 
                  defaultValue={schedule.open} 
                  className="w-32"
                  disabled={!schedule.enabled}
                />
                <span>to</span>
                <Input 
                  type="time" 
                  defaultValue={schedule.close} 
                  className="w-32"
                  disabled={!schedule.enabled}
                />
              </div>
            </div>
          ))}
        </div>
        <Button>
          <Save className="h-4 w-4 mr-2" />
          Save Hours
        </Button>
      </CardContent>
    </Card>
  );

  const renderNotifications = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="h-5 w-5 mr-2" />
          Notification Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Email Notifications</h4>
              <p className="text-sm text-muted-foreground">Receive notifications via email</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">SMS Notifications</h4>
              <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Session Reminders</h4>
              <p className="text-sm text-muted-foreground">Send automatic session reminders to clients</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Payment Reminders</h4>
              <p className="text-sm text-muted-foreground">Send payment due reminders</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">New Lead Alerts</h4>
              <p className="text-sm text-muted-foreground">Get notified when new leads sign up</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
        
        <div className="space-y-4 pt-4 border-t">
          <h4 className="font-medium">Reminder Timing</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sessionReminder">Session Reminder (hours before)</Label>
              <Input id="sessionReminder" type="number" defaultValue="24" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentReminder">Payment Reminder (days before due)</Label>
              <Input id="paymentReminder" type="number" defaultValue="3" />
            </div>
          </div>
        </div>
        
        <Button>
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );

  const renderPaymentMethods = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          Payment Methods
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Cash Payments</h4>
              <p className="text-sm text-muted-foreground">Accept cash payments in person</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Card Payments</h4>
              <p className="text-sm text-muted-foreground">Credit/Debit card payments</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Bank Transfer</h4>
              <p className="text-sm text-muted-foreground">Direct bank transfers</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Digital Wallets</h4>
              <p className="text-sm text-muted-foreground">Apple Pay, Google Pay, etc.</p>
            </div>
            <Switch />
          </div>
        </div>
        
        <div className="space-y-4 pt-4 border-t">
          <h4 className="font-medium">Bank Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input id="bankName" defaultValue="Emirates NBD" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input id="accountNumber" defaultValue="0123456789" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="iban">IBAN</Label>
              <Input id="iban" defaultValue="AE070260001234567890123" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="swiftCode">SWIFT Code</Label>
              <Input id="swiftCode" defaultValue="EBILAEAD" />
            </div>
          </div>
        </div>
        
        <Button>
          <Save className="h-4 w-4 mr-2" />
          Save Payment Settings
        </Button>
      </CardContent>
    </Card>
  );

  const renderTaxSettings = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Tax Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">VAT Registration</h4>
              <p className="text-sm text-muted-foreground">Include VAT in invoices and receipts</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="vatRate">VAT Rate (%)</Label>
            <Input id="vatRate" type="number" defaultValue="5" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vatNumber">VAT Registration Number</Label>
            <Input id="vatNumber" defaultValue="100123456789012" />
          </div>
        </div>
        
        <div className="space-y-4 pt-4 border-t">
          <h4 className="font-medium">Invoice Settings</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium">Auto-generate Invoice Numbers</h5>
                <p className="text-sm text-muted-foreground">Automatically create sequential invoice numbers</p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                <Input id="invoicePrefix" defaultValue="TWU" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nextInvoiceNumber">Next Invoice Number</Label>
                <Input id="nextInvoiceNumber" type="number" defaultValue="1001" />
              </div>
            </div>
          </div>
        </div>
        
        <Button>
          <Save className="h-4 w-4 mr-2" />
          Save Tax Settings
        </Button>
      </CardContent>
    </Card>
  );

  const renderClientArea = () => {
    if (!clientAreaSettings) {
      return (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading client area settings...</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {/* Client Settings Tab */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="h-5 w-5 mr-2" />
              Client Area
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable Client Area */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Enable Client Area</h4>
                <p className="text-sm text-muted-foreground">Allow clients to access their portal</p>
              </div>
              <Switch 
                checked={clientAreaSettings.enabled} 
                onCheckedChange={(checked) => updateClientAreaSetting('enabled', checked)}
              />
            </div>

            {/* Client Area Website */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium">Client Area Website</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clientAreaName">Client area name:</Label>
                  <div className="flex items-center space-x-2">
                    <Input 
                      id="clientAreaName" 
                      value={clientAreaSettings.client_area_name}
                      onChange={(e) => updateClientAreaSetting('client_area_name', e.target.value)}
                      className="w-32"
                    />
                    <span className="text-muted-foreground">.trainwithus.com</span>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button variant="outline" size="sm">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="customWebsite" 
                    checked={clientAreaSettings.custom_website_enabled}
                    onCheckedChange={(checked) => updateClientAreaSetting('custom_website_enabled', checked)}
                  />
                  <Label htmlFor="customWebsite">I already have my own website</Label>
                  <Input 
                    value={clientAreaSettings.custom_website_url || ''}
                    onChange={(e) => updateClientAreaSetting('custom_website_url', e.target.value)}
                    className="flex-1"
                    placeholder="https://yourwebsite.com"
                  />
                  <Button variant="outline" size="sm">Edit</Button>
                </div>
              </div>
            </div>

            {/* Available Features */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium">Available Features</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={clientAreaSettings.allow_session_bookings}
                    onCheckedChange={(checked) => updateClientAreaSetting('allow_session_bookings', checked)}
                  />
                  <Label>Allow online Session bookings</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={clientAreaSettings.allow_class_bookings}
                    onCheckedChange={(checked) => updateClientAreaSetting('allow_class_bookings', checked)}
                  />
                  <Label>Allow online Class bookings</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={clientAreaSettings.allow_store_purchases}
                    onCheckedChange={(checked) => updateClientAreaSetting('allow_store_purchases', checked)}
                  />
                  <Label>Allow online Store purchases</Label>
                </div>
              </div>
            </div>

            {/* Client Homepage Area */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium">Client Homepage Area</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    checked={clientAreaSettings.hide_session_bookings_button}
                    onCheckedChange={(checked) => updateClientAreaSetting('hide_session_bookings_button', checked)}
                  />
                  <Label>Hide the Session bookings button</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    checked={clientAreaSettings.hide_class_bookings_button}
                    onCheckedChange={(checked) => updateClientAreaSetting('hide_class_bookings_button', checked)}
                  />
                  <Label>Hide the Class bookings button</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    checked={clientAreaSettings.hide_store_button}
                    onCheckedChange={(checked) => updateClientAreaSetting('hide_store_button', checked)}
                  />
                  <Label>Hide the Store button</Label>
                </div>
              </div>
            </div>

            {/* Client Logged In Area */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium">Client Logged In Area</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      checked={clientAreaSettings.hide_my_bookings}
                      onCheckedChange={(checked) => updateClientAreaSetting('hide_my_bookings', checked)}
                    />
                    <Label>Hide My Bookings</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      checked={clientAreaSettings.hide_class_booking}
                      onCheckedChange={(checked) => updateClientAreaSetting('hide_class_booking', checked)}
                    />
                    <Label>Hide Class Booking</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      checked={clientAreaSettings.hide_session_booking}
                      onCheckedChange={(checked) => updateClientAreaSetting('hide_session_booking', checked)}
                    />
                    <Label>Hide Session Booking</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      checked={clientAreaSettings.hide_workout}
                      onCheckedChange={(checked) => updateClientAreaSetting('hide_workout', checked)}
                    />
                    <Label>Hide Workout</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      checked={clientAreaSettings.hide_nutrition}
                      onCheckedChange={(checked) => updateClientAreaSetting('hide_nutrition', checked)}
                    />
                    <Label>Hide Nutrition</Label>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      checked={clientAreaSettings.hide_assessments}
                      onCheckedChange={(checked) => updateClientAreaSetting('hide_assessments', checked)}
                    />
                    <Label>Hide Assessments</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      checked={clientAreaSettings.hide_finances}
                      onCheckedChange={(checked) => updateClientAreaSetting('hide_finances', checked)}
                    />
                    <Label>Hide Finances</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      checked={clientAreaSettings.hide_charges_payments}
                      onCheckedChange={(checked) => updateClientAreaSetting('hide_charges_payments', checked)}
                    />
                    <Label>Hide total of charges & payments</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      checked={clientAreaSettings.hide_packages_memberships}
                      onCheckedChange={(checked) => updateClientAreaSetting('hide_packages_memberships', checked)}
                    />
                    <Label>Hide assigned Packages & Memberships from the dashboard</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      checked={clientAreaSettings.hide_shared_items}
                      onCheckedChange={(checked) => updateClientAreaSetting('hide_shared_items', checked)}
                    />
                    <Label>Hide Shared Items</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      checked={clientAreaSettings.hide_store}
                      onCheckedChange={(checked) => updateClientAreaSetting('hide_store', checked)}
                    />
                    <Label>Hide Store</Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Sign Up and Login Settings */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium">Sign Up and Login Settings</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>After a client signs up, take them to this page first:</Label>
                  <Select 
                    value={clientAreaSettings.signup_redirect_page}
                    onValueChange={(value) => updateClientAreaSetting('signup_redirect_page', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bookings">Bookings</SelectItem>
                      <SelectItem value="dashboard">Dashboard</SelectItem>
                      <SelectItem value="profile">Profile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>When a client logs in, take them to this page first:</Label>
                  <Select 
                    value={clientAreaSettings.login_redirect_page}
                    onValueChange={(value) => updateClientAreaSetting('login_redirect_page', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="finances">Finances</SelectItem>
                      <SelectItem value="bookings">Bookings</SelectItem>
                      <SelectItem value="dashboard">Dashboard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    checked={clientAreaSettings.disallow_new_signups}
                    onCheckedChange={(checked) => updateClientAreaSetting('disallow_new_signups', checked)}
                  />
                  <Label>Disallow new clients to Sign Up through the Client Area</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    checked={clientAreaSettings.allow_inactive_reactivation}
                    onCheckedChange={(checked) => updateClientAreaSetting('allow_inactive_reactivation', checked)}
                  />
                  <Label>Allow clients with an Inactive status to reactivate their account when they attempt to log back in</Label>
                </div>
              </div>
            </div>

            <Button onClick={handleSaveClientAreaSettings} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Client Area Settings'}
            </Button>
          </CardContent>
        </Card>

      {/* Sessions Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Sessions can be booked:</Label>
              <Select defaultValue="without-approval">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="without-approval">without my approval</SelectItem>
                  <SelectItem value="with-approval">with my approval only (session request)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox />
                <Label>Only allow clients to book/request in by choosing a Service, which uses my Session Templates list</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox />
                <Label>Override the amount to use the client's default session cost instead (if set)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox />
                <Label>Allow clients to request/book sessions on timeslots which are already occupied</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox />
                <Label>Hide the price on Session events</Label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Display timeslots in</Label>
                <div className="flex items-center space-x-2">
                  <Input type="number" defaultValue="30" className="w-20" />
                  <span>minute increments</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Restrict clients booking within</Label>
                <div className="flex items-center space-x-2">
                  <Input type="number" defaultValue="1" className="w-20" />
                  <span>hours of the session start time</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Classes Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Classes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>When clients try sign up to a class online:</Label>
              <Select defaultValue="immediate">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Neither, clients can sign up to classes immediately</SelectItem>
                  <SelectItem value="approval">Require approval</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox />
                <Label>Display how many booking spaces are left when clients view the Class Schedule</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox />
                <Label>Disable the Waiting list feature, so clients cannot join a waiting list if a class is full</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox />
                <Label>Do not allow customers to join the waiting list unless they have the credits that are required to book class</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox />
                <Label>Allow Clients to book multiple classes on the same time slots</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox />
                <Label>Hide the price from the Class Schedule</Label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Restrict clients booking within</Label>
                <div className="flex items-center space-x-2">
                  <Input type="number" defaultValue="1" className="w-20" />
                  <span>hours of the class start time</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Restrict clients to only</Label>
                <div className="flex items-center space-x-2">
                  <Input type="number" defaultValue="1" className="w-20" />
                  <span>class bookings per day</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Other Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Other Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox />
              <Label>Hide/disallow online Store purchases for 'Lead' clients</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox />
              <Label>Disallow clients from paying custom amounts online</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox />
              <Label>Allow clients to create and edit 'Assessments'</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox />
              <Label>When clients login to the Client Area website from a mobile device, prompt with the option to download the Mobile App</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox />
              <Label>Disallow clients from adding family members to their account</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox />
              <Label>Restrict clients from being able to update their 'My Profile' details (read-only)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox />
              <Label>Restrict clients from being able to update their 'Personal Info' details (read-only)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox />
              <Label>Restrict clients from being able to update their 'Payment Method' details (read-only)</Label>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium">Order of Store item types</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="w-20">1.</span>
                <Input defaultValue="Packages" />
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-20">2.</span>
                <Input defaultValue="Memberships" />
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-20">3.</span>
                <Input defaultValue="Products" />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium">Display the following custom text on the Client Area Website</h4>
            <Textarea placeholder="Enter your custom text..." rows={3} />
          </div>

          <Button>
            <Save className="h-4 w-4 mr-2" />
            Save Other Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Configure your business settings and preferences</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap space-x-1 bg-muted p-1 rounded-lg mb-8 w-fit">
          {[
            { id: "business", label: "Business Info", icon: Building2 },
            { id: "clientarea", label: "Client Area", icon: Globe },
            { id: "staff", label: "Staff", icon: Users },
            { id: "hours", label: "Working Hours", icon: Clock },
            { id: "notifications", label: "Notifications", icon: Bell },
            { id: "payments", label: "Payment Methods", icon: CreditCard },
            { id: "tax", label: "Tax & Invoicing", icon: FileText }
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              onClick={() => setActiveTab(tab.id as any)}
              className="flex items-center space-x-2"
              size="sm"
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </Button>
          ))}
        </div>

        {/* Content */}
        <div>
          {activeTab === "business" && renderBusinessInfo()}
          {activeTab === "clientarea" && renderClientArea()}
          {activeTab === "staff" && renderStaffManagement()}
          {activeTab === "hours" && renderWorkingHours()}
          {activeTab === "notifications" && renderNotifications()}
          {activeTab === "payments" && renderPaymentMethods()}
          {activeTab === "tax" && renderTaxSettings()}
        </div>
      </div>
    </div>
  );
};

export default Settings;