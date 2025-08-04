import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Bell, Calendar, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ExpiringPackage {
  id: string;
  client_id: string;
  sessions_remaining: number;
  expiry_date: string;
  status: string;
  packages: {
    name: string;
    sessions_included: number;
  };
  clients: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const PackageExpiryNotifications = () => {
  const [expiringPackages, setExpiringPackages] = useState<ExpiringPackage[]>([]);
  const [lowSessionPackages, setLowSessionPackages] = useState<ExpiringPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);

      // Check for packages expiring in 2 weeks
      const twoWeeksFromNow = new Date();
      twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

      // Get packages expiring in 2 weeks
      const { data: expiring, error: expiringError } = await supabase
        .from("client_packages")
        .select(`
          id,
          client_id,
          sessions_remaining,
          expiry_date,
          status,
          packages (
            name,
            sessions_included
          ),
          clients (
            first_name,
            last_name,
            email
          )
        `)
        .eq("status", "active")
        .lte("expiry_date", twoWeeksFromNow.toISOString().split('T')[0])
        .gt("expiry_date", new Date().toISOString().split('T')[0]);

      if (expiringError) throw expiringError;

      // Get packages with 3 or fewer sessions remaining
      const { data: lowSessions, error: lowSessionError } = await supabase
        .from("client_packages")
        .select(`
          id,
          client_id,
          sessions_remaining,
          expiry_date,
          status,
          packages (
            name,
            sessions_included
          ),
          clients (
            first_name,
            last_name,
            email
          )
        `)
        .eq("status", "active")
        .lte("sessions_remaining", 3)
        .gt("sessions_remaining", 0);

      if (lowSessionError) throw lowSessionError;

      setExpiringPackages(expiring || []);
      setLowSessionPackages(lowSessions || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast({
        title: "Error",
        description: "Failed to load package notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendNotifications = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('No authentication token available');
      }

      const { data, error } = await supabase.functions.invoke('package-expiry-notifications', {
        body: { manual_trigger: true }
      });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Notification emails sent successfully`,
      });
    } catch (error) {
      console.error("Error sending notifications:", error);
      toast({
        title: "Error",
        description: "Failed to send notifications",
        variant: "destructive",
      });
    }
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    return Math.ceil(
      (new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded animate-pulse"></div>
        <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
      </div>
    );
  }

  const totalNotifications = expiringPackages.length + lowSessionPackages.length;

  if (totalNotifications === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5 text-amber-500" />
          <h3 className="font-semibold">Package Notifications</h3>
          <Badge variant="secondary">{totalNotifications}</Badge>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={sendNotifications}
          className="text-xs"
        >
          Send Email Alerts
        </Button>
      </div>

      {/* Expiring Packages */}
      {expiringPackages.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-amber-600 flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            Packages Expiring Soon
          </h4>
          {expiringPackages.map((pkg) => {
            const daysUntilExpiry = getDaysUntilExpiry(pkg.expiry_date);
            return (
              <Alert key={pkg.id} className="border-amber-200 bg-amber-50">
                <AlertDescription>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">
                        {pkg.clients.first_name} {pkg.clients.last_name}
                      </span>
                      <span className="text-muted-foreground mx-2">•</span>
                      <span className="text-sm">{pkg.packages.name}</span>
                    </div>
                    <div className="text-right text-sm">
                      <div className="text-amber-600 font-medium">
                        {daysUntilExpiry} days left
                      </div>
                      <div className="text-muted-foreground">
                        {pkg.sessions_remaining} sessions remaining
                      </div>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            );
          })}
        </div>
      )}

      {/* Low Session Packages */}
      {lowSessionPackages.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-orange-600 flex items-center">
            <Users className="h-4 w-4 mr-1" />
            Low Session Count
          </h4>
          {lowSessionPackages.map((pkg) => (
            <Alert key={pkg.id} className="border-orange-200 bg-orange-50">
              <AlertDescription>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">
                      {pkg.clients.first_name} {pkg.clients.last_name}
                    </span>
                    <span className="text-muted-foreground mx-2">•</span>
                    <span className="text-sm">{pkg.packages.name}</span>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-orange-600 font-medium">
                      {pkg.sessions_remaining} sessions left
                    </div>
                    <div className="text-muted-foreground">
                      Expires {new Date(pkg.expiry_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}
    </div>
  );
};

export default PackageExpiryNotifications;