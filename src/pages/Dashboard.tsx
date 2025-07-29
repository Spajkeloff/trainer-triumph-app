import { useState, useEffect } from "react";
import SummaryCards from "../components/Dashboard/SummaryCards";
import SessionsTable from "../components/Dashboard/SessionsTable";
import RevenueChart from "../components/Dashboard/RevenueChart";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const [dashboardStats, setDashboardStats] = useState({
    revenue: 0,
    bookings: 0,
    outstanding: 0,
    activeClients: 0,
    leadClients: 0
  });
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [pastSessionsData, setPastSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch revenue
      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'completed');

      const revenue = payments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;

      // Fetch session counts
      const { data: sessions } = await supabase
        .from('sessions')
        .select('id, status');

      const bookings = sessions?.length || 0;

      // Fetch outstanding amounts
      const { data: outstandingPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'pending');

      const outstanding = outstandingPayments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;

      // Fetch active clients
      const { data: activeClients } = await supabase
        .from('clients')
        .select('id')
        .eq('status', 'active');

      const activeClientCount = activeClients?.length || 0;

      // Fetch lead clients
      const { data: leadClients } = await supabase
        .from('clients')
        .select('id')
        .eq('status', 'lead');

      const leadClientCount = leadClients?.length || 0;

      setDashboardStats({
        revenue,
        bookings,
        outstanding,
        activeClients: activeClientCount,
        leadClients: leadClientCount
      });

      // Fetch upcoming sessions
      const today = new Date().toISOString().split('T')[0];
      const { data: upcomingData } = await supabase
        .from('sessions')
        .select(`
          id,
          date,
          start_time,
          end_time,
          location,
          duration,
          status,
          type,
          clients (first_name, last_name)
        `)
        .gte('date', today)
        .eq('status', 'scheduled')
        .order('date')
        .order('start_time')
        .limit(5);

      const formattedUpcoming = upcomingData?.map(session => ({
        id: session.id,
        date: new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: new Date(`2000-01-01T${session.start_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        client: `${session.clients.first_name} ${session.clients.last_name}`,
        location: session.location || 'Main Gym',
        duration: `${session.duration || 60} min`,
        status: session.status,
        type: session.type
      })) || [];

      setUpcomingSessions(formattedUpcoming);

      // Fetch past sessions
      const { data: pastData } = await supabase
        .from('sessions')
        .select(`
          id,
          date,
          start_time,
          end_time,
          location,
          duration,
          status,
          type,
          clients (first_name, last_name)
        `)
        .lt('date', today)
        .eq('status', 'completed')
        .order('date', { ascending: false })
        .order('start_time', { ascending: false })
        .limit(5);

      const formattedPast = pastData?.map(session => ({
        id: session.id,
        date: new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: new Date(`2000-01-01T${session.start_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        client: `${session.clients.first_name} ${session.clients.last_name}`,
        location: session.location || 'Main Gym',
        duration: `${session.duration || 60} min`,
        status: session.status,
        type: session.type
      })) || [];

      setPastSessions(formattedPast);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fakeSessions = [
    {
      id: "1",
      date: "Dec 28, 2024",
      time: "09:00 AM",
      client: "Sarah Johnson",
      location: "Main Gym",
      duration: "60 min",
      status: "upcoming" as const,
      type: "personal" as const
    },
    {
      id: "2", 
      date: "Dec 28, 2024",
      time: "10:30 AM",
      client: "Mike Chen",
      location: "Studio A",
      duration: "45 min",
      status: "upcoming" as const,
      type: "personal" as const
    },
    {
      id: "3",
      date: "Dec 28, 2024", 
      time: "02:00 PM",
      client: "HIIT Class",
      location: "Studio B",
      duration: "45 min",
      status: "upcoming" as const,
      type: "class" as const
    },
    {
      id: "4",
      date: "Dec 29, 2024",
      time: "08:00 AM", 
      client: "Emma Davis",
      location: "Main Gym",
      duration: "60 min",
      status: "upcoming" as const,
      type: "personal" as const
    },
    {
      id: "5",
      date: "Dec 29, 2024",
      time: "11:00 AM",
      client: "Strength Group",
      location: "Weight Room", 
      duration: "90 min",
      status: "upcoming" as const,
      type: "group" as const
    }
  ];

  const fallbackPastSessions = [
    {
      id: "6",
      date: "Dec 27, 2024",
      time: "09:00 AM",
      client: "Alex Martinez",
      location: "Main Gym", 
      duration: "60 min",
      status: "completed" as const,
      type: "personal" as const
    },
    {
      id: "7",
      date: "Dec 27, 2024",
      time: "02:00 PM",
      client: "Lisa Brown",
      location: "Studio A",
      duration: "45 min", 
      status: "completed" as const,
      type: "personal" as const
    },
    {
      id: "8",
      date: "Dec 26, 2024",
      time: "06:00 PM",
      client: "Yoga Flow",
      location: "Studio B",
      duration: "60 min",
      status: "completed" as const,
      type: "class" as const
    },
    {
      id: "9", 
      date: "Dec 26, 2024",
      time: "10:00 AM",
      client: "Tom Wilson",
      location: "Main Gym",
      duration: "60 min",
      status: "completed" as const,
      type: "personal" as const
    }
  ];

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
            sessions={upcomingSessions.length > 0 ? upcomingSessions : fakeSessions} 
          />
          <SessionsTable 
            title="Past Sessions" 
            sessions={pastSessionsData.length > 0 ? pastSessionsData : []} 
          />
        </div>

        {/* Revenue Chart */}
        <RevenueChart />
      </div>
    </div>
  );
};

export default Dashboard;