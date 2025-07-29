import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AddPaymentModal from "@/components/AddPaymentModal";
import { 
  DollarSign,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Calendar,
  FileText,
  Plus,
  Download,
  Search,
  Filter
} from "lucide-react";
import { Input } from "../components/ui/input";
import {
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";

const Finances = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "payments" | "invoices" | "reports">("overview");
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [financialStats, setFinancialStats] = useState({
    totalRevenue: 0,
    netProfit: 0,
    outstanding: 0
  });
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);

      // Fetch payments for revenue calculation
      const { data: payments } = await supabase
        .from('payments')
        .select(`
          *,
          clients (first_name, last_name)
        `)
        .order('payment_date', { ascending: false });

      const totalRevenue = payments?.filter(p => p.amount > 0).reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const outstanding = payments?.filter(p => p.status === 'pending' && p.amount > 0).reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      
      setFinancialStats({
        totalRevenue,
        netProfit: totalRevenue * 0.7, // Assume 70% profit margin
        outstanding
      });

      // Format recent payments
      const formattedPayments = payments?.slice(0, 10).map(payment => ({
        id: payment.id,
        client: payment.clients ? `${payment.clients.first_name} ${payment.clients.last_name}` : 'Unknown Client',
        amount: `AED ${Math.abs(payment.amount).toLocaleString()}`,
        method: payment.payment_method || 'Unknown',
        status: payment.status,
        date: new Date(payment.payment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        service: payment.description || 'Service Payment',
        type: payment.amount > 0 ? 'payment' : 'charge'
      })) || [];

      setRecentPayments(formattedPayments);

    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast({
        title: "Error",
        description: "Failed to load financial data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Chart data (keeping sample for now until more complex reporting is implemented)
  const revenueData = [
    { month: "Jan", revenue: 28500, expenses: 8400, profit: 20100 },
    { month: "Feb", revenue: 32400, expenses: 9200, profit: 23200 },
    { month: "Mar", revenue: 38100, expenses: 10500, profit: 27600 },
    { month: "Apr", revenue: 35600, expenses: 9800, profit: 25800 },
    { month: "May", revenue: 41200, expenses: 11200, profit: 30000 },
    { month: "Jun", revenue: 44800, expenses: 12100, profit: 32700 },
    { month: "Jul", revenue: 42300, expenses: 11800, profit: 30500 },
    { month: "Aug", revenue: 46700, expenses: 12800, profit: 33900 },
    { month: "Sep", revenue: 48200, expenses: 13200, profit: 35000 },
    { month: "Oct", revenue: 51800, expenses: 14100, profit: 37700 },
    { month: "Nov", revenue: 49600, expenses: 13500, profit: 36100 },
    { month: "Dec", revenue: 45750, expenses: 12900, profit: 32850 }
  ];

  const expenseBreakdown = [
    { name: "Equipment", value: 35, color: "#1a73e8" },
    { name: "Rent", value: 30, color: "#48bb78" },
    { name: "Marketing", value: 15, color: "#ed8936" },
    { name: "Utilities", value: 12, color: "#9f7aea" },
    { name: "Other", value: 8, color: "#718096" }
  ];

  // Removed static recentPayments - now using state

  const pendingInvoices = [
    {
      id: "INV-001",
      client: "Fatima Al-Rashid",
      amount: "AED 1,500",
      dueDate: "Jan 5, 2025",
      status: "overdue",
      service: "Personal Training Sessions"
    },
    {
      id: "INV-002",
      client: "Mohammed Al-Kaabi",
      amount: "AED 850",
      dueDate: "Jan 10, 2025",
      status: "pending",
      service: "Group Class Membership"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-success text-success-foreground">Completed</Badge>;
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "overdue":
        return <Badge className="bg-destructive text-destructive-foreground">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-primary">AED {financialStats.totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-success flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12.5% from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
                <p className="text-2xl font-bold text-success">AED {financialStats.netProfit.toLocaleString()}</p>
                <p className="text-sm text-success flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +8.2% from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Outstanding</p>
                <p className="text-2xl font-bold text-warning">AED {financialStats.outstanding.toLocaleString()}</p>
                <p className="text-sm text-destructive flex items-center mt-1">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  -15.3% from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue & Profit Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => `${value / 1000}k`} />
                  <Tooltip formatter={(value: any) => [`AED ${value.toLocaleString()}`, ""]} />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#1a73e8" 
                    strokeWidth={2}
                    name="Revenue"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#48bb78" 
                    strokeWidth={2}
                    name="Profit"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {expenseBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderPayments = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Recent Payments</h2>
        <Button onClick={() => setShowAddPayment(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Record Payment
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {recentPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{payment.client}</h3>
                    {getStatusBadge(payment.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{payment.service}</p>
                  <p className="text-sm text-muted-foreground">
                    {payment.date} • {payment.method}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{payment.amount}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderInvoices = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Invoices</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingInvoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{invoice.client}</h3>
                    {getStatusBadge(invoice.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{invoice.service}</p>
                  <p className="text-sm text-muted-foreground">
                    Invoice {invoice.id} • Due: {invoice.dueDate}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{invoice.amount}</p>
                  <Button size="sm" variant="outline" className="mt-2">
                    Send Reminder
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Financial Reports</h2>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-elevated transition-all duration-300 cursor-pointer">
          <CardContent className="p-6 text-center">
            <DollarSign className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Revenue Report</h3>
            <p className="text-sm text-muted-foreground mb-4">Detailed revenue breakdown by services and time periods</p>
            <Button variant="outline" size="sm">Generate</Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-elevated transition-all duration-300 cursor-pointer">
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-12 w-12 text-success mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Profit & Loss</h3>
            <p className="text-sm text-muted-foreground mb-4">Comprehensive P&L statement with expense analysis</p>
            <Button variant="outline" size="sm">Generate</Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-elevated transition-all duration-300 cursor-pointer">
          <CardContent className="p-6 text-center">
            <CreditCard className="h-12 w-12 text-warning mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Outstanding Report</h3>
            <p className="text-sm text-muted-foreground mb-4">Track unpaid invoices and overdue accounts</p>
            <Button variant="outline" size="sm">Generate</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Finances</h1>
            <p className="text-muted-foreground">Track revenue, manage payments, and generate financial reports</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg mb-8 w-fit">
          {[
            { id: "overview", label: "Overview" },
            { id: "payments", label: "Payments" },
            { id: "invoices", label: "Invoices" },
            { id: "reports", label: "Reports" }
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              onClick={() => setActiveTab(tab.id as any)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Content */}
        <div>
          {activeTab === "overview" && renderOverview()}
          {activeTab === "payments" && renderPayments()}
          {activeTab === "invoices" && renderInvoices()}
          {activeTab === "reports" && renderReports()}
        </div>
      </div>

      {/* Add Payment Modal */}
      <AddPaymentModal
        isOpen={showAddPayment}
        onClose={() => {
          setShowAddPayment(false);
          setSelectedClientId("");
        }}
        clientId={selectedClientId}
        onSuccess={fetchFinancialData}
      />
    </div>
  );
};

export default Finances;