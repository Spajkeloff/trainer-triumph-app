import { useState } from "react";
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
  Save
} from "lucide-react";

const Settings = () => {
  const [activeTab, setActiveTab] = useState<"business" | "staff" | "hours" | "notifications" | "payments" | "tax">("business");

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