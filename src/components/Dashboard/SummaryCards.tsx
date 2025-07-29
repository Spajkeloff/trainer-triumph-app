import { Card, CardContent } from "../ui/card";
import { 
  DollarSign, 
  Calendar, 
  CreditCard, 
  Users, 
  Target,
  TrendingUp,
  TrendingDown
} from "lucide-react";

interface SummaryCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: "up" | "down";
  icon: React.ElementType;
  color: "primary" | "success" | "warning" | "secondary";
}

const SummaryCard = ({ title, value, change, trend, icon: Icon, color }: SummaryCardProps) => {
  const colorClasses = {
    primary: "from-primary to-primary-light text-primary-foreground",
    success: "from-success to-success-light text-success-foreground", 
    warning: "from-warning to-orange-500 text-warning-foreground",
    secondary: "from-gray-600 to-gray-700 text-white"
  };

  return (
    <Card className="overflow-hidden hover:shadow-elevated transition-all duration-300 transform hover:-translate-y-1">
      <CardContent className="p-0">
        <div className="flex items-center">
          <div className={`bg-gradient-to-br ${colorClasses[color]} p-4 flex items-center justify-center`}>
            <Icon className="h-8 w-8" />
          </div>
          <div className="flex-1 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <p className="text-2xl font-bold text-card-foreground">{value}</p>
              </div>
              {change && (
                <div className={`flex items-center text-sm font-medium ${
                  trend === "up" ? "text-success" : "text-destructive"
                }`}>
                  {trend === "up" ? (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  )}
                  {change}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface SummaryCardsProps {
  stats?: {
    revenue: number;
    bookings: number;
    outstanding: number;
    activeClients: number;
    leadClients: number;
  };
}

const SummaryCards = ({ stats }: SummaryCardsProps) => {
  const cards = [
    {
      title: "Revenue (This Month)",
      value: stats ? `AED ${stats.revenue.toLocaleString()}` : "AED 0",
      change: undefined,
      trend: undefined,
      icon: DollarSign,
      color: "primary" as const
    },
    {
      title: "Bookings (This Month)",
      value: stats ? stats.bookings.toString() : "0",
      change: undefined,
      trend: undefined,
      icon: Calendar,
      color: "success" as const
    },
    {
      title: "Outstanding",
      value: stats ? `AED ${stats.outstanding.toLocaleString()}` : "AED 0",
      change: undefined,
      trend: undefined,
      icon: CreditCard,
      color: "warning" as const
    },
    {
      title: "Active Clients",
      value: stats ? stats.activeClients.toString() : "0",
      change: undefined,
      trend: undefined,
      icon: Users,
      color: "secondary" as const
    },
    {
      title: "Lead Clients",
      value: stats ? stats.leadClients.toString() : "0",
      change: undefined,
      trend: undefined,
      icon: Target,
      color: "primary" as const
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      {cards.map((card, index) => (
        <SummaryCard
          key={index}
          title={card.title}
          value={card.value}
          change={card.change}
          trend={card.trend}
          icon={card.icon}
          color={card.color}
        />
      ))}
    </div>
  );
};

export default SummaryCards;