import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useToast } from "@/hooks/use-toast";
import RevenueChart from "../components/Dashboard/RevenueChart";
import { financeService } from "../services/financeService";
import { clientService } from "../services/clientService";
import { sessionService } from "../services/sessionService";
import { packageService } from "../services/packageService";
import { supabase } from "@/integrations/supabase/client";
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Target,
  Download,
  BarChart3
} from "lucide-react";

interface ReportData {
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  clients: {
    total: number;
    active: number;
    leads: number;
    newThisMonth: number;
    inactive: number;
  };
  sessions: {
    total: number;
    completed: number;
    scheduled: number;
    cancelled: number;
  };
  packages: {
    sold: number;
    revenue: number;
    popular: string;
  };
  expenses: {
    total: number;
  };
}

const Reporting = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("thisMonth");
  const { toast } = useToast();

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Calculate date ranges
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Fetch all data using the proper services
      const [
        financeStats,
        transactions,
        expenses,
        clients,
        sessions,
        clientPackages
      ] = await Promise.all([
        financeService.getFinancialStats(),
        financeService.getAllTransactions(),
        financeService.getAllExpenses(),
        clientService.getAll(),
        sessionService.getAll(),
        supabase.from('client_packages').select(`
          *,
          packages (
            name,
            price
          )
        `).then(({ data, error }) => {
          if (error) throw error;
          return data || [];
        })
      ]);

      // Calculate this month and last month revenue from transactions
      const thisMonthTransactions = transactions.filter(t => 
        new Date(t.transaction_date) >= startOfMonth && 
        t.transaction_type === 'payment' && 
        t.status === 'completed'
      );
      
      const lastMonthTransactions = transactions.filter(t => 
        new Date(t.transaction_date) >= startOfLastMonth && 
        new Date(t.transaction_date) <= endOfLastMonth && 
        t.transaction_type === 'payment' && 
        t.status === 'completed'
      );

      const thisMonthRevenue = thisMonthTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      const lastMonthRevenue = lastMonthTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      const revenueGrowth = lastMonthRevenue > 0 ? 
        ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

      // Calculate client metrics
      const totalClients = clients.length;
      const activeClients = clients.filter(c => c.status === 'active').length;
      const leadClients = clients.filter(c => c.status === 'lead').length;
      const inactiveClients = clients.filter(c => c.status === 'inactive').length;
      const newThisMonth = clients.filter(c => 
        new Date(c.created_at) >= startOfMonth
      ).length;

      // Calculate session metrics
      const totalSessions = sessions.length;
      const completedSessions = sessions.filter(s => s.status === 'completed').length;
      const scheduledSessions = sessions.filter(s => s.status === 'scheduled').length;
      const cancelledSessions = sessions.filter(s => s.status === 'cancelled').length;

      // Calculate package metrics
      const soldPackages = clientPackages.length;
      const packageRevenue = clientPackages.reduce((sum, cp) => 
        sum + Number(cp.packages?.price || 0), 0
      );

      // Find most popular package
      const packageCounts: { [key: string]: number } = {};
      clientPackages.forEach(cp => {
        if (cp.packages?.name) {
          packageCounts[cp.packages.name] = (packageCounts[cp.packages.name] || 0) + 1;
        }
      });
      const popularPackage = Object.keys(packageCounts).reduce((a, b) => 
        packageCounts[a] > packageCounts[b] ? a : b, "No packages sold"
      );

      // Calculate total expenses
      const totalExpenses = expenses
        .filter(e => e.status === 'completed')
        .reduce((sum, e) => sum + Number(e.amount), 0);

      setReportData({
        revenue: {
          total: financeStats.totalRevenue,
          thisMonth: thisMonthRevenue,
          lastMonth: lastMonthRevenue,
          growth: revenueGrowth
        },
        clients: {
          total: totalClients,
          active: activeClients,
          leads: leadClients,
          newThisMonth: newThisMonth,
          inactive: inactiveClients
        },
        sessions: {
          total: totalSessions,
          completed: completedSessions,
          scheduled: scheduledSessions,
          cancelled: cancelledSessions
        },
        packages: {
          sold: soldPackages,
          revenue: packageRevenue,
          popular: popularPackage
        },
        expenses: {
          total: totalExpenses
        }
      });

    } catch (error) {
      console.error('Error fetching report data:', error);
      toast({
        title: "Error",
        description: "Failed to load report data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Reporting</h1>
            <p className="text-muted-foreground">Business analytics and performance insights</p>
          </div>
          <div className="flex gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last30days">Last 30 days</SelectItem>
                <SelectItem value="last14days">Last 14 days</SelectItem>
                <SelectItem value="last7days">Last 7 days</SelectItem>
                <SelectItem value="lastmonth">Last month</SelectItem>
                <SelectItem value="lastyear">Last year</SelectItem>
                <SelectItem value="monthtodate">Month to date</SelectItem>
                <SelectItem value="yeartodate">Year to date</SelectItem>
                <SelectItem value="alltime">All time</SelectItem>
                <SelectItem value="specific">Specific date range</SelectItem>
              </SelectContent>
            </Select>
            <Button className="bg-cyan-500 hover:bg-cyan-600">
              Generate report
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">AED {reportData?.revenue.total.toLocaleString()}</p>
                  <div className="flex items-center mt-2">
                    {reportData?.revenue.growth > 0 ? (
                      <TrendingUp className="h-4 w-4 text-success mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-destructive mr-1" />
                    )}
                    <span className={`text-sm ${reportData?.revenue.growth > 0 ? 'text-success' : 'text-destructive'}`}>
                      {Math.abs(reportData?.revenue.growth || 0).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                  <p className="text-2xl font-bold">{reportData?.clients.total}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {reportData?.clients.newThisMonth} new this month
                  </p>
                </div>
                <Users className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
                  <p className="text-2xl font-bold">{reportData?.sessions.total}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {reportData?.sessions.completed} completed
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Packages Sold</p>
                  <p className="text-2xl font-bold">{reportData?.packages.sold}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    AED {reportData?.packages.revenue.toLocaleString()} revenue
                  </p>
                </div>
                <Target className="h-8 w-8 text-secondary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Reports */}
        <Tabs defaultValue="summary" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="schedule">Daily Schedule</TabsTrigger>
            <TabsTrigger value="sessions">Session/Class Summary</TabsTrigger>
            <TabsTrigger value="clients">Client List</TabsTrigger>
            <TabsTrigger value="packages">Packages & Memberships</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Clients Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Clients</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">{reportData?.clients.active}</p>
                      <p className="text-sm text-muted-foreground">Active clients</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{reportData?.clients.leads}</p>
                      <p className="text-sm text-muted-foreground">Lead clients</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{reportData?.clients.inactive}</p>
                      <p className="text-sm text-muted-foreground">Inactive clients</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Services Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">0</p>
                      <p className="text-sm text-muted-foreground">Memberships assigned</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{reportData?.packages.sold}</p>
                      <p className="text-sm text-muted-foreground">Packages assigned</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">0</p>
                      <p className="text-sm text-muted-foreground">Products sold</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bookings Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">{reportData?.sessions.total}</p>
                      <p className="text-sm text-muted-foreground">Session bookings</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">0</p>
                      <p className="text-sm text-muted-foreground">Class bookings</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{reportData?.sessions.total}</p>
                      <p className="text-sm text-muted-foreground">Total bookings</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Finances Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Finances</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">AED {reportData?.revenue.total.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Payments recorded</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">AED {reportData?.expenses.total.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Expenses recorded</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Daily schedule report will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Session/Class Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Sessions</p>
                    <p className="text-xl font-bold">{reportData?.sessions.total}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-xl font-bold text-success">{reportData?.sessions.completed}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Scheduled</p>
                    <p className="text-xl font-bold text-warning">{reportData?.sessions.scheduled}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cancelled</p>
                    <p className="text-xl font-bold text-destructive">{reportData?.sessions.cancelled}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Client Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Active Clients</span>
                      <Badge className="bg-success">{reportData?.clients.active}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Lead Clients</span>
                      <Badge variant="outline">{reportData?.clients.leads}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Session Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-xl font-bold">{reportData?.sessions.total}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-xl font-bold text-success">{reportData?.sessions.completed}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Scheduled</p>
                    <p className="text-xl font-bold text-warning">{reportData?.sessions.scheduled}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cancelled</p>
                    <p className="text-xl font-bold text-destructive">{reportData?.sessions.cancelled}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="packages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Packages & Memberships</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Packages Sold</p>
                    <p className="text-xl font-bold">{reportData?.packages.sold}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Revenue Generated</p>
                    <p className="text-xl font-bold">AED {reportData?.packages.revenue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Most Popular</p>
                    <p className="text-xl font-bold">{reportData?.packages.popular}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Report</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Attendance tracking report will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Reporting;