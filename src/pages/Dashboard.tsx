import SummaryCards from "../components/Dashboard/SummaryCards";
import SessionsTable from "../components/Dashboard/SessionsTable";
import RevenueChart from "../components/Dashboard/RevenueChart";

const Dashboard = () => {
  const upcomingSessions = [
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

  const pastSessions = [
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
        <SummaryCards />

        {/* Sessions Tables */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          <SessionsTable 
            title="Upcoming Sessions" 
            sessions={upcomingSessions.slice(0, 5)} 
          />
          <SessionsTable 
            title="Past Sessions" 
            sessions={pastSessions.slice(0, 5)} 
          />
        </div>

        {/* Revenue Chart */}
        <RevenueChart />
      </div>
    </div>
  );
};

export default Dashboard;