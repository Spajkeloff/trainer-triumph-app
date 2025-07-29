import { useState, useEffect } from "react";
import SummaryCards from "../components/Dashboard/SummaryCards";
import SessionsTable from "../components/Dashboard/SessionsTable";
import RevenueChart from "../components/Dashboard/RevenueChart";
import { dashboardService } from "@/services/dashboardService";

const Dashboard = () => {
  const [dashboardStats, setDashboardStats] = useState({
    revenue: 0,
    bookings: 0,
    outstanding: 0,
    activeClients: 0,
    leadClients: 0
  });
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch dashboard stats and sessions in parallel
      const [stats, upcoming, recent] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getUpcomingSessions(5),
        dashboardService.getRecentSessions(5)
      ]);

      // Set stats for summary cards
      setDashboardStats({
        revenue: stats.financial.totalRevenue,
        bookings: stats.sessions.total,
        outstanding: stats.financial.outstanding,
        activeClients: stats.clients.active,
        leadClients: stats.clients.leads
      });

      setUpcomingSessions(upcoming);
      setRecentSessions(recent);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fallback sessions for empty state
  const fallbackSessions = [
    {
      id: "demo-1",
      date: "No sessions found",
      time: "",
      client: "Book your first session",
      location: "",
      duration: "",
      status: "upcoming" as const,
      type: "personal" as const
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
              <div className="h-64 bg-muted rounded"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening with your training business.</p>
        </div>

        {/* Summary Cards */}
        <SummaryCards stats={dashboardStats} />

        {/* Sessions Tables */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          <SessionsTable 
            title="Upcoming Sessions" 
            sessions={upcomingSessions.length > 0 ? upcomingSessions : fallbackSessions} 
          />
          <SessionsTable 
            title="Recent Sessions" 
            sessions={recentSessions.length > 0 ? recentSessions : []} 
          />
        </div>

        {/* Revenue Chart */}
        <RevenueChart />
      </div>
    </div>
  );
};

export default Dashboard;