import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Package, 
  Clock, 
  Calendar,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface ClientPackage {
  id: string;
  package_id: string;
  sessions_remaining: number;
  purchase_date: string;
  expiry_date: string;
  status: 'active' | 'expired' | 'cancelled';
  packages: {
    name: string;
    description?: string;
    sessions_included: number;
    price: number;
  };
}

const MyPackages = () => {
  const [packages, setPackages] = useState<ClientPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchMyPackages();
  }, [user]);

  const fetchMyPackages = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get current user's profile to get client_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        throw new Error('Profile not found');
      }

      // Fetch client packages with package details
      const { data, error } = await supabase
        .from('client_packages')
        .select(`
          *,
          packages (
            name,
            description,
            sessions_included,
            price
          )
        `)
        .eq('client_id', profile.id)
        .order('purchase_date', { ascending: false });

      if (error) throw error;
      setPackages(data as ClientPackage[] || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
      toast({
        title: "Error",
        description: "Failed to load your packages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success text-success-foreground';
      case 'expired':
        return 'bg-destructive text-destructive-foreground';
      case 'cancelled':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'expired':
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-8"></div>
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Packages</h1>
        <p className="text-muted-foreground">
          View your purchased training packages and track your progress.
        </p>
      </div>

      {packages.length > 0 ? (
        <div className="space-y-6">
          {packages.map((pkg) => {
            const progressPercentage = pkg.packages ? 
              ((pkg.packages.sessions_included - pkg.sessions_remaining) / pkg.packages.sessions_included) * 100 : 0;
            const isExpiring = isExpiringSoon(pkg.expiry_date);
            
            return (
              <Card key={pkg.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl flex items-center">
                        <Package className="h-5 w-5 mr-2 text-primary" />
                        {pkg.packages?.name || 'Unknown Package'}
                      </CardTitle>
                      {pkg.packages?.description && (
                        <p className="text-muted-foreground mt-1">{pkg.packages.description}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {isExpiring && pkg.status === 'active' && (
                        <Badge variant="outline" className="border-warning text-warning">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Expiring Soon
                        </Badge>
                      )}
                      <Badge className={getStatusColor(pkg.status)}>
                        {getStatusIcon(pkg.status)}
                        <span className="ml-1 capitalize">{pkg.status}</span>
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Progress Section */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Sessions Progress</span>
                        <span className="font-medium">
                          {pkg.packages ? pkg.packages.sessions_included - pkg.sessions_remaining : 0} / {pkg.packages?.sessions_included || 0} completed
                        </span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                    </div>

                    {/* Package Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="flex items-center justify-center mb-2">
                          <Calendar className="h-4 w-4 text-primary mr-1" />
                          <span className="text-sm font-medium">Sessions Remaining</span>
                        </div>
                        <p className="text-2xl font-bold text-primary">{pkg.sessions_remaining}</p>
                      </div>
                      
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="flex items-center justify-center mb-2">
                          <Clock className="h-4 w-4 text-primary mr-1" />
                          <span className="text-sm font-medium">Expiry Date</span>
                        </div>
                        <p className="text-lg font-semibold">
                          {new Date(pkg.expiry_date).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="flex items-center justify-center mb-2">
                          <Package className="h-4 w-4 text-primary mr-1" />
                          <span className="text-sm font-medium">Purchase Date</span>
                        </div>
                        <p className="text-lg font-semibold">
                          {new Date(pkg.purchase_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Package Value */}
                    {pkg.packages?.price && (
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Package Value</span>
                          <span className="text-lg font-bold">AED {pkg.packages.price}</span>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons - CLIENT ONLY actions */}
                    {pkg.status === 'active' && pkg.sessions_remaining > 0 && (
                      <div className="flex space-x-2">
                        <Button className="flex-1">
                          <Calendar className="h-4 w-4 mr-2" />
                          Book Session
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-16">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No packages purchased yet</h2>
            <p className="text-muted-foreground mb-6">
              Browse our available training packages to get started with your fitness journey.
            </p>
            <Button>
              <Package className="h-4 w-4 mr-2" />
              Browse Packages
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MyPackages;