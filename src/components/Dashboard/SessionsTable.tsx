import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { 
  Edit, 
  Eye, 
  MoreHorizontal,
  MapPin,
  Clock
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

interface Session {
  id: string;
  date: string;
  time: string;
  client: string;
  location: string;
  duration: string;
  status: "upcoming" | "completed" | "cancelled";
  type: "personal" | "group" | "class";
}

interface SessionsTableProps {
  title: string;
  sessions: Session[];
  showActions?: boolean;
}

const SessionsTable = ({ title, sessions, showActions = true }: SessionsTableProps) => {
  const getStatusBadge = (status: Session['status']) => {
    const variants = {
      upcoming: "default",
      completed: "success", 
      cancelled: "destructive"
    } as const;
    
    return (
      <Badge variant={variants[status] || "default"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTypeBadge = (type: Session['type']) => {
    const colors = {
      personal: "bg-primary/10 text-primary",
      group: "bg-success/10 text-success",
      class: "bg-warning/10 text-warning"
    };
    
    return (
      <Badge className={colors[type]}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Date</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Time</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Client</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Location</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Duration</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Type</th>
                {showActions && (
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="py-4 px-2">
                    <div className="font-medium">{session.date}</div>
                  </td>
                  <td className="py-4 px-2">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      {session.time}
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <div className="font-medium text-card-foreground">{session.client}</div>
                  </td>
                  <td className="py-4 px-2">
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2" />
                      {session.location}
                    </div>
                  </td>
                  <td className="py-4 px-2">{session.duration}</td>
                  <td className="py-4 px-2">
                    {getTypeBadge(session.type)}
                  </td>
                  {showActions && (
                    <td className="py-4 px-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Session
                          </DropdownMenuItem>
                          {title.includes("Past") && (
                            <DropdownMenuItem>
                              Mark as Reconciled
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {sessions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No sessions found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SessionsTable;