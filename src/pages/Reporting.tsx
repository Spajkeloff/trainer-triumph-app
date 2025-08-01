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
            <h1 className="text-3xl font-bold text-foreground mb-2">Business Report</h1>
            <p className="text-muted-foreground">Comprehensive business analytics and performance insights</p>
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
              <Download className="h-4 w-4 mr-2" />
              Export Report
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

        {/* Comprehensive Business Report */}
        <div className="space-y-8">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Revenue Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueChart />
            </CardContent>
          </Card>

          {/* Business Metrics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Financial Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Revenue</span>
                  <span className="font-bold">AED {reportData?.revenue.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">This Month</span>
                  <span className="font-bold">AED {reportData?.revenue.thisMonth.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Last Month</span>
                  <span className="font-bold">AED {reportData?.revenue.lastMonth.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Expenses</span>
                  <span className="font-bold">AED {reportData?.expenses.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-muted-foreground">Net Profit</span>
                  <span className="font-bold text-success">
                    AED {(reportData?.revenue.total - reportData?.expenses.total).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Growth Rate</span>
                  <div className="flex items-center gap-1">
                    {reportData?.revenue.growth > 0 ? (
                      <TrendingUp className="h-4 w-4 text-success" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    )}
                    <span className={`font-bold ${reportData?.revenue.growth > 0 ? 'text-success' : 'text-destructive'}`}>
                      {Math.abs(reportData?.revenue.growth || 0).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Client Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Clients</span>
                  <span className="font-bold">{reportData?.clients.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Active Clients</span>
                  <Badge className="bg-success">{reportData?.clients.active}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Lead Clients</span>
                  <Badge variant="outline">{reportData?.clients.leads}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Inactive Clients</span>
                  <Badge variant="secondary">{reportData?.clients.inactive}</Badge>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-muted-foreground">New This Month</span>
                  <span className="font-bold text-success">{reportData?.clients.newThisMonth}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Client Retention</span>
                  <span className="font-bold">
                    {reportData?.clients.total > 0 
                      ? ((reportData.clients.active / reportData.clients.total) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Session Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Session Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Sessions</span>
                  <span className="font-bold">{reportData?.sessions.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Completed</span>
                  <Badge className="bg-success">{reportData?.sessions.completed}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Scheduled</span>
                  <Badge className="bg-warning">{reportData?.sessions.scheduled}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Cancelled</span>
                  <Badge variant="destructive">{reportData?.sessions.cancelled}</Badge>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-muted-foreground">Completion Rate</span>
                  <span className="font-bold text-success">
                    {reportData?.sessions.total > 0 
                      ? ((reportData.sessions.completed / reportData.sessions.total) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Avg Sessions/Client</span>
                  <span className="font-bold">
                    {reportData?.clients.active > 0 
                      ? (reportData.sessions.total / reportData.clients.active).toFixed(1)
                      : 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Package Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Package Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Packages Sold</span>
                  <span className="font-bold">{reportData?.packages.sold}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Package Revenue</span>
                  <span className="font-bold">AED {reportData?.packages.revenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Most Popular</span>
                  <span className="font-bold text-primary">{reportData?.packages.popular}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-muted-foreground">Avg Package Value</span>
                  <span className="font-bold">
                    AED {reportData?.packages.sold > 0 
                      ? (reportData.packages.revenue / reportData.packages.sold).toLocaleString()
                      : 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Package Adoption</span>
                  <span className="font-bold">
                    {reportData?.clients.total > 0 
                      ? ((reportData.packages.sold / reportData.clients.total) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Key Performance Indicators */}
            <Card>
              <CardHeader>
                <CardTitle>Key Performance Indicators</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Revenue per Client</span>
                  <span className="font-bold">
                    AED {reportData?.clients.total > 0 
                      ? (reportData.revenue.total / reportData.clients.total).toLocaleString()
                      : 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Revenue per Session</span>
                  <span className="font-bold">
                    AED {reportData?.sessions.completed > 0 
                      ? (reportData.revenue.total / reportData.sessions.completed).toLocaleString()
                      : 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Monthly Growth</span>
                  <div className="flex items-center gap-1">
                    {reportData?.revenue.growth > 0 ? (
                      <TrendingUp className="h-4 w-4 text-success" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    )}
                    <span className={`font-bold ${reportData?.revenue.growth > 0 ? 'text-success' : 'text-destructive'}`}>
                      {Math.abs(reportData?.revenue.growth || 0).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-muted-foreground">Business Health</span>
                  <Badge className={`${
                    (reportData?.revenue.growth || 0) > 0 && 
                    (reportData?.sessions.completed || 0) > (reportData?.sessions.cancelled || 0) &&
                    (reportData?.clients.active || 0) > (reportData?.clients.inactive || 0)
                      ? 'bg-success' : 'bg-warning'
                  }`}>
                    {(reportData?.revenue.growth || 0) > 0 && 
                     (reportData?.sessions.completed || 0) > (reportData?.sessions.cancelled || 0) &&
                     (reportData?.clients.active || 0) > (reportData?.clients.inactive || 0)
                      ? 'Excellent' : 'Good'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Business Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Business Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span>Strong client retention at {reportData?.clients.total > 0 
                      ? ((reportData.clients.active / reportData.clients.total) * 100).toFixed(0)
                      : 0}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Average {reportData?.clients.active > 0 
                      ? (reportData.sessions.total / reportData.clients.active).toFixed(1)
                      : 0} sessions per active client</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-warning rounded-full"></div>
                    <span>Session completion rate at {reportData?.sessions.total > 0 
                      ? ((reportData.sessions.completed / reportData.sessions.total) * 100).toFixed(0)
                      : 0}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-secondary rounded-full"></div>
                    <span>Package adoption rate at {reportData?.clients.total > 0 
                      ? ((reportData.packages.sold / reportData.clients.total) * 100).toFixed(0)
                      : 0}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reporting;